import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

const TrainingStats = ({ trainingData, isTraining, currentEpisode }) => {
  const rewardChartRef = useRef(null);
  const stepsChartRef = useRef(null);
  const rewardChartInstance = useRef(null);
  const stepsChartInstance = useRef(null);
  const [activeTab, setActiveTab] = useState('charts'); // 'charts', 'log'

  // Create and update charts when training data changes
  useEffect(() => {
    if (!trainingData || !trainingData.episode_rewards || !trainingData.episode_steps) return;

    const episodes = Array.from({ length: trainingData.episode_rewards.length }, (_, i) => i + 1);
    const rewards = trainingData.episode_rewards;
    const steps = trainingData.episode_steps;

    // Calculate moving averages for smoother visualization
    const windowSize = 10;
    const rewardMovingAvg = rewards.map((_, i) => {
      const start = Math.max(0, i - windowSize + 1);
      const windowValues = rewards.slice(start, i + 1);
      return windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length;
    });

    const stepsMovingAvg = steps.map((_, i) => {
      const start = Math.max(0, i - windowSize + 1);
      const windowValues = steps.slice(start, i + 1);
      return windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length;
    });

    // Common chart options
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 500 // Add a small animation for better UX
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(75, 85, 99, 0.1)',
            tickLength: 0,
          },
          ticks: {
            color: 'rgba(209, 213, 219, 0.8)',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10,
          },
          title: {
            display: true,
            text: 'Episode',
            color: 'rgba(209, 213, 219, 0.8)',
            font: {
              size: 12,
              weight: 'normal',
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(75, 85, 99, 0.1)',
            tickLength: 0,
          },
          ticks: {
            color: 'rgba(209, 213, 219, 0.8)',
            padding: 10,
          },
          border: {
            dash: [4, 4],
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: 'rgba(209, 213, 219, 0.8)',
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 15,
          },
          position: 'top',
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          titleColor: 'rgba(209, 213, 219, 1)',
          bodyColor: 'rgba(209, 213, 219, 1)',
          borderColor: 'rgba(75, 85, 99, 0.3)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          boxPadding: 4,
          usePointStyle: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(2);
              }
              return label;
            }
          }
        }
      }
    };

    // Create or update reward chart
    if (rewardChartRef.current) {
      if (rewardChartInstance.current) {
        rewardChartInstance.current.destroy();
      }

      const gradientFill = rewardChartRef.current.getContext('2d').createLinearGradient(0, 0, 0, 300);
      gradientFill.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
      gradientFill.addColorStop(1, 'rgba(59, 130, 246, 0.02)');

      rewardChartInstance.current = new Chart(rewardChartRef.current, {
        type: 'line',
        data: {
          labels: episodes,
          datasets: [
            {
              label: 'Episode Reward',
              data: rewards,
              borderColor: 'rgba(59, 130, 246, 0.8)',
              backgroundColor: gradientFill,
              pointRadius: 0,
              borderWidth: 2,
              fill: true,
              tension: 0.2, // Add slight curve to the line
            },
            {
              label: 'Moving Average (10 episodes)',
              data: rewardMovingAvg,
              borderColor: 'rgba(16, 185, 129, 1)',
              backgroundColor: 'transparent',
              borderWidth: 2.5,
              pointRadius: 0,
              borderDash: [0],
              tension: 0.4, // Add more curve to the moving average
            }
          ]
        },
        options: {
          ...commonOptions,
          scales: {
            ...commonOptions.scales,
            y: {
              ...commonOptions.scales.y,
              title: {
                display: true,
                text: 'Reward',
                color: 'rgba(209, 213, 219, 0.8)',
                font: {
                  size: 12,
                  weight: 'normal',
                }
              }
            }
          }
        }
      });
    }

    // Create or update steps chart
    if (stepsChartRef.current) {
      if (stepsChartInstance.current) {
        stepsChartInstance.current.destroy();
      }

      const gradientFill = stepsChartRef.current.getContext('2d').createLinearGradient(0, 0, 0, 300);
      gradientFill.addColorStop(0, 'rgba(236, 72, 153, 0.3)');
      gradientFill.addColorStop(1, 'rgba(236, 72, 153, 0.02)');

      stepsChartInstance.current = new Chart(stepsChartRef.current, {
        type: 'line',
        data: {
          labels: episodes,
          datasets: [
            {
              label: 'Steps per Episode',
              data: steps,
              borderColor: 'rgba(236, 72, 153, 0.8)',
              backgroundColor: gradientFill,
              pointRadius: 0,
              borderWidth: 2,
              fill: true,
              tension: 0.2, // Add slight curve to the line
            },
            {
              label: 'Moving Average (10 episodes)',
              data: stepsMovingAvg,
              borderColor: 'rgba(245, 158, 11, 1)',
              backgroundColor: 'transparent',
              borderWidth: 2.5,
              pointRadius: 0,
              borderDash: [0],
              tension: 0.4, // Add more curve to the moving average
            }
          ]
        },
        options: {
          ...commonOptions,
          scales: {
            ...commonOptions.scales,
            y: {
              ...commonOptions.scales.y,
              title: {
                display: true,
                text: 'Steps',
                color: 'rgba(209, 213, 219, 0.8)',
                font: {
                  size: 12,
                  weight: 'normal',
                }
              }
            }
          }
        }
      });
    }

    // Cleanup function
    return () => {
      if (rewardChartInstance.current) {
        rewardChartInstance.current.destroy();
      }
      if (stepsChartInstance.current) {
        stepsChartInstance.current.destroy();
      }
    };
  }, [trainingData]);

  // Calculate performance metrics
  const getPerformanceMetrics = () => {
    if (!trainingData || !trainingData.episode_rewards || trainingData.episode_rewards.length === 0) {
      return { avgReward: 'N/A', avgSteps: 'N/A', bestReward: 'N/A', worstReward: 'N/A' };
    }

    const rewards = trainingData.episode_rewards;
    const steps = trainingData.episode_steps;
    
    // Get recent performance (last 10% of episodes or last 10, whichever is greater)
    const recentCount = Math.max(10, Math.floor(rewards.length * 0.1));
    const recentRewards = rewards.slice(-recentCount);
    const recentSteps = steps.slice(-recentCount);
    
    const avgReward = (rewards.reduce((a, b) => a + b, 0) / rewards.length).toFixed(2);
    const avgSteps = (steps.reduce((a, b) => a + b, 0) / steps.length).toFixed(1);
    const bestReward = Math.max(...rewards).toFixed(2);
    const worstReward = Math.min(...rewards).toFixed(2);
    
    const recentAvgReward = (recentRewards.reduce((a, b) => a + b, 0) / recentRewards.length).toFixed(2);
    const recentAvgSteps = (recentSteps.reduce((a, b) => a + b, 0) / recentSteps.length).toFixed(1);
    
    // Calculate improvement percentage
    const firstHalfRewards = rewards.slice(0, Math.floor(rewards.length / 2));
    const secondHalfRewards = rewards.slice(Math.floor(rewards.length / 2));
    
    const firstHalfAvg = firstHalfRewards.reduce((a, b) => a + b, 0) / firstHalfRewards.length;
    const secondHalfAvg = secondHalfRewards.reduce((a, b) => a + b, 0) / secondHalfRewards.length;
    
    const improvementPct = firstHalfAvg !== 0 
      ? (((secondHalfAvg - firstHalfAvg) / Math.abs(firstHalfAvg)) * 100).toFixed(1)
      : 'N/A';
    
    return {
      avgReward,
      avgSteps,
      bestReward,
      worstReward,
      recentAvgReward,
      recentAvgSteps,
      improvementPct
    };
  };

  const metrics = getPerformanceMetrics();

  return (
    <motion.div 
      className="bg-gradient-to-br from-dark-900 to-dark-950 p-6 rounded-xl shadow-xl border border-primary-900/50 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-300 to-primary-500 flex items-center">
          <div className="w-8 h-8 rounded-lg bg-primary-900/50 flex items-center justify-center mr-2 text-primary-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          Training Statistics
        </h2>
        
        {isTraining && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-accent-500 animate-pulse"></div>
            <span className="text-sm font-medium text-primary-300">
              Episode {currentEpisode}
            </span>
          </div>
        )}
      </div>

      {trainingData && trainingData.episode_rewards ? (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex bg-dark-800/50 rounded-lg p-1 backdrop-blur-sm border border-primary-900/30">
            <button
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'charts' 
                  ? 'bg-primary-700/70 text-white' 
                  : 'text-dark-300 hover:text-primary-300'
              }`}
              onClick={() => setActiveTab('charts')}
            >
              Charts
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'log' 
                  ? 'bg-primary-700/70 text-white' 
                  : 'text-dark-300 hover:text-primary-300'
              }`}
              onClick={() => setActiveTab('log')}
            >
              Training Log
            </button>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-dark-800/50 p-3 rounded-lg border border-primary-900/30 backdrop-blur-sm">
              <h4 className="text-xs font-medium text-dark-400 mb-1">Episodes</h4>
              <p className="text-lg font-medium text-primary-300">{trainingData.episode_rewards.length}</p>
            </div>
            
            <div className="bg-dark-800/50 p-3 rounded-lg border border-primary-900/30 backdrop-blur-sm">
              <h4 className="text-xs font-medium text-dark-400 mb-1">Avg Reward</h4>
              <div className="flex items-center">
                <p className="text-lg font-medium text-primary-300">{metrics.avgReward}</p>
                {metrics.improvementPct !== 'N/A' && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    parseFloat(metrics.improvementPct) >= 0 
                      ? 'bg-green-900/30 text-green-400' 
                      : 'bg-red-900/30 text-red-400'
                  }`}>
                    {parseFloat(metrics.improvementPct) >= 0 ? '+' : ''}{metrics.improvementPct}%
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-dark-800/50 p-3 rounded-lg border border-primary-900/30 backdrop-blur-sm">
              <h4 className="text-xs font-medium text-dark-400 mb-1">Avg Steps</h4>
              <p className="text-lg font-medium text-primary-300">{metrics.avgSteps}</p>
            </div>
            
            <div className="bg-dark-800/50 p-3 rounded-lg border border-primary-900/30 backdrop-blur-sm">
              <h4 className="text-xs font-medium text-dark-400 mb-1">Best Reward</h4>
              <p className="text-lg font-medium text-primary-300">{metrics.bestReward}</p>
            </div>
          </div>

          {/* Recent Performance */}
          {metrics.recentAvgReward && (
            <div className="bg-dark-800/30 p-3 rounded-lg border border-primary-900/20 backdrop-blur-sm">
              <h4 className="text-xs font-medium text-dark-400 mb-2">Recent Performance (Last 10%)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mr-2"></div>
                  <span className="text-xs text-dark-300">Avg Reward:</span>
                  <span className="ml-auto text-sm font-medium text-primary-300">{metrics.recentAvgReward}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-accent-500 mr-2"></div>
                  <span className="text-xs text-dark-300">Avg Steps:</span>
                  <span className="ml-auto text-sm font-medium text-primary-300">{metrics.recentAvgSteps}</span>
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          {activeTab === 'charts' && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-dark-800/50 p-4 rounded-lg border border-primary-900/30 backdrop-blur-sm">
                <h3 className="text-sm font-medium text-primary-400 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  Reward per Episode
                </h3>
                <div className="h-64">
                  <canvas ref={rewardChartRef}></canvas>
                </div>
              </div>
              
              <div className="bg-dark-800/50 p-4 rounded-lg border border-primary-900/30 backdrop-blur-sm">
                <h3 className="text-sm font-medium text-primary-400 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                  Steps per Episode
                </h3>
                <div className="h-64">
                  <canvas ref={stepsChartRef}></canvas>
                </div>
              </div>
            </motion.div>
          )}

          {/* Training Log */}
          {activeTab === 'log' && (
            <motion.div 
              className="bg-dark-800/50 p-4 rounded-lg border border-primary-900/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-sm font-medium text-primary-400 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Training Log
              </h3>
              <div className="bg-dark-950 p-3 rounded-lg border border-dark-800 h-64 overflow-y-auto font-mono text-xs">
                {trainingData.episode_rewards.map((reward, idx) => (
                  <motion.div 
                    key={idx} 
                    className="mb-1 p-1.5 border-b border-dark-800/50 hover:bg-dark-800/20 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.01 }}
                  >
                    <span className="text-primary-400">Episode {idx + 1}:</span>
                    <span className="text-secondary-400 ml-2">Reward: {reward.toFixed(2)}</span>
                    <span className="text-accent-400 ml-2">Steps: {trainingData.episode_steps[idx]}</span>
                  </motion.div>
                )).slice(-20).reverse()}
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <motion.div 
          className="bg-dark-800/50 p-8 rounded-lg border border-primary-900/30 backdrop-blur-sm text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <motion.div 
              className="absolute inset-0 rounded-full bg-primary-900/30"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div 
              className="absolute inset-4 rounded-full bg-primary-800/40"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.2 }}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full text-primary-500/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20V10M18 20V4M6 20v-4" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-primary-300 mb-2">No Training Data</h3>
          <p className="text-dark-300 mb-4">Training statistics will appear here once you start training the agent</p>
          <div className="bg-dark-800/50 p-3 rounded-lg text-sm text-dark-300 border border-dark-700/50 max-w-md mx-auto">
            <p>You'll be able to see:</p>
            <ul className="mt-2 space-y-1 list-inside list-disc">
              <li>Reward and steps per episode</li>
              <li>Performance trends over time</li>
              <li>Detailed training logs</li>
            </ul>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

TrainingStats.propTypes = {
  trainingData: PropTypes.shape({
    episode_rewards: PropTypes.array,
    episode_steps: PropTypes.array
  }),
  isTraining: PropTypes.bool,
  currentEpisode: PropTypes.number
};

export default TrainingStats; 