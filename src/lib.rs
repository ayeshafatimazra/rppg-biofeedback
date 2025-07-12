use wasm_bindgen::prelude::*;
use js_sys::Array;

#[wasm_bindgen]
pub struct BiofeedbackProcessor {
    rr_intervals: Vec<f64>,
    sampling_rate: f64,
}

#[wasm_bindgen]
impl BiofeedbackProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(sampling_rate: f64) -> BiofeedbackProcessor {
        BiofeedbackProcessor {
            rr_intervals: Vec::new(),
            sampling_rate,
        }
    }

    /// Add RR intervals to the processor
    pub fn add_rr_intervals(&mut self, intervals: &[f64]) {
        self.rr_intervals.extend_from_slice(intervals);
    }

    /// Clear stored RR intervals
    pub fn clear_rr_intervals(&mut self) {
        self.rr_intervals.clear();
    }

    /// Compute time-domain HRV metrics (RMSSD and SDNN)
    pub fn compute_hrv(&self) -> Result<Array, JsValue> {
        if self.rr_intervals.len() < 2 {
            return Err("Need at least 2 RR intervals for HRV calculation".into());
        }

        let rmssd = self.compute_rmssd();
        let sdnn = self.compute_sdnn();
        let pnn50 = self.compute_pnn50();

        let result = Array::new();
        result.push(&JsValue::from_f64(rmssd));
        result.push(&JsValue::from_f64(sdnn));
        result.push(&JsValue::from_f64(pnn50));

        Ok(result)
    }

    /// Compute respiratory rate from PPG signal
    pub fn compute_resp_rate(&self, signal: &[f64]) -> Result<f64, JsValue> {
        if signal.len() < 100 {
            return Err("Signal too short for respiratory rate calculation".into());
        }

        // Apply bandpass filter for respiratory frequency range (0.1-0.5 Hz)
        let filtered_signal = self.bandpass_filter(signal, 0.1, 0.5);
        
        // Find peaks in the filtered signal
        let peaks = self.find_peaks(&filtered_signal);
        
        if peaks.len() < 2 {
            return Err("Not enough respiratory peaks detected".into());
        }

        // Calculate respiratory rate from peak intervals
        let intervals: Vec<f64> = peaks.windows(2)
            .map(|window| (window[1] - window[0]) as f64 / self.sampling_rate)
            .collect();

        let avg_interval = intervals.iter().sum::<f64>() / intervals.len() as f64;
        let breaths_per_minute = 60.0 / avg_interval;

        Ok(breaths_per_minute)
    }

    /// Compute RMSSD (Root Mean Square of Successive Differences)
    fn compute_rmssd(&self) -> f64 {
        let differences: Vec<f64> = self.rr_intervals.windows(2)
            .map(|window| window[1] - window[0])
            .collect();

        let sum_squares: f64 = differences.iter().map(|&d| d * d).sum();
        (sum_squares / differences.len() as f64).sqrt()
    }

    /// Compute SDNN (Standard Deviation of NN Intervals)
    fn compute_sdnn(&self) -> f64 {
        let mean = self.rr_intervals.iter().sum::<f64>() / self.rr_intervals.len() as f64;
        let variance = self.rr_intervals.iter()
            .map(|&x| (x - mean).powi(2))
            .sum::<f64>() / self.rr_intervals.len() as f64;
        variance.sqrt()
    }

    /// Compute pNN50 (Percentage of successive RR intervals > 50ms)
    fn compute_pnn50(&self) -> f64 {
        let differences: Vec<f64> = self.rr_intervals.windows(2)
            .map(|window| (window[1] - window[0]).abs())
            .collect();

        let count_gt_50 = differences.iter().filter(|&&d| d > 50.0).count();
        (count_gt_50 as f64 / differences.len() as f64) * 100.0
    }

    /// Simple bandpass filter using moving average
    fn bandpass_filter(&self, signal: &[f64], low_freq: f64, high_freq: f64) -> Vec<f64> {
        let window_size = (self.sampling_rate / (low_freq + high_freq) * 2.0) as usize;
        let window_size = window_size.max(3).min(signal.len() / 4);

        let mut filtered = Vec::with_capacity(signal.len());
        
        for i in 0..signal.len() {
            let start = if i >= window_size { i - window_size } else { 0 };
            let end = (i + window_size + 1).min(signal.len());
            let window_sum: f64 = signal[start..end].iter().sum();
            filtered.push(window_sum / (end - start) as f64);
        }

        filtered
    }

    /// Find peaks in the signal
    fn find_peaks(&self, signal: &[f64]) -> Vec<usize> {
        let mut peaks = Vec::new();
        let threshold = signal.iter().fold(0.0, |a, &b| a.max(b)) * 0.5;

        for i in 1..signal.len() - 1 {
            if signal[i] > threshold && 
               signal[i] > signal[i - 1] && 
               signal[i] > signal[i + 1] {
                peaks.push(i);
            }
        }

        peaks
    }
}

#[wasm_bindgen]
pub fn compute_hrv_metrics(rr_intervals: &[f64]) -> Result<Array, JsValue> {
    let processor = BiofeedbackProcessor::new(30.0); // Default sampling rate
    let mut temp_processor = processor;
    temp_processor.add_rr_intervals(rr_intervals);
    temp_processor.compute_hrv()
}

#[wasm_bindgen]
pub fn compute_respiratory_rate(signal: &[f64], sampling_rate: f64) -> Result<f64, JsValue> {
    let processor = BiofeedbackProcessor::new(sampling_rate);
    processor.compute_resp_rate(signal)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rmssd_calculation() {
        let rr_intervals = vec![800.0, 820.0, 810.0, 830.0, 815.0];
        let processor = BiofeedbackProcessor::new(30.0);
        let mut temp_processor = processor;
        temp_processor.add_rr_intervals(&rr_intervals);
        
        let result = temp_processor.compute_hrv().unwrap();
        let rmssd = result.get(0).as_f64().unwrap();
        
        assert!(rmssd > 0.0);
    }

    #[test]
    fn test_respiratory_rate_calculation() {
        // Create a simple sinusoidal signal simulating breathing
        let mut signal = Vec::new();
        for i in 0..300 {
            let t = i as f64 / 30.0; // 30 Hz sampling rate
            signal.push((2.0 * std::f64::consts::PI * 0.2 * t).sin()); // 0.2 Hz = 12 breaths/min
        }
        
        let processor = BiofeedbackProcessor::new(30.0);
        let result = processor.compute_resp_rate(&signal);
        
        assert!(result.is_ok());
        let resp_rate = result.unwrap();
        assert!(resp_rate > 8.0 && resp_rate < 20.0); // Reasonable range
    }
} 