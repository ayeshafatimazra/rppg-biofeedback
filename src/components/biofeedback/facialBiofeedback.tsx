import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import styles from './facialBiofeedback.module.scss';
import { FacialMetrics } from '../../lib/tensorStore';

interface FacialBiofeedbackProps {
  isRecording: boolean;
  facialMetrics: FacialMetrics[];
}

interface FacialMetricsDisplay {
  muscleTension: number;
  eyeMovement: number;
  blinkRate: number;
  facialSymmetry: number;
  timestamp: number;
}

const FacialBiofeedback: React.FC<FacialBiofeedbackProps> = ({ isRecording, facialMetrics }) => {
  const [currentMetrics, setCurrentMetrics] = useState<FacialMetricsDisplay | null>(null);
  const [chartData, setChartData] = useState<Array<{
    time: number;
    muscleTension: number;
    eyeMovement: number;
    blinkRate: number;
    facialSymmetry: number;
  }>>([]);
  const [showHelp, setShowHelp] = useState(false);
  const timeRef = useRef(0);

  // Update current metrics and chart data
  useEffect(() => {
    if (facialMetrics.length > 0) {
      const latest = facialMetrics[facialMetrics.length - 1];
      setCurrentMetrics({
        muscleTension: latest.muscleTension,
        eyeMovement: latest.eyeMovement,
        blinkRate: latest.blinkRate,
        facialSymmetry: latest.facialSymmetry,
        timestamp: latest.timestamp
      });

      // Update chart data
      timeRef.current += 1;
      const newDataPoint = {
        time: timeRef.current,
        muscleTension: latest.muscleTension,
        eyeMovement: latest.eyeMovement,
        blinkRate: latest.blinkRate,
        facialSymmetry: latest.facialSymmetry
      };

      setChartData(prev => {
        const updated = [...prev, newDataPoint];
        // Keep only last 60 data points
        return updated.slice(-60);
      });
    }
  }, [facialMetrics]);

  // Reset when not recording
  useEffect(() => {
    if (!isRecording) {
      setChartData([]);
      timeRef.current = 0;
      setCurrentMetrics(null);
    }
  }, [isRecording]);

  const getMuscleTensionLevel = (tension: number) => {
    if (tension < 0.3) return 'Relaxed';
    if (tension < 0.6) return 'Moderate';
    return 'High';
  };

  const getMuscleTensionColor = (tension: number) => {
    if (tension < 0.3) return '#4CAF50';
    if (tension < 0.6) return '#FF9800';
    return '#F44336';
  };

  const getEyeMovementLevel = (movement: number) => {
    if (movement < 0.2) return 'Still';
    if (movement < 0.5) return 'Moderate';
    return 'Active';
  };

  const getEyeMovementColor = (movement: number) => {
    if (movement < 0.2) return '#4CAF50';
    if (movement < 0.5) return '#FF9800';
    return '#F44336';
  };

  const getBlinkRateLevel = (rate: number) => {
    if (rate < 0.1) return 'Normal';
    if (rate < 0.3) return 'Frequent';
    return 'Very Frequent';
  };

  const getBlinkRateColor = (rate: number) => {
    if (rate < 0.1) return '#4CAF50';
    if (rate < 0.3) return '#FF9800';
    return '#F44336';
  };

  const getSymmetryLevel = (symmetry: number) => {
    if (symmetry > 0.8) return 'Balanced';
    if (symmetry > 0.6) return 'Slight Asymmetry';
    return 'Asymmetric';
  };

  const getSymmetryColor = (symmetry: number) => {
    if (symmetry > 0.8) return '#4CAF50';
    if (symmetry > 0.6) return '#FF9800';
    return '#F44336';
  };

  const getRelaxationScore = () => {
    if (!currentMetrics) return 0;
    
    // Calculate relaxation score based on all metrics
    const tensionScore = Math.max(0, 1 - currentMetrics.muscleTension);
    const movementScore = Math.max(0, 1 - currentMetrics.eyeMovement);
    const blinkScore = Math.max(0, 1 - currentMetrics.blinkRate);
    const symmetryScore = currentMetrics.facialSymmetry;
    
    return Math.round((tensionScore + movementScore + blinkScore + symmetryScore) / 4 * 100);
  };

  const getRelaxationLevel = (score: number) => {
    if (score > 80) return 'Very Relaxed';
    if (score > 60) return 'Relaxed';
    if (score > 40) return 'Moderate';
    if (score > 20) return 'Tense';
    return 'Very Tense';
  };

  const getRelaxationColor = (score: number) => {
    if (score > 80) return '#4CAF50';
    if (score > 60) return '#8BC34A';
    if (score > 40) return '#FF9800';
    if (score > 20) return '#FF5722';
    return '#F44336';
  };

  return (
    <div className={styles.facialBiofeedbackContainer}>
      {/* Help Overlay */}
      {showHelp && (
        <div className={styles.helpOverlay}>
          <div className={styles.helpContent}>
            <h2>Facial Biofeedback Guide</h2>
            <p>Monitor your facial muscle tension and eye movements for better relaxation awareness.</p>
            
            <h3>Understanding Your Metrics:</h3>
            <ul>
              <li><strong>Muscle Tension:</strong> Tension in forehead and jaw muscles - lower is better</li>
              <li><strong>Eye Movement:</strong> Frequency of eye movements - stillness indicates focus</li>
              <li><strong>Blink Rate:</strong> Blinking frequency - normal rate indicates relaxation</li>
              <li><strong>Facial Symmetry:</strong> Balance between left and right facial muscles</li>
              <li><strong>Relaxation Score:</strong> Overall assessment of facial relaxation</li>
            </ul>

            <h3>Tips for Better Relaxation:</h3>
            <ol>
              <li>Consciously relax your forehead and jaw muscles</li>
              <li>Keep your gaze steady and focused</li>
              <li>Maintain natural blinking rhythm</li>
              <li>Ensure balanced facial muscle engagement</li>
              <li>Practice gentle facial stretches</li>
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
        <h3>Facial Biofeedback</h3>
        <button 
          className={styles.helpButton}
          onClick={() => setShowHelp(true)}
        >
          ?
        </button>
      </div>

      {/* Overall Relaxation Score */}
      <div className={styles.relaxationScore}>
        <h3>Overall Relaxation Score</h3>
        <div 
          className={styles.scoreCircle}
          style={{ 
            backgroundColor: getRelaxationColor(getRelaxationScore()),
            borderColor: getRelaxationColor(getRelaxationScore())
          }}
        >
          <span className={styles.scoreValue}>{getRelaxationScore()}%</span>
          <span className={styles.scoreLabel}>{getRelaxationLevel(getRelaxationScore())}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        {/* Muscle Tension */}
        <div className={styles.metricCard}>
          <h4>Muscle Tension</h4>
          <div className={styles.metricValue}>
            <span 
              className={styles.value}
              style={{ color: getMuscleTensionColor(currentMetrics?.muscleTension || 0) }}
            >
              {currentMetrics?.muscleTension.toFixed(2) || '--'}
            </span>
            <span className={styles.label}>
              {getMuscleTensionLevel(currentMetrics?.muscleTension || 0)}
            </span>
          </div>
          <div className={styles.metricBar}>
            <div 
              className={styles.metricFill}
              style={{ 
                width: `${Math.min(100, (currentMetrics?.muscleTension || 0) * 100)}%`,
                backgroundColor: getMuscleTensionColor(currentMetrics?.muscleTension || 0)
              }}
            />
          </div>
        </div>

        {/* Eye Movement */}
        <div className={styles.metricCard}>
          <h4>Eye Movement</h4>
          <div className={styles.metricValue}>
            <span 
              className={styles.value}
              style={{ color: getEyeMovementColor(currentMetrics?.eyeMovement || 0) }}
            >
              {currentMetrics?.eyeMovement.toFixed(2) || '--'}
            </span>
            <span className={styles.label}>
              {getEyeMovementLevel(currentMetrics?.eyeMovement || 0)}
            </span>
          </div>
          <div className={styles.metricBar}>
            <div 
              className={styles.metricFill}
              style={{ 
                width: `${Math.min(100, (currentMetrics?.eyeMovement || 0) * 100)}%`,
                backgroundColor: getEyeMovementColor(currentMetrics?.eyeMovement || 0)
              }}
            />
          </div>
        </div>

        {/* Blink Rate */}
        <div className={styles.metricCard}>
          <h4>Blink Rate</h4>
          <div className={styles.metricValue}>
            <span 
              className={styles.value}
              style={{ color: getBlinkRateColor(currentMetrics?.blinkRate || 0) }}
            >
              {currentMetrics?.blinkRate.toFixed(2) || '--'}
            </span>
            <span className={styles.label}>
              {getBlinkRateLevel(currentMetrics?.blinkRate || 0)}
            </span>
          </div>
          <div className={styles.metricBar}>
            <div 
              className={styles.metricFill}
              style={{ 
                width: `${Math.min(100, (currentMetrics?.blinkRate || 0) * 100)}%`,
                backgroundColor: getBlinkRateColor(currentMetrics?.blinkRate || 0)
              }}
            />
          </div>
        </div>

        {/* Facial Symmetry */}
        <div className={styles.metricCard}>
          <h4>Facial Symmetry</h4>
          <div className={styles.metricValue}>
            <span 
              className={styles.value}
              style={{ color: getSymmetryColor(currentMetrics?.facialSymmetry || 0) }}
            >
              {currentMetrics?.facialSymmetry.toFixed(2) || '--'}
            </span>
            <span className={styles.label}>
              {getSymmetryLevel(currentMetrics?.facialSymmetry || 0)}
            </span>
          </div>
          <div className={styles.metricBar}>
            <div 
              className={styles.metricFill}
              style={{ 
                width: `${Math.min(100, (currentMetrics?.facialSymmetry || 0) * 100)}%`,
                backgroundColor: getSymmetryColor(currentMetrics?.facialSymmetry || 0)
              }}
            />
          </div>
        </div>
      </div>

      {/* Real-time Chart */}
      {chartData.length > 0 && (
        <div className={styles.chartContainer}>
          <h4>Facial Metrics Over Time</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="muscleTension" 
                stroke="#F44336" 
                name="Muscle Tension"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="eyeMovement" 
                stroke="#FF9800" 
                name="Eye Movement"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="blinkRate" 
                stroke="#9C27B0" 
                name="Blink Rate"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="facialSymmetry" 
                stroke="#4CAF50" 
                name="Facial Symmetry"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Relaxation Tips */}
      <div className={styles.relaxationTips}>
        <h4>Relaxation Tips</h4>
        <ul>
          <li>Gently massage your temples and jaw</li>
          <li>Practice focused gazing at a fixed point</li>
          <li>Take slow, deep breaths</li>
          <li>Consciously relax your facial muscles</li>
          <li>Maintain good posture</li>
        </ul>
      </div>
    </div>
  );
};

export default FacialBiofeedback; 