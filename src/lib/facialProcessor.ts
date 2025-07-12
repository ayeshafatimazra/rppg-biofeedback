import {
  tidy,
  dispose,
  tensor,
  scalar,
  div,
  sub,
  add,
  moments,
  mean,
  Rank,
  Tensor,
  Tensor3D
} from '@tensorflow/tfjs';
import { TensorStoreInterface, FacialMetrics } from './tensorStore';

export interface FacialProcessorInterface {
  startProcess(): void;
  stopProcess(): void;
  reset(): void;
}

class FacialProcessor implements FacialProcessorInterface {
  private tensorStore: TensorStoreInterface;
  private isProcessing: boolean = false;
  private previousFrame: Tensor<Rank> | null = null;
  private muscleTensionHistory: number[] = [];
  private eyeMovementHistory: number[] = [];
  private blinkHistory: number[] = [];
  private symmetryHistory: number[] = [];

  constructor(tensorStore: TensorStoreInterface) {
    this.tensorStore = tensorStore;
  }

  reset = () => {
    if (this.previousFrame) {
      dispose(this.previousFrame);
    }
    this.previousFrame = null;
    this.isProcessing = false;
    this.muscleTensionHistory = [];
    this.eyeMovementHistory = [];
    this.blinkHistory = [];
    this.symmetryHistory = [];
  };

  startProcess = () => {
    this.isProcessing = true;
    this.process();
  };

  stopProcess = () => {
    this.isProcessing = false;
    this.reset();
  };

  process = () => {
    if (this.isProcessing) {
      const frame = this.tensorStore.getRawTensor();
      if (!frame) {
        setTimeout(() => {
          this.process();
        }, 30);
      } else {
        this.compute(this.previousFrame, frame);
        dispose(frame);
        this.process();
      }
    }
  };

  compute = (previousFrame: Tensor<Rank> | null, currentFrame: Tensor3D) => {
    // Simple facial analysis using basic tensor operations
    const [muscleTension, eyeMovement, blinkRate, facialSymmetry] = tidy(() => {
      // Analyze overall frame variance as muscle tension indicator
      const frameVariance = moments(currentFrame).variance;
      const muscleTension = frameVariance.mul(scalar(100)); // Scale up for visibility
      
      // Simple eye movement detection using frame differences
      let eyeMovement = scalar(0);
      let blinkRate = scalar(0);
      let facialSymmetry = scalar(0.5); // Default symmetry
      
      if (previousFrame) {
        // Calculate frame difference for movement detection
        const frameDiff = sub(currentFrame, previousFrame).abs();
        eyeMovement = frameDiff.mean().mul(scalar(10)); // Scale for visibility
        
        // Simple blink detection based on overall brightness changes
        const currentBrightness = currentFrame.mean();
        const previousBrightness = previousFrame.mean();
        const brightnessChange = sub(currentBrightness, previousBrightness).abs();
        blinkRate = brightnessChange.mul(scalar(5)); // Scale for visibility
        
        // Simple symmetry calculation using left/right halves
        const leftHalf = currentFrame.slice([0, 0, 0], [-1, -1, currentFrame.shape[2] / 2]);
        const rightHalf = currentFrame.slice([0, 0, currentFrame.shape[2] / 2], [-1, -1, -1]);
        const symmetryDiff = sub(leftHalf.mean(), rightHalf.mean()).abs();
        facialSymmetry = sub(scalar(1), symmetryDiff);
        
        dispose(frameDiff);
        dispose(currentBrightness);
        dispose(previousBrightness);
        dispose(brightnessChange);
        dispose(leftHalf);
        dispose(rightHalf);
        dispose(symmetryDiff);
      }
      
      return [muscleTension, eyeMovement, blinkRate, facialSymmetry];
    });

    // Extract scalar values from tensors
    const muscleTensionValue = muscleTension.dataSync()[0];
    const eyeMovementValue = eyeMovement.dataSync()[0];
    const blinkRateValue = blinkRate.dataSync()[0];
    const facialSymmetryValue = facialSymmetry.dataSync()[0];

    // Add to history for smoothing
    this.muscleTensionHistory.push(muscleTensionValue);
    this.eyeMovementHistory.push(eyeMovementValue);
    this.blinkHistory.push(blinkRateValue);
    this.symmetryHistory.push(facialSymmetryValue);

    // Keep only last 30 frames for analysis
    if (this.muscleTensionHistory.length > 30) {
      this.muscleTensionHistory.shift();
      this.eyeMovementHistory.shift();
      this.blinkHistory.shift();
      this.symmetryHistory.shift();
    }

    // Calculate smoothed metrics
    const smoothedTension = this.calculateSmoothedMetric(this.muscleTensionHistory);
    const smoothedEyeMovement = this.calculateSmoothedMetric(this.eyeMovementHistory);
    const smoothedBlinkRate = this.calculateSmoothedMetric(this.blinkHistory);
    const smoothedSymmetry = this.calculateSmoothedMetric(this.symmetryHistory);

    // Add facial metrics to tensor store
    const facialMetrics: FacialMetrics = {
      muscleTension: smoothedTension,
      eyeMovement: smoothedEyeMovement,
      blinkRate: smoothedBlinkRate,
      facialSymmetry: smoothedSymmetry,
      timestamp: Date.now()
    };

    this.tensorStore.addFacialMetrics(facialMetrics);

    dispose(muscleTension);
    dispose(eyeMovement);
    dispose(blinkRate);
    dispose(facialSymmetry);
    this.previousFrame = currentFrame;
  };

  private calculateSmoothedMetric = (history: number[]): number => {
    if (history.length === 0) return 0;
    
    // Use exponential moving average for smoothing
    const alpha = 0.3; // Smoothing factor
    let smoothed = history[0];
    
    for (let i = 1; i < history.length; i++) {
      smoothed = alpha * history[i] + (1 - alpha) * smoothed;
    }
    
    return smoothed;
  };
}

export default FacialProcessor; 