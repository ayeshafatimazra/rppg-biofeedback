import { dispose, Tensor3D, TypedArray } from '@tensorflow/tfjs';

export interface TensorStoreInterface {
  reset(): void;
  getRawTensor(): Tensor3D | null;
  addRppgPltData(data: TypedArray): void;
  addRawTensor(data: Tensor3D): void;
  addRRInterval(interval: number): void;
  addHeartRate(rate: number): void;
  getRRIntervals(): number[];
  getHeartRates(): number[];
  getCurrentHeartRate(): number | null;
  // Facial metrics
  addFacialMetrics(metrics: FacialMetrics): void;
  getFacialMetrics(): FacialMetrics[];
  getCurrentFacialMetrics(): FacialMetrics | null;
}

export interface FacialMetrics {
  muscleTension: number;
  eyeMovement: number;
  blinkRate: number;
  facialSymmetry: number;
  timestamp: number;
}

class TensorStore implements TensorStoreInterface {
  rawFrames: Tensor3D[];

  rppgPltData: number[];

  rrIntervals: number[];

  heartRates: number[];

  facialMetrics: FacialMetrics[];

  initialWait: boolean;

  constructor() {
    this.rawFrames = [];
    this.rppgPltData = [];
    this.rrIntervals = [];
    this.heartRates = [];
    this.facialMetrics = [];
    this.initialWait = true;
  }

  reset = () => {
    this.rawFrames.forEach(f => {
      dispose(f);
    });
    this.rawFrames = [];
    this.rppgPltData = [];
    this.rrIntervals = [];
    this.heartRates = [];
    this.facialMetrics = [];
    this.initialWait = true;
  };

  getRawTensor = () => {
    if (this.rawFrames) {
      const tensor = this.rawFrames.shift() || null;
      return tensor;
    }
    return null;
  };

  addRppgPltData = (data: TypedArray) => {
    this.rppgPltData = [...this.rppgPltData, ...data];
  };

  addRawTensor = (tensor: Tensor3D) => {
    this.rawFrames.push(tensor);
  };

  addRRInterval = (interval: number) => {
    this.rrIntervals.push(interval);
  };

  addHeartRate = (rate: number) => {
    this.heartRates.push(rate);
  };

  addFacialMetrics = (metrics: FacialMetrics) => {
    this.facialMetrics.push(metrics);
    // Keep only last 100 facial metrics to prevent memory issues
    if (this.facialMetrics.length > 100) {
      this.facialMetrics.shift();
    }
  };

  getRRIntervals = () => {
    return [...this.rrIntervals];
  };

  getHeartRates = () => {
    return [...this.heartRates];
  };

  getCurrentHeartRate = () => {
    return this.heartRates.length > 0 ? this.heartRates[this.heartRates.length - 1] : null;
  };

  getFacialMetrics = () => {
    return [...this.facialMetrics];
  };

  getCurrentFacialMetrics = () => {
    return this.facialMetrics.length > 0 ? this.facialMetrics[this.facialMetrics.length - 1] : null;
  };
}

export default new TensorStore();
