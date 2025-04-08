import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const ControlPanel = ({ 
  onGenerateWorld, 
  onInitializeAgent, 
  onStartTraining, 
  onReset, 
  onTogglePause,
  onStopTraining,
  onResetAgent,
  onSpeedChange,
  worldGenerated, 
  agentInitialized, 
  trainingInProgress,
  isPaused,
  visualizationSpeed
}) => {
  // Default values for larger grid sizes
  const [worldParams, setWorldParams] = useState({
    size: 15, // Increased from 10
    obstacleDensity: 0.3
  });

  const [agentParams, setAgentParams] = useState({
    learningRate: 0.1,
    discountFactor: 0.9,
    explorationRate: 0.1
  });

  const [trainingParams, setTrainingParams] = useState({
    episodes: 100,
    visualizeTraining: true,
    visualizationSpeed: 50 // ms delay between steps
  });

  const handleWorldParamChange = (e) => {
    const { name, value } = e.target;
    setWorldParams({
      ...worldParams,
      [name]: name === 'size' ? parseInt(value, 10) : parseFloat(value)
    });
  };

  const handleAgentParamChange = (e) => {
    const { name, value } = e.target;
    setAgentParams({
      ...agentParams,
      [name]: parseFloat(value)
    });
  };

  const handleTrainingParamChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTrainingParams({
      ...trainingParams,
      [name]: type === 'checkbox' ? checked : parseInt(value, 10)
    });
    
    // Update visualization speed if that's what changed
    if (name === 'visualizationSpeed' && onSpeedChange) {
      onSpeedChange(parseInt(value, 10));
    }
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-dark-900 to-dark-950 p-6 rounded-xl shadow-xl border border-primary-900/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-300 to-primary-500 flex items-center">
        <div className="w-8 h-8 rounded-lg bg-primary-900/50 flex items-center justify-center mr-2 text-primary-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </div>
        Control Panel
      </h2>

      <div className="space-y-6 mt-4">
        {/* World Generation Section */}
        <div className="bg-dark-800/50 p-4 rounded-lg border border-primary-900/30 backdrop-blur-sm">
          <h3 className="text-lg font-medium text-primary-400 mb-3">World Generation</h3>
          
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Grid Size
                <span className="text-xs text-dark-400 ml-2">({worldParams.size}x{worldParams.size})</span>
              </label>
              <input
                type="range"
                name="size"
                min="8"
                max="25"
                value={worldParams.size}
                onChange={handleWorldParamChange}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-xs text-dark-400 mt-1">
                <span>8x8</span>
                <span>25x25</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Obstacle Density
                <span className="text-xs text-dark-400 ml-2">({(worldParams.obstacleDensity * 100).toFixed(0)}%)</span>
              </label>
              <input
                type="range"
                name="obstacleDensity"
                min="0.1"
                max="0.5"
                step="0.05"
                value={worldParams.obstacleDensity}
                onChange={handleWorldParamChange}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-xs text-dark-400 mt-1">
                <span>10%</span>
                <span>50%</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => onGenerateWorld(worldParams)}
            disabled={trainingInProgress}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              trainingInProgress 
                ? 'bg-dark-600 text-dark-400 cursor-not-allowed' 
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            Generate New World
          </button>
        </div>

        {/* Agent Initialization Section */}
        <div className={`bg-dark-800/50 p-4 rounded-lg border border-primary-900/30 backdrop-blur-sm ${!worldGenerated ? 'opacity-50' : ''}`}>
          <h3 className="text-lg font-medium text-primary-400 mb-3">Agent Initialization</h3>
          
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-3 sm:gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Learning Rate
                <span className="text-xs text-dark-400 ml-2">({agentParams.learningRate})</span>
              </label>
              <input
                type="range"
                name="learningRate"
                min="0.01"
                max="0.5"
                step="0.01"
                value={agentParams.learningRate}
                onChange={handleAgentParamChange}
                disabled={!worldGenerated || trainingInProgress}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500 disabled:accent-dark-600"
              />
              <div className="flex justify-between text-xs text-dark-400 mt-1">
                <span>0.01</span>
                <span>0.5</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Discount Factor
                <span className="text-xs text-dark-400 ml-2">({agentParams.discountFactor})</span>
              </label>
              <input
                type="range"
                name="discountFactor"
                min="0.5"
                max="0.99"
                step="0.01"
                value={agentParams.discountFactor}
                onChange={handleAgentParamChange}
                disabled={!worldGenerated || trainingInProgress}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500 disabled:accent-dark-600"
              />
              <div className="flex justify-between text-xs text-dark-400 mt-1">
                <span>0.5</span>
                <span>0.99</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Exploration Rate
                <span className="text-xs text-dark-400 ml-2">({agentParams.explorationRate})</span>
              </label>
              <input
                type="range"
                name="explorationRate"
                min="0.01"
                max="0.5"
                step="0.01"
                value={agentParams.explorationRate}
                onChange={handleAgentParamChange}
                disabled={!worldGenerated || trainingInProgress}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500 disabled:accent-dark-600"
              />
              <div className="flex justify-between text-xs text-dark-400 mt-1">
                <span>0.01</span>
                <span>0.5</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => onInitializeAgent(agentParams)}
            disabled={!worldGenerated || trainingInProgress || agentInitialized}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              !worldGenerated || trainingInProgress || agentInitialized
                ? 'bg-dark-600 text-dark-400 cursor-not-allowed' 
                : 'bg-secondary-600 hover:bg-secondary-700 text-white'
            }`}
          >
            {agentInitialized ? 'Agent Initialized' : 'Initialize Agent'}
          </button>
        </div>

        {/* Training Section */}
        <div className={`bg-dark-800/50 p-4 rounded-lg border border-primary-900/30 backdrop-blur-sm ${!agentInitialized ? 'opacity-50' : ''}`}>
          <h3 className="text-lg font-medium text-primary-400 mb-3">Training</h3>
          
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Number of Episodes
                <span className="text-xs text-dark-400 ml-2">({trainingParams.episodes})</span>
              </label>
              <input
                type="range"
                name="episodes"
                min="50"
                max="500"
                step="50"
                value={trainingParams.episodes}
                onChange={handleTrainingParamChange}
                disabled={!agentInitialized || trainingInProgress}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500 disabled:accent-dark-600"
              />
              <div className="flex justify-between text-xs text-dark-400 mt-1">
                <span>50</span>
                <span>500</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Visualization Speed
                <span className="text-xs text-dark-400 ml-2">({trainingParams.visualizationSpeed}ms)</span>
              </label>
              <input
                type="range"
                name="visualizationSpeed"
                min="0"
                max="500"
                step="10"
                value={trainingParams.visualizationSpeed}
                onChange={handleTrainingParamChange}
                disabled={!agentInitialized}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500 disabled:accent-dark-600"
              />
              <div className="flex justify-between text-xs text-dark-400 mt-1">
                <span>Fast (0ms)</span>
                <span>Slow (500ms)</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              name="visualizeTraining"
              id="visualizeTraining"
              checked={trainingParams.visualizeTraining}
              onChange={handleTrainingParamChange}
              disabled={!agentInitialized || trainingInProgress}
              className="h-4 w-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
            />
            <label htmlFor="visualizeTraining" className="ml-2 block text-sm text-gray-300">
              Visualize Training Process
            </label>
          </div>
          
          {!trainingInProgress ? (
            <button
              onClick={() => onStartTraining(trainingParams)}
              disabled={!agentInitialized || trainingInProgress}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                !agentInitialized || trainingInProgress
                  ? 'bg-dark-600 text-dark-400 cursor-not-allowed' 
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              Start Training
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onTogglePause}
                className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                  isPaused 
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {isPaused ? 'Resume Training' : 'Pause Training'}
              </button>
              
              <button
                onClick={onStopTraining}
                className="py-2 px-4 rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 text-white"
              >
                Stop Training
              </button>
            </div>
          )}
        </div>

        {/* Agent Controls Section */}
        <div className={`bg-dark-800/50 p-4 rounded-lg border border-primary-900/30 backdrop-blur-sm ${!worldGenerated ? 'opacity-50' : ''}`}>
          <h3 className="text-lg font-medium text-primary-400 mb-3">Agent Controls</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onResetAgent}
              disabled={!worldGenerated || !agentInitialized}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                !worldGenerated || !agentInitialized
                  ? 'bg-dark-600 text-dark-400 cursor-not-allowed' 
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              Reset Agent Position
            </button>
            
            <button
              onClick={onReset}
              disabled={trainingInProgress}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                trainingInProgress
                  ? 'bg-dark-600 text-dark-400 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              Reset Everything
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

ControlPanel.propTypes = {
  onGenerateWorld: PropTypes.func.isRequired,
  onInitializeAgent: PropTypes.func.isRequired,
  onStartTraining: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onTogglePause: PropTypes.func.isRequired,
  onStopTraining: PropTypes.func.isRequired,
  onResetAgent: PropTypes.func.isRequired,
  onSpeedChange: PropTypes.func.isRequired,
  worldGenerated: PropTypes.bool.isRequired,
  agentInitialized: PropTypes.bool.isRequired,
  trainingInProgress: PropTypes.bool.isRequired,
  isPaused: PropTypes.bool.isRequired,
  visualizationSpeed: PropTypes.number.isRequired
};

export default ControlPanel; 