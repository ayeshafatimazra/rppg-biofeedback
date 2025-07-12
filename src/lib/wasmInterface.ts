export interface HRVMetrics {
  rmssd: number;
  sdnn: number;
  pnn50: number;
}

export interface BiofeedbackWASM {
  BiofeedbackProcessor: {
    new(sampling_rate: number): BiofeedbackProcessor;
  };
  compute_hrv_metrics(rr_intervals: Float64Array): [number, number, number];
  compute_respiratory_rate(signal: Float64Array, sampling_rate: number): number;
}

export interface BiofeedbackProcessor {
  add_rr_intervals(intervals: Float64Array): void;
  clear_rr_intervals(): void;
  compute_hrv(): [number, number, number];
  compute_resp_rate(signal: Float64Array): number;
}

declare global {
  interface Window {
    BiofeedbackWASM: BiofeedbackWASM;
  }
}

export class WASMInterface {
  private wasm: BiofeedbackWASM | null = null;
  private processor: BiofeedbackProcessor | null = null;
  private samplingRate: number = 30.0;

  async initialize(): Promise<void> {
    try {
      // Load the WASM module
      const wasmModule = await import('/wasm/rppg_biofeedback_wasm.js');
      this.wasm = wasmModule.default as BiofeedbackWASM;
      this.processor = new this.wasm.BiofeedbackProcessor(this.samplingRate);
      console.log('WASM module loaded successfully');
    } catch (error) {
      console.error('Failed to load WASM module:', error);
      throw error;
    }
  }

  computeHRV(rrIntervals: number[]): HRVMetrics | null {
    if (!this.wasm) {
      console.error('WASM module not initialized');
      return null;
    }

    try {
      const intervalsArray = new Float64Array(rrIntervals);
      const [rmssd, sdnn, pnn50] = this.wasm.compute_hrv_metrics(intervalsArray);
      
      return {
        rmssd,
        sdnn,
        pnn50
      };
    } catch (error) {
      console.error('Error computing HRV metrics:', error);
      return null;
    }
  }

  computeRespiratoryRate(signal: number[]): number | null {
    if (!this.wasm) {
      console.error('WASM module not initialized');
      return null;
    }

    try {
      const signalArray = new Float64Array(signal);
      return this.wasm.compute_respiratory_rate(signalArray, this.samplingRate);
    } catch (error) {
      console.error('Error computing respiratory rate:', error);
      return null;
    }
  }

  addRRIntervals(intervals: number[]): void {
    if (!this.processor) {
      console.error('WASM processor not initialized');
      return;
    }

    try {
      const intervalsArray = new Float64Array(intervals);
      this.processor.add_rr_intervals(intervalsArray);
    } catch (error) {
      console.error('Error adding RR intervals:', error);
    }
  }

  clearRRIntervals(): void {
    if (!this.processor) {
      console.error('WASM processor not initialized');
      return;
    }

    try {
      this.processor.clear_rr_intervals();
    } catch (error) {
      console.error('Error clearing RR intervals:', error);
    }
  }

  getHRVFromProcessor(): HRVMetrics | null {
    if (!this.processor) {
      console.error('WASM processor not initialized');
      return null;
    }

    try {
      const [rmssd, sdnn, pnn50] = this.processor.compute_hrv();
      
      return {
        rmssd,
        sdnn,
        pnn50
      };
    } catch (error) {
      console.error('Error getting HRV from processor:', error);
      return null;
    }
  }

  setSamplingRate(rate: number): void {
    this.samplingRate = rate;
    if (this.wasm) {
      this.processor = new this.wasm.BiofeedbackProcessor(this.samplingRate);
    }
  }
}

export default new WASMInterface(); 