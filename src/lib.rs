use wasm_bindgen::prelude::*;
use js_sys::Array;

#[wasm_bindgen]
pub struct BiofeedbackProcessor {
    rr_intervals: Vec<f64>,
    sampling_rate: f64,
    facial_metrics: FacialMetrics,
}

#[derive(Clone)]
struct FacialMetrics {
    muscle_tension: Vec<f64>,
    eye_movement: Vec<f64>,
    blink_rate: Vec<f64>,
    facial_symmetry: Vec<f64>,
}

impl FacialMetrics {
    fn new() -> Self {
        Self {
            muscle_tension: Vec::new(),
            eye_movement: Vec::new(),
            blink_rate: Vec::new(),
            facial_symmetry: Vec::new(),
        }
    }

    fn add_muscle_tension(&mut self, tension: f64) {
        self.muscle_tension.push(tension);
        if self.muscle_tension.len() > 100 {
            self.muscle_tension.remove(0);
        }
    }

    fn add_eye_movement(&mut self, movement: f64) {
        self.eye_movement.push(movement);
        if self.eye_movement.len() > 100 {
            self.eye_movement.remove(0);
        }
    }

    fn add_blink_rate(&mut self, rate: f64) {
        self.blink_rate.push(rate);
        if self.blink_rate.len() > 100 {
            self.blink_rate.remove(0);
        }
    }

    fn add_facial_symmetry(&mut self, symmetry: f64) {
        self.facial_symmetry.push(symmetry);
        if self.facial_symmetry.len() > 100 {
            self.facial_symmetry.remove(0);
        }
    }
}

#[wasm_bindgen]
impl BiofeedbackProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(sampling_rate: f64) -> BiofeedbackProcessor {
        BiofeedbackProcessor {
            rr_intervals: Vec::new(),
            sampling_rate,
            facial_metrics: FacialMetrics::new(),
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

    /// Add facial muscle tension data
    pub fn add_facial_data(&mut self, muscle_tension: f64, eye_movement: f64, blink_rate: f64, facial_symmetry: f64) {
        self.facial_metrics.add_muscle_tension(muscle_tension);
        self.facial_metrics.add_eye_movement(eye_movement);
        self.facial_metrics.add_blink_rate(blink_rate);
        self.facial_metrics.add_facial_symmetry(facial_symmetry);
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

    /// Compute facial muscle tension metrics
    pub fn compute_facial_metrics(&self) -> Result<Array, JsValue> {
        if self.facial_metrics.muscle_tension.is_empty() {
            return Err("No facial data available".into());
        }

        let avg_tension = self.facial_metrics.muscle_tension.iter().sum::<f64>() / self.facial_metrics.muscle_tension.len() as f64;
        let tension_variability = self.compute_variability(&self.facial_metrics.muscle_tension);
        
        let avg_eye_movement = self.facial_metrics.eye_movement.iter().sum::<f64>() / self.facial_metrics.eye_movement.len() as f64;
        let eye_movement_frequency = self.compute_eye_movement_frequency();
        
        let avg_blink_rate = self.facial_metrics.blink_rate.iter().sum::<f64>() / self.facial_metrics.blink_rate.len() as f64;
        let avg_symmetry = self.facial_metrics.facial_symmetry.iter().sum::<f64>() / self.facial_metrics.facial_symmetry.len() as f64;

        let result = Array::new();
        result.push(&JsValue::from_f64(avg_tension));
        result.push(&JsValue::from_f64(tension_variability));
        result.push(&JsValue::from_f64(avg_eye_movement));
        result.push(&JsValue::from_f64(eye_movement_frequency));
        result.push(&JsValue::from_f64(avg_blink_rate));
        result.push(&JsValue::from_f64(avg_symmetry));

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

    /// Compute variability of a signal
    fn compute_variability(&self, signal: &[f64]) -> f64 {
        let mean = signal.iter().sum::<f64>() / signal.len() as f64;
        let variance = signal.iter()
            .map(|&x| (x - mean).powi(2))
            .sum::<f64>() / signal.len() as f64;
        variance.sqrt()
    }

    /// Compute eye movement frequency
    fn compute_eye_movement_frequency(&self) -> f64 {
        if self.facial_metrics.eye_movement.len() < 2 {
            return 0.0;
        }

        let threshold = 0.1; // Threshold for significant eye movement
        let movements = self.facial_metrics.eye_movement.windows(2)
            .filter(|window| (window[1] - window[0]).abs() > threshold)
            .count();

        (movements as f64 / (self.facial_metrics.eye_movement.len() - 1) as f64) * self.sampling_rate
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

#[wasm_bindgen]
pub fn compute_facial_metrics_from_data(
    muscle_tension: &[f64], 
    eye_movement: &[f64], 
    blink_rate: &[f64], 
    facial_symmetry: &[f64]
) -> Result<Array, JsValue> {
    let processor = BiofeedbackProcessor::new(30.0);
    let mut temp_processor = processor;
    
    // Add all data points
    for i in 0..muscle_tension.len() {
        temp_processor.add_facial_data(
            muscle_tension[i],
            eye_movement[i],
            blink_rate[i],
            facial_symmetry[i]
        );
    }
    
    temp_processor.compute_facial_metrics()
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