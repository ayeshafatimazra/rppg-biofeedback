import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './biofeedback.module.scss';
import { HRVMetrics } from '../../lib/wasmInterface';

interface BiofeedbackProps {
  heartRateData: number[];
  rrIntervals: number[];
  isRecording: boolean;
  onBreathingPhaseChange?: (phase: 'inhale' | 'exhale' | 'hold') => void;
}

interface ChartDataPoint {
  time: number;
  heartRate: number;
  respiratoryRate: number;
}

const Biofeedback: React.FC<BiofeedbackProps> = ({
  heartRateData,
  rrIntervals,
  isRecording,
  onBreathingPhaseChange
}) => {
  const [hrvMetrics, setHrvMetrics] = useState<HRVMetrics | null>(null);
  const [respiratoryRate, setRespiratoryRate] = useState<number | null>(null);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'exhale' | 'hold'>('inhale');
  const [breathingTimer, setBreathingTimer] = useState(5);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [stressIndex, setStressIndex] = useState<number>(0);
  
  const breathingIntervalRef = useRef<NodeJS.Timeout>();
  const timeRef = useRef(0);

  // Breathing exercise phases
  const BREATHING_CYCLE = {
    inhale: 5,
    hold: 2,
    exhale: 5
  };

  useEffect(() => {
    if (isRecording) {
      // Update chart data every second
      const interval = setInterval(() => {
        timeRef.current += 1;
        const newDataPoint: ChartDataPoint = {
          time: timeRef.current,
          heartRate: heartRateData[heartRateData.length - 1] || 0,
          respiratoryRate: respiratoryRate || 0
        };
        
        setChartData(prev => {
          const updated = [...prev, newDataPoint];
          // Keep only last 60 seconds of data
          return updated.slice(-60);
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      timeRef.current = 0;
      setChartData([]);
    }
  }, [isRecording, heartRateData, respiratoryRate]);

  // Calculate HRV metrics when RR intervals change
  useEffect(() => {
    if (rrIntervals.length >= 2) {
      // Simple HRV calculation (in real implementation, this would use WASM)
      const differences = rrIntervals.slice(1).map((rr, i) => Math.abs(rr - rrIntervals[i]));
      const rmssd = Math.sqrt(differences.reduce((sum, diff) => sum + diff * diff, 0) / differences.length);
      const mean = rrIntervals.reduce((sum, rr) => sum + rr, 0) / rrIntervals.length;
      const sdnn = Math.sqrt(rrIntervals.reduce((sum, rr) => sum + Math.pow(rr - mean, 2), 0) / rrIntervals.length);
      const pnn50 = (differences.filter(diff => diff > 50).length / differences.length) * 100;

      setHrvMetrics({ rmssd, sdnn, pnn50 });

      // Calculate stress index (simplified)
      const stressIndexValue = Math.max(0, 100 - (rmssd / 10));
      setStressIndex(stressIndexValue);
    }
  }, [rrIntervals]);

  // Calculate respiratory rate from heart rate variability
  useEffect(() => {
    if (heartRateData.length > 30) {
      // Simple respiratory rate estimation from low-frequency HRV
      const recentHR = heartRateData.slice(-30);
      const variability = Math.std(recentHR);
      const estimatedRespRate = 12 + (variability * 2); // Rough estimation
      setRespiratoryRate(Math.max(8, Math.min(20, estimatedRespRate)));
    }
  }, [heartRateData]);

  // Breathing exercise timer
  useEffect(() => {
    if (isRecording) {
      breathingIntervalRef.current = setInterval(() => {
        setBreathingTimer(prev => {
          if (prev <= 1) {
            // Switch breathing phase
            if (breathingPhase === 'inhale') {
              setBreathingPhase('hold');
              onBreathingPhaseChange?.('hold');
              return BREATHING_CYCLE.hold;
            } else if (breathingPhase === 'hold') {
              setBreathingPhase('exhale');
              onBreathingPhaseChange?.('exhale');
              return BREATHING_CYCLE.exhale;
            } else {
              setBreathingPhase('inhale');
              onBreathingPhaseChange?.('inhale');
              return BREATHING_CYCLE.inhale;
            }
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (breathingIntervalRef.current) {
          clearInterval(breathingIntervalRef.current);
        }
      };
    }
  }, [isRecording, breathingPhase, onBreathingPhaseChange]);

  const getBreathingInstruction = () => {
    switch (breathingPhase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
      default:
        return 'Breathe In';
    }
  };

  const getStressLevel = () => {
    if (stressIndex < 30) return 'Low';
    if (stressIndex < 60) return 'Moderate';
    return 'High';
  };

  const getStressColor = () => {
    if (stressIndex < 30) return '#4CAF50';
    if (stressIndex < 60) return '#FF9800';
    return '#F44336';
  };

  return (
    <div className={styles.biofeedbackContainer}>
      <div className={styles.metricsGrid}>
        {/* HRV Metrics */}
        <div className={styles.metricCard}>
          <h3>Heart Rate Variability</h3>
          <div className={styles.metricValue}>
            <div className={styles.metric}>
              <span className={styles.label}>RMSSD:</span>
              <span className={styles.value}>{hrvMetrics?.rmssd.toFixed(1) || '--'} ms</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.label}>SDNN:</span>
              <span className={styles.value}>{hrvMetrics?.sdnn.toFixed(1) || '--'} ms</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.label}>pNN50:</span>
              <span className={styles.value}>{hrvMetrics?.pnn50.toFixed(1) || '--'} %</span>
            </div>
          </div>
        </div>

        {/* Respiratory Rate */}
        <div className={styles.metricCard}>
          <h3>Respiratory Rate</h3>
          <div className={styles.metricValue}>
            <span className={styles.largeValue}>{respiratoryRate?.toFixed(1) || '--'}</span>
            <span className={styles.unit}>breaths/min</span>
          </div>
        </div>

        {/* Stress Index */}
        <div className={styles.metricCard}>
          <h3>Stress Level</h3>
          <div className={styles.stressGauge}>
            <div 
              className={styles.stressBar} 
              style={{ 
                width: `${stressIndex}%`, 
                backgroundColor: getStressColor() 
              }}
            />
            <span className={styles.stressValue}>{getStressLevel()}</span>
          </div>
          <div className={styles.stressScore}>{stressIndex.toFixed(0)}/100</div>
        </div>

        {/* Breathing Exercise */}
        <div className={styles.metricCard}>
          <h3>Paced Breathing</h3>
          <div className={`${styles.breathingCircle} ${styles[breathingPhase]}`}>
            <span className={styles.breathingText}>{getBreathingInstruction()}</span>
            <span className={styles.breathingTimer}>{breathingTimer}s</span>
          </div>
        </div>
      </div>

      {/* Dual-axis Chart */}
      <div className={styles.chartContainer}>
        <h3>Real-time Monitoring</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              label={{ value: 'Time (s)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              yAxisId="left"
              label={{ value: 'Heart Rate (bpm)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              label={{ value: 'Respiratory Rate (breaths/min)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="heartRate" 
              stroke="#ff6b6b" 
              strokeWidth={2}
              dot={false}
              name="Heart Rate"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="respiratoryRate" 
              stroke="#4ecdc4" 
              strokeWidth={2}
              dot={false}
              name="Respiratory Rate"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Add Math.std polyfill
declare global {
  interface Math {
    std(array: number[]): number;
  }
}

Math.std = function(array: number[]): number {
  const mean = array.reduce((sum, val) => sum + val, 0) / array.length;
  const variance = array.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / array.length;
  return Math.sqrt(variance);
};

export default Biofeedback; 