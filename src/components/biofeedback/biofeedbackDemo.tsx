import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import styles from './biofeedback.module.scss';
import { BREATHING_PATTERNS, BreathingPattern, BreathingPhase } from './breathingPatterns';

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
  const [currentPattern, setCurrentPattern] = useState<BreathingPattern>(BREATHING_PATTERNS[0]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [breathingTimer, setBreathingTimer] = useState(4);
  const [stressIndex, setStressIndex] = useState<number>(45);
  const [showHelp, setShowHelp] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [chartData, setChartData] = useState<Array<{
    time: number;
    heartRate: number;
    respiratoryRate: number;
    stressLevel: number;
    hrvRmssd: number;
  }>>([]);
  
  const breathingIntervalRef = useRef<NodeJS.Timeout>();
  const timeRef = useRef(0);

  const currentPhase = currentPattern.phases[currentPhaseIndex];

  // Simulate HRV metrics
  useEffect(() => {
    if (isRecording && !sessionPaused) {
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
  }, [isRecording, sessionPaused]);

  // Breathing exercise timer
  useEffect(() => {
    if (isRecording && !sessionPaused) {
      breathingIntervalRef.current = setInterval(() => {
        setBreathingTimer(prev => {
          if (prev <= 1) {
            // Move to next phase
            const nextPhaseIndex = (currentPhaseIndex + 1) % currentPattern.phases.length;
            setCurrentPhaseIndex(nextPhaseIndex);
            return currentPattern.phases[nextPhaseIndex].duration;
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
  }, [isRecording, sessionPaused, currentPhaseIndex, currentPattern]);

  const handlePatternChange = (patternId: string) => {
    const newPattern = BREATHING_PATTERNS.find(p => p.id === patternId);
    if (newPattern) {
      setCurrentPattern(newPattern);
      setCurrentPhaseIndex(0);
      setBreathingTimer(newPattern.phases[0].duration);
    }
  };

  const togglePause = () => {
    setSessionPaused(!sessionPaused);
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666';
    }
  };

  return (
    <div className={styles.biofeedbackContainer}>
      {/* Help Overlay */}
      {showHelp && (
        <div className={styles.helpOverlay}>
          <div className={styles.helpContent}>
            <h2>Welcome to Guided Breathing</h2>
            <p>This biofeedback system helps you reduce stress through ancient breathing techniques.</p>
            
            <h3>Understanding Your Metrics:</h3>
            <ul>
              <li><strong>RMSSD:</strong> Heart rate variability - higher values indicate better stress resilience</li>
              <li><strong>SDNN:</strong> Overall heart rate variability - indicates autonomic nervous system balance</li>
              <li><strong>pNN50:</strong> Percentage of heartbeats with &gt;50ms intervals - higher is better</li>
              <li><strong>Stress Level:</strong> Combined assessment of your current stress state</li>
            </ul>

            <h3>How to Use:</h3>
            <ol>
              <li>Choose a breathing pattern that feels right for you</li>
              <li>Follow the expanding/contracting circle</li>
              <li>Read the gentle instructions</li>
              <li>Focus on your breath and let go of thoughts</li>
            </ol>

            <button 
              className={styles.helpCloseButton}
              onClick={() => setShowHelp(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.patternSelector}>
          <label htmlFor="breathing-pattern">Breathing Pattern:</label>
          <select 
            id="breathing-pattern"
            value={currentPattern.id}
            onChange={(e) => handlePatternChange(e.target.value)}
            disabled={isRecording}
          >
            {BREATHING_PATTERNS.map(pattern => (
              <option key={pattern.id} value={pattern.id}>
                {pattern.name} ({pattern.difficulty})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.sessionControls}>
          {isRecording && (
            <button 
              className={styles.pauseButton}
              onClick={togglePause}
            >
              {sessionPaused ? 'Resume' : 'Pause'}
            </button>
          )}
          
          <button 
            className={styles.helpButton}
            onClick={() => setShowHelp(true)}
          >
            ?
          </button>
        </div>
      </div>

      {/* Pattern Info */}
      <div className={styles.patternInfo}>
        <h3>{currentPattern.name}</h3>
        <p className={styles.patternDescription}>{currentPattern.description}</p>
        <div className={styles.patternMeta}>
          <span className={styles.culturalOrigin}>Origin: {currentPattern.culturalOrigin}</span>
          <span 
            className={styles.difficulty}
            style={{ color: getDifficultyColor(currentPattern.difficulty) }}
          >
            {currentPattern.difficulty}
          </span>
        </div>
        <div className={styles.benefits}>
          <strong>Benefits:</strong> {currentPattern.benefits.join(', ')}
        </div>
      </div>

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

        {/* Guided Breathing Exercise */}
        <div className={styles.metricCard}>
          <h3>Guided Breathing</h3>
          <div 
            className={`${styles.breathingCircle} ${styles[currentPhase.name]}`}
            style={{ 
              borderColor: currentPhase.color,
              boxShadow: `0 0 30px ${currentPhase.color}40`
            }}
          >
            <span className={styles.breathingText}>{currentPhase.instruction}</span>
            <span className={styles.breathingTimer}>{breathingTimer}s</span>
            <span className={styles.phaseName}>{currentPhase.name.replace('-', ' ')}</span>
          </div>
          {sessionPaused && (
            <div className={styles.pausedIndicator}>
              Session Paused
            </div>
          )}
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