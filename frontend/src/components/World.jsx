import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const World = ({ data, visitedCells = [], currentPath = [] }) => {
  if (!data) return null;
  
  const { width, height, obstacles, start_position, goal_position, path } = data;
  
  // Create a grid of cells
  const cells = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Check if this cell is an obstacle
      const isObstacle = obstacles?.some(pos => pos[0] === x && pos[1] === y) || false;
      
      // Check if this cell is the start position
      const isStart = start_position && start_position[0] === x && start_position[1] === y;
      
      // Check if this cell is the goal position
      const isGoal = goal_position && goal_position[0] === x && goal_position[1] === y;
      
      // Check if this cell is part of the optimal path
      const isPath = path?.some(pos => pos[0] === x && pos[1] === y) || false;
      
      // Check if this cell is part of the current path
      const isCurrentPath = currentPath?.some(pos => pos[0] === x && pos[1] === y) || false;
      
      // Check if this cell has been visited during training
      const visitCount = visitedCells.filter(pos => pos[0] === x && pos[1] === y).length;
      const isVisited = visitCount > 0;
      
      // Calculate heat intensity based on visit count (for heatmap effect)
      const heatIntensity = Math.min(1, visitCount / 10); // Cap at 10 visits for max intensity
      
      // Determine cell style based on its type
      let cellStyle = "relative overflow-hidden transform transition-all duration-300";
      let cellContent = null;
      
      if (isObstacle) {
        cellStyle += " shadow-inner";
        cellContent = (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-dark-800 to-dark-950 flex items-center justify-center">
              {/* Obstacle pattern */}
              <div className="w-3/4 h-3/4 flex flex-wrap">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1/2 h-1/2 border border-dark-700"
                    style={{
                      background: i % 2 === 0 ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.8)'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      } else if (isStart) {
        cellStyle += " shadow-md";
        cellContent = (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-secondary-400 to-secondary-700 flex items-center justify-center">
              <motion.div 
                className="w-2/3 h-2/3 rounded-full bg-secondary-300 flex items-center justify-center shadow-neon-secondary"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-1/2 h-1/2 bg-secondary-200 rounded-full"></div>
              </motion.div>
            </div>
          </div>
        );
      } else if (isGoal) {
        cellStyle += " shadow-md";
        cellContent = (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-accent-400 to-accent-700 flex items-center justify-center">
              <motion.div 
                className="w-2/3 h-2/3 rounded-full bg-accent-300 flex items-center justify-center shadow-neon-accent"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <div className="w-1/2 h-1/2 bg-accent-200 rounded-full"></div>
              </motion.div>
            </div>
          </div>
        );
      } else if (isPath) {
        cellStyle += " shadow-md";
        cellContent = (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-primary-500/80 to-primary-700/80 flex items-center justify-center">
              <motion.div 
                className="w-1/3 h-1/3 bg-primary-300 rounded-full shadow-neon"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </div>
        );
      } else {
        cellStyle += " shadow-inner";
        
        // Base cell background
        const cellBg = (
          <div className="absolute inset-0 bg-gradient-to-br from-dark-800/90 to-dark-900/90" />
        );
        
        // Add current path effect
        if (isCurrentPath) {
          cellContent = (
            <>
              {cellBg}
              <motion.div 
                className="absolute inset-0 bg-purple-500/30 flex items-center justify-center"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <motion.div 
                  className="w-1/4 h-1/4 rounded-full bg-purple-300 shadow-sm"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>
            </>
          );
        }
        // Add heat map effect for visited cells
        else if (isVisited) {
          cellContent = (
            <>
              {cellBg}
              <div 
                className="absolute inset-0 bg-amber-500/30 flex items-center justify-center"
                style={{ opacity: heatIntensity * 0.7 }}
              >
                <div 
                  className="w-1/4 h-1/4 rounded-full bg-amber-300"
                  style={{ opacity: heatIntensity }}
                />
              </div>
            </>
          );
        } else {
          cellContent = cellBg;
        }
      }
      
      // Add grid lines
      cellStyle += " border-[0.5px] border-dark-700/50";
      
      // Add hover effect for non-obstacle cells
      if (!isObstacle) {
        cellStyle += " hover:scale-[0.95] hover:z-10";
      }
      
      cells.push(
        <motion.div
          key={`${x}-${y}`}
          className={cellStyle}
          style={{
            gridColumn: x + 1,
            gridRow: y + 1
          }}
          title={`(${x}, ${y})${isVisited ? ` - Visited ${visitCount} times` : ''}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.3,
            delay: (x + y) * 0.01 // Staggered animation
          }}
        >
          {cellContent}
        </motion.div>
      );
    }
  }
  
  // Use useMemo to create the path overlay elements to avoid recreating them on each render
  const pathOverlay = useMemo(() => {
    if (!path || path.length === 0) return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {path.map((pos, index) => {
          const [x, y] = pos;
          const isFirst = index === 0;
          const isLast = index === path.length - 1;
          
          // Check if this position is the start or goal
          const isStartPos = start_position && x === start_position[0] && y === start_position[1];
          const isGoalPos = goal_position && x === goal_position[0] && y === goal_position[1];
          
          // Skip start and end positions
          if ((isFirst && isStartPos) || (isLast && isGoalPos)) return null;
          
          return (
            <motion.div
              key={`glow-${x}-${y}`}
              className="absolute rounded-full bg-primary-500/20"
              style={{
                width: '10px',
                height: '10px',
                left: `calc(${x} * (100% / ${width}) + (100% / ${width} / 2) - 5px)`,
                top: `calc(${y} * (100% / ${height}) + (100% / ${height} / 2) - 5px)`,
              }}
              animate={{ 
                boxShadow: ['0 0 5px rgba(99, 102, 241, 0.5)', '0 0 15px rgba(99, 102, 241, 0.7)', '0 0 5px rgba(99, 102, 241, 0.5)'],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                delay: index * 0.1 % 2 // Staggered animation
              }}
            />
          );
        })}
      </div>
    );
  }, [path, start_position, goal_position, width, height]);
  
  return (
    <div 
      className="grid w-full h-full gap-[1px] bg-dark-950 p-1 rounded-lg shadow-inner relative overflow-hidden"
      style={{
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        gridTemplateRows: `repeat(${height}, 1fr)`
      }}
    >
      {/* Grid background pattern */}
      <div className="absolute inset-0 bg-grid-pattern bg-[length:20px_20px] opacity-5 pointer-events-none"></div>
      
      {/* Cells */}
      {cells}
      
      {/* Overlay glow effect for path */}
      {pathOverlay}
    </div>
  );
};

World.propTypes = {
  data: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    obstacles: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    start_position: PropTypes.arrayOf(PropTypes.number),
    goal_position: PropTypes.arrayOf(PropTypes.number),
    path: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
  }),
  visitedCells: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  currentPath: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
};

export default World; 