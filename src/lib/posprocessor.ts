import {
  serialization,
  loadLayersModel,
  cumsum,
  LayersModel,
  Tensor,
  mean,
  sub,
  reshape,
  Rank
} from '@tensorflow/tfjs';
import MovingAvgProcessor, {
  MovingAvgProcessorInteface
} from './moveAvgProcessor';
import TSM from '../tensorflow/TSM';
import AttentionMask from '../tensorflow/AttentionMask';
import { BATCHSIZE } from '../constant';
import { TensorStoreInterface } from './tensorStore';

const path = 'model.json';

export interface PosprocessorInteface {
  compute(normalizedBatch: Tensor<Rank>, rawBatch: Tensor<Rank>): void;
}

class Posprocessor implements PosprocessorInteface {
  tensorStore: TensorStoreInterface;

  rppgAvgProcessor: MovingAvgProcessorInteface;

  respAvgProcessor: MovingAvgProcessor;

  model: LayersModel | null;

  constructor(tensorStore: TensorStoreInterface) {
    this.tensorStore = tensorStore;
    this.rppgAvgProcessor = new MovingAvgProcessor();
    this.respAvgProcessor = new MovingAvgProcessor();
    this.model = null;
  }

  reset = () => {
    this.rppgAvgProcessor.reset();
    this.respAvgProcessor.reset();
  };

  loadModel = async () => {
    if (this.model === null) {
      serialization.registerClass(TSM);
      serialization.registerClass(AttentionMask);
      this.model = await loadLayersModel(path);
      console.log('model loaded succesfully');
    }
    return true;
  };

  compute = (normalizedBatch: Tensor<Rank>, rawBatch: Tensor<Rank>) => {
    if (this.model) {
      const rppg = this.model.predict([normalizedBatch, rawBatch]) as Tensor<
        Rank
      >;
      // const rppgCumsum = cumsum(reshape(rppg, [-1, 1]), 0);
      const rppgData = rppg.dataSync();
      this.tensorStore.addRppgPltData(rppgData);
      
      // Calculate heart rate from rPPG signal
      this.calculateHeartRate(rppgData);
      
      // Calculate RR intervals
      this.calculateRRIntervals(rppgData);
    }
  };

  private calculateHeartRate = (rppgData: TypedArray) => {
    // Simple heart rate calculation from rPPG signal
    // In a real implementation, this would use peak detection
    const signal = Array.from(rppgData);
    const peaks = this.findPeaks(signal);
    
    if (peaks.length >= 2) {
      const intervals = peaks.slice(1).map((peak, i) => peak - peaks[i]);
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const heartRate = 60 / (avgInterval / 30); // Assuming 30 Hz sampling rate
      this.tensorStore.addHeartRate(heartRate);
    }
  };

  private calculateRRIntervals = (rppgData: TypedArray) => {
    // Calculate RR intervals from rPPG signal
    const signal = Array.from(rppgData);
    const peaks = this.findPeaks(signal);
    
    if (peaks.length >= 2) {
      const intervals = peaks.slice(1).map((peak, i) => (peak - peaks[i]) * (1000 / 30)); // Convert to ms
      intervals.forEach(interval => {
        this.tensorStore.addRRInterval(interval);
      });
    }
  };

  private findPeaks = (signal: number[]): number[] => {
    const peaks: number[] = [];
    const threshold = Math.max(...signal) * 0.5;
    
    for (let i = 1; i < signal.length - 1; i++) {
      if (signal[i] > threshold && 
          signal[i] > signal[i - 1] && 
          signal[i] > signal[i + 1]) {
        peaks.push(i);
      }
    }
    
    return peaks;
  };
}

export default Posprocessor;
