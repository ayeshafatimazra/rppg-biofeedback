import React, { useState, useEffect, useRef } from 'react';
import styles from './biofeedback.module.scss';

interface BiofeedbackDemoProps {
  isRecording: boolean;
}

interface HRVMetrics {
  rmssd: number;
  sdnn: number;
  pnn50: number;
}

const BiofeedbackDemo: React.FC<BiofeedbackDemoProps> = ({ isRecording }) => {
  const [hrvMetrics, setHrvMetrics] = useState<HRVMetrics | null>(null);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(12.5);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'exhale' | 'hold'>('inhale');
  const [breathingTimer, setBreathingTimer] = useState(5);
  const [stressIndex, setStressIndex] = useState<number>(45);
  
  const breathingIntervalRef = useRef<NodeJS.Timeout>();

  // Breathing exercise phases
  const BREATHING_CYCLE = {
    inhale: 5,
    hold: 2,
    exhale: 5
  };

  // Simulate HRV metrics
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        // Simulate realistic HRV values
        const rmssd = 25 + Math.random() * 30; // 25-55 ms
        const sdnn = 35 + Math.random() * 25; // 35-60 ms
        const pnn50 = 15 + Math.random() * 35; // 15-50%
        
        setHrvMetrics({ rmssd, sdnn, pnn50 });
        
        // Simulate respiratory rate changes
        const respRate = 10 + Math.random() * 8; // 10-18 breaths/min
        setRespiratoryRate(respRate);
        
        // Simulate stress index
        const stress = 20 + Math.random() * 60; // 20-80
        setStressIndex(stress);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isRecording]);

  // Breathing exercise timer
  useEffect(() => {
    if (isRecording) {
      breathingIntervalRef.current = setInterval(() => {
        setBreathingTimer(prev => {
          if (prev <= 1) {
            // Switch breathing phase
            if (breathingPhase === 'inhale') {
              setBreathingPhase('hold');
              return BREATHING_CYCLE.hold;
            } else if (breathingPhase === 'hold') {
              setBreathingPhase('exhale');
              return BREATHING_CYCLE.exhale;
            } else {
              setBreathingPhase('inhale');
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
  }, [isRecording, breathingPhase]);

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
            <span className={styles.largeValue}>{respiratoryRate.toFixed(1)}</span>
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

      {/* Demo Chart */}
      <div className={styles.chartContainer}>
        <h3>Real-time Monitoring (Demo)</h3>
        <div style={{ 
          height: '300px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              Real-time dual-axis chart will be displayed here
            </p>
            <p style={{ fontSize: '1rem', opacity: 0.8 }}>
              Heart Rate: ~75 bpm | Respiratory Rate: ~12.5 breaths/min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiofeedbackDemo; 