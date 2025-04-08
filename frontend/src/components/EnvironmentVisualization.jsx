import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import World from './World';
import Agent from './Agent';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

const EnvironmentVisualization = ({ worldData, agentData, isLoading, trainingInProgress, currentEpisode, totalEpisodes, isPaused }) => {
  // Track visited cells for heatmap visualization
  const [visitedCells, setVisitedCells] = useState([]);
  const [episodeVisitedCells, setEpisodeVisitedCells] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showTrail, setShowTrail] = useState(true);
  
  // Zoom and pan controls
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  
  // Reset visited cells when world changes
  useEffect(() => {
    if (worldData) {
      setVisitedCells([]);
      setEpisodeVisitedCells([]);
      // Reset zoom and pan when world changes
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [worldData?.width, worldData?.height]);
  
  // Reset episode visited cells when a new episode starts
  useEffect(() => {
    if (currentEpisode > 0) {
      setEpisodeVisitedCells([]);
    }
  }, [currentEpisode]);
  
  // Poll for training status to update visited cells during training
  useEffect(() => {
    if (!trainingInProgress) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/training_status`);
        const { current_path, visited_cells } = response.data;
        
        if (current_path && current_path.length > 0) {
          setEpisodeVisitedCells(current_path);
        }
        
        if (visited_cells && visited_cells.length > 0) {
          setVisitedCells(visited_cells);
        }
      } catch (error) {
        console.error('Error polling training status:', error);
      }
    }, 500); // Poll every 500ms
    
    return () => clearInterval(pollInterval);
  }, [trainingInProgress]);
  
  // Handle agent position changes
  const handleAgentPositionChange = (position) => {
    if (position && position.length === 2) {
      // Add to overall visited cells
      setVisitedCells(prev => [...prev, [...position]]);
      
      // Add to current episode visited cells
      setEpisodeVisitedCells(prev => [...prev, [...position]]);
    }
  };
  
  // Handle zoom change
  const handleZoomChange = (delta) => {
    setZoom(prev => {
      const newZoom = Math.max(0.5, Math.min(3, prev + delta * 0.1));
      return newZoom;
    });
  };
  
  // Handle mouse down for panning
  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left mouse button
      isDragging.current = true;
      lastPosition.current = { x: e.clientX, y: e.clientY };
    }
  };
  
  // Handle mouse move for panning
  const handleMouseMove = (e) => {
    if (isDragging.current) {
      const dx = e.clientX - lastPosition.current.x;
      const dy = e.clientY - lastPosition.current.y;
      
      setPan(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      lastPosition.current = { x: e.clientX, y: e.clientY };
    }
  };
  
  // Handle mouse up to stop panning
  const handleMouseUp = () => {
    isDragging.current = false;
  };
  
  // Handle mouse leave to stop panning
  const handleMouseLeave = () => {
    isDragging.current = false;
  };
  
  // Handle wheel event for zooming
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    handleZoomChange(delta);
  };
  
  // Reset zoom and pan
  const resetZoomPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  
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
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          Environment Visualization
        </h2>
        
        {trainingInProgress && (
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-green-500 animate-pulse'}`}></div>
            <span className="text-sm font-medium text-primary-300">
              {isPaused ? 'Training Paused' : `Episode: ${currentEpisode}/${totalEpisodes}`}
            </span>
          </div>
        )}
      </div>
      
      <div 
        className="relative bg-dark-950 rounded-xl overflow-hidden aspect-square border border-primary-900/30 shadow-inner"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
      >
        {/* Grid background pattern */}
        <div className="absolute inset-0 bg-grid-pattern bg-[length:20px_20px] opacity-5 pointer-events-none"></div>
        
        {/* Radial gradient background */}
        <div className="absolute inset-0 bg-radial-gradient from-dark-900/50 to-dark-950 pointer-events-none"></div>
        
        {worldData ? (
          <div 
            className="relative w-full h-full"
            style={{ 
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: 'center',
              transition: 'transform 0.1s ease-out'
            }}
          >
            <World 
              data={worldData} 
              visitedCells={showHeatmap ? visitedCells : []}
              currentPath={showTrail ? episodeVisitedCells : []}
            />
            {agentData && (
              <Agent 
                data={agentData} 
                onPositionChange={handleAgentPositionChange}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full flex-col">
            {isLoading ? (
              <motion.div 
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-primary-300/20 animate-pulse"></div>
                  <div className="absolute inset-2 rounded-full border-t-4 border-primary-500 animate-spin"></div>
                  <div className="absolute inset-4 rounded-full border-t-4 border-primary-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  <div className="absolute inset-6 rounded-full border-t-4 border-primary-300 animate-spin" style={{ animationDuration: '2s' }}></div>
                </div>
                <p className="text-primary-300 text-lg font-medium">Generating world...</p>
                <p className="text-dark-400 text-sm mt-2">Please wait while we create your environment</p>
              </motion.div>
            ) : (
              <motion.div 
                className="text-center p-6 max-w-md"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-24 h-24 mx-auto mb-6 relative">
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
                  <motion.div 
                    className="absolute inset-8 rounded-full bg-primary-700/50"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.4 }}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full text-primary-500/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                
                <h3 className="text-xl font-medium text-primary-300 mb-2">No World Generated</h3>
                <p className="text-dark-300 mb-4">Click "Generate New World" to start</p>
                
                <div className="bg-dark-800/50 p-4 rounded-lg text-sm text-dark-300 border border-dark-700/50">
                  <p>The environment will appear here once generated. You'll be able to see:</p>
                  <ul className="mt-2 space-y-1 list-inside list-disc">
                    <li>The grid world with obstacles</li>
                    <li>Start and goal positions</li>
                    <li>Agent's current position and direction</li>
                    <li>Optimal path after training</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        )}
        
        {/* Zoom Controls */}
        {worldData && (
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
            <motion.button 
              onClick={() => handleZoomChange(1)} 
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-dark-800/80 backdrop-blur-sm border border-primary-800/30 text-primary-400 hover:bg-dark-700/80 hover:text-primary-300 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </motion.button>
            <motion.button 
              onClick={() => handleZoomChange(-1)} 
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-dark-800/80 backdrop-blur-sm border border-primary-800/30 text-primary-400 hover:bg-dark-700/80 hover:text-primary-300 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </motion.button>
            <motion.button 
              onClick={resetZoomPan} 
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-dark-800/80 backdrop-blur-sm border border-primary-800/30 text-primary-400 hover:bg-dark-700/80 hover:text-primary-300 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </motion.button>
          </div>
        )}
        
        {/* Zoom indicator */}
        {worldData && (
          <div className="absolute bottom-4 left-4 px-2 py-1 bg-dark-800/80 backdrop-blur-sm rounded text-xs text-primary-300 border border-primary-800/30">
            {Math.round(zoom * 100)}%
          </div>
        )}
      </div>
      
      {worldData && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-medium text-primary-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
              Environment Details
            </h3>
            
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center text-xs text-primary-300 bg-dark-800/50 px-2 py-1 rounded-full border border-primary-900/30">
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={() => setShowHeatmap(!showHeatmap)}
                  className="mr-1 h-3 w-3 rounded border-dark-600 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-800"
                />
                Heatmap
              </label>
              <label className="flex items-center text-xs text-primary-300 bg-dark-800/50 px-2 py-1 rounded-full border border-primary-900/30">
                <input
                  type="checkbox"
                  checked={showTrail}
                  onChange={() => setShowTrail(!showTrail)}
                  className="mr-1 h-3 w-3 rounded border-dark-600 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-800"
                />
                Trail
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-dark-800/50 p-3 rounded-lg border border-primary-900/30 backdrop-blur-sm">
              <h4 className="text-xs font-medium text-dark-400 mb-1">Grid Size</h4>
              <p className="text-sm font-medium text-primary-300">{worldData.width}x{worldData.height}</p>
            </div>
            
            <div className="bg-dark-800/50 p-3 rounded-lg border border-primary-900/30 backdrop-blur-sm">
              <h4 className="text-xs font-medium text-dark-400 mb-1">Obstacles</h4>
              <p className="text-sm font-medium text-primary-300">{worldData.obstacles?.length || 0} cells</p>
            </div>
            
            <div className="bg-dark-800/50 p-3 rounded-lg border border-primary-900/30 backdrop-blur-sm">
              <h4 className="text-xs font-medium text-dark-400 mb-1">Start Position</h4>
              <p className="text-sm font-medium text-primary-300">
                {worldData.start_position ? 
                  `(${worldData.start_position[0]}, ${worldData.start_position[1]})` : 
                  'N/A'}
              </p>
            </div>
            
            <div className="bg-dark-800/50 p-3 rounded-lg border border-primary-900/30 backdrop-blur-sm">
              <h4 className="text-xs font-medium text-dark-400 mb-1">Goal Position</h4>
              <p className="text-sm font-medium text-primary-300">
                {worldData.goal_position ? 
                  `(${worldData.goal_position[0]}, ${worldData.goal_position[1]})` : 
                  'N/A'}
              </p>
            </div>
          </div>
          
          {worldData.path && (
            <div className="bg-dark-800/50 p-3 rounded-lg border border-primary-900/30 backdrop-blur-sm">
              <h4 className="text-xs font-medium text-dark-400 mb-1">Optimal Path</h4>
              <div className="flex items-center">
                <div className="w-full bg-dark-700 rounded-full h-1.5">
                  <div 
                    className="bg-primary-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (worldData.path.length / (worldData.width + worldData.height)) * 100)}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium text-primary-300">{worldData.path.length} steps</span>
              </div>
            </div>
          )}
          
          {trainingInProgress && (
            <div className="bg-dark-800/50 p-3 rounded-lg border border-primary-900/30 backdrop-blur-sm">
              <h4 className="text-xs font-medium text-dark-400 mb-1">Training Progress</h4>
              <div className="flex items-center">
                <div className="w-full bg-dark-700 rounded-full h-1.5">
                  <div 
                    className="bg-accent-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (currentEpisode / totalEpisodes) * 100)}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium text-accent-400">{Math.round((currentEpisode / totalEpisodes) * 100)}%</span>
              </div>
              <p className="text-xs text-dark-400 mt-1">
                {episodeVisitedCells.length} cells visited in this episode
              </p>
            </div>
          )}
          
          <div className="bg-dark-800/30 p-3 rounded-lg border border-primary-900/20 backdrop-blur-sm">
            <h4 className="text-xs font-medium text-dark-400 mb-2">Legend</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gradient-to-br from-secondary-400 to-secondary-700 rounded-sm mr-2 shadow-sm"></div>
                <span className="text-dark-300">Start</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gradient-to-br from-accent-400 to-accent-700 rounded-sm mr-2 shadow-sm"></div>
                <span className="text-dark-300">Goal</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gradient-to-br from-dark-800 to-dark-950 rounded-sm mr-2 shadow-sm border border-dark-700"></div>
                <span className="text-dark-300">Obstacle</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gradient-to-br from-primary-500/80 to-primary-700/80 rounded-sm mr-2 shadow-sm"></div>
                <span className="text-dark-300">Path</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gradient-to-br from-accent-300 to-accent-600 rounded-full mr-2 shadow-sm"></div>
                <span className="text-dark-300">Agent</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-dark-800 rounded-sm mr-2 flex items-center justify-center">
                  <div className="w-2 h-2 bg-amber-300 rounded-full"></div>
                </div>
                <span className="text-dark-300">Visited</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-dark-800 rounded-sm mr-2 flex items-center justify-center">
                  <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                </div>
                <span className="text-dark-300">Current</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

EnvironmentVisualization.propTypes = {
  worldData: PropTypes.object,
  agentData: PropTypes.object,
  isLoading: PropTypes.bool,
  trainingInProgress: PropTypes.bool,
  currentEpisode: PropTypes.number,
  totalEpisodes: PropTypes.number,
  isPaused: PropTypes.bool
};

EnvironmentVisualization.defaultProps = {
  worldData: null,
  agentData: null,
  isLoading: false,
  trainingInProgress: false,
  currentEpisode: 0,
  totalEpisodes: 0,
  isPaused: false
};

export default EnvironmentVisualization; 