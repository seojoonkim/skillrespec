import { useState, useEffect } from 'react';
import type { VizMetrics } from '../types';

interface MetricsPanelProps {
  metrics: VizMetrics;
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <>{display}{suffix}</>;
}

function CircularProgress({ 
  value, 
  color, 
  size = 60,
  strokeWidth = 4,
}: { 
  value: number; 
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 8px ${color})`,
          transition: 'stroke-dashoffset 1.5s ease-out',
        }}
      />
    </svg>
  );
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const metricsData = [
    {
      label: 'Cluster Density',
      value: Math.round(metrics.clusterDensity * 100),
      color: '#00ffff',
      description: 'Category balance',
      good: metrics.clusterDensity > 0.6,
    },
    {
      label: 'Overlap',
      value: Math.round(metrics.overlapCoefficient * 100),
      color: '#ff00ff',
      description: 'Skill redundancy',
      good: metrics.overlapCoefficient < 0.4,
    },
    {
      label: 'Uniqueness',
      value: Math.round(metrics.uniquenessIndex * 100),
      color: '#ffff00',
      description: 'Differentiation',
      good: metrics.uniquenessIndex > 0.8,
    },
  ];

  // Overall health score
  const overallScore = Math.round(
    (metrics.clusterDensity * 30) +
    ((1 - metrics.overlapCoefficient) * 30) +
    (metrics.uniquenessIndex * 40)
  );

  return (
    <div style={{
      position: 'absolute',
      top: 80,
      left: 20,
      background: 'linear-gradient(180deg, rgba(15, 15, 25, 0.95) 0%, rgba(10, 10, 18, 0.95) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: 16,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      fontFamily: '"Inter", system-ui, sans-serif',
      overflow: 'hidden',
      minWidth: 240,
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    }}>
      {/* Header */}
      <div 
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📊</span>
          <span style={{ 
            fontSize: 12, 
            color: '#888', 
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontWeight: 600,
          }}>
            Technical Metrics
          </span>
        </div>
        <span style={{ 
          fontSize: 12, 
          color: '#666',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s',
        }}>
          ▼
        </span>
      </div>

      {isExpanded && (
        <div style={{ padding: 16 }}>
          {/* Overall Score */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 20,
            padding: 14,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ position: 'relative' }}>
              <CircularProgress 
                value={overallScore} 
                color={overallScore > 70 ? '#00ff88' : overallScore > 50 ? '#ffaa00' : '#ff4444'}
                size={56}
                strokeWidth={5}
              />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
              }}>
                <AnimatedNumber value={overallScore} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>
                OVERALL HEALTH
              </div>
              <div style={{ 
                fontSize: 14, 
                fontWeight: 600,
                color: overallScore > 70 ? '#00ff88' : overallScore > 50 ? '#ffaa00' : '#ff4444',
              }}>
                {overallScore > 70 ? 'Excellent' : overallScore > 50 ? 'Moderate' : 'Needs Work'}
              </div>
            </div>
          </div>

          {/* Individual Metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {metricsData.map((metric) => (
              <div key={metric.label}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}>
                  <div>
                    <span style={{ fontSize: 12, color: '#aaa' }}>
                      {metric.label}
                    </span>
                    <span style={{ 
                      fontSize: 10, 
                      color: '#555', 
                      marginLeft: 6,
                    }}>
                      ({metric.description})
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: 14, 
                    fontWeight: 700, 
                    color: metric.color,
                    textShadow: `0 0 15px ${metric.color}50`,
                  }}>
                    <AnimatedNumber value={metric.value} suffix="%" />
                  </span>
                </div>
                <div style={{
                  height: 4,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${metric.value}%`,
                    background: `linear-gradient(90deg, ${metric.color}, ${metric.color}80)`,
                    borderRadius: 2,
                    boxShadow: `0 0 10px ${metric.color}`,
                    transition: 'width 1.5s ease-out',
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Similar Pairs Count */}
          <div style={{
            marginTop: 16,
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: '#888' }}>
              High-similarity pairs
            </span>
            <span style={{ 
              fontSize: 16, 
              fontWeight: 700, 
              color: '#00ffff',
              textShadow: '0 0 15px rgba(0,255,255,0.5)',
            }}>
              {metrics.cosineSimilarities.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
