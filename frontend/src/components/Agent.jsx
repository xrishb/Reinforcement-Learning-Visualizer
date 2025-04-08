import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const Agent = ({ data, onPositionChange }) => {
  if (!data || !data.position) return null;
  
  const { position, direction } = data;
  const [x, y] = position;
  const [prevPositions, setPrevPositions] = useState([]);
  const [prevPosition, setPrevPosition] = useState(null);
  
  // Map direction to rotation angle (0 = North, 1 = East, 2 = South, 3 = West)
  const rotationMap = {
    0: 0,    // North - pointing up
    1: 90,   // East - pointing right
    2: 180,  // South - pointing down
    3: 270   // West - pointing left
  };
  
  const rotation = rotationMap[direction] || 0;
  
  // Track position changes for trail effect
  useEffect(() => {
    // Only update if position has changed
    if (prevPosition && 
        prevPosition[0] === position[0] && 
        prevPosition[1] === position[1]) {
      return;
    }
    
    // Add current position to trail
    setPrevPositions(prev => {
      const newPositions = [...prev, [...position]];
      // Keep only the last 5 positions for the trail
      return newPositions.slice(-5);
    });
    
    // Update previous position
    setPrevPosition([...position]);
    
    // Notify parent component about position change
    if (onPositionChange) {
      onPositionChange(position);
    }
  }, [position[0], position[1]]);
  
  return (
    <motion.div
      className="absolute w-full h-full pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Trail effect */}
      {prevPositions.slice(0, -1).map((pos, index) => {
        const [trailX, trailY] = pos;
        const opacity = 0.2 + (index * 0.15); // Fade in older positions
        const scale = 0.4 + (index * 0.1); // Smaller for older positions
        
        return (
          <motion.div
            key={`trail-${index}`}
            className="absolute flex items-center justify-center"
            style={{
              width: `calc(100% / ${data.world_width || 10})`,
              height: `calc(100% / ${data.world_height || 10})`,
              left: `calc(${trailX} * (100% / ${data.world_width || 10}))`,
              top: `calc(${trailY} * (100% / ${data.world_height || 10}))`
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity, scale }}
            transition={{ duration: 0.3 }}
          >
            <div 
              className="w-2/5 h-2/5 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(251, 146, 60, 0.5) 0%, rgba(251, 146, 60, 0) 70%)',
                boxShadow: '0 0 8px rgba(251, 146, 60, 0.3)'
              }}
            />
          </motion.div>
        );
      })}
      
      {/* Agent */}
      <motion.div
        className="absolute flex items-center justify-center"
        style={{
          width: `calc(100% / ${data.world_width || 10})`,
          height: `calc(100% / ${data.world_height || 10})`,
          left: `calc(${x} * (100% / ${data.world_width || 10}))`,
          top: `calc(${y} * (100% / ${data.world_height || 10}))`
        }}
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 15 
        }}
      >
        {/* Outer glow effect */}
        <motion.div 
          className="absolute w-full h-full rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(251, 146, 60, 0.3) 0%, rgba(251, 146, 60, 0) 70%)',
          }}
          animate={{
            scale: [1.2, 1.5, 1.2],
            opacity: [0.5, 0.3, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "loop"
          }}
        />
        
        {/* Agent body */}
        <motion.div 
          className="relative w-4/5 h-4/5 rounded-full shadow-neon-accent z-10 overflow-hidden"
          animate={{ 
            rotate: rotation,
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            rotate: { type: "spring", stiffness: 200, damping: 10 },
            scale: { repeat: Infinity, duration: 1.5 }
          }}
        >
          {/* Agent body gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent-300 to-accent-600 border-2 border-accent-400"></div>
          
          {/* Agent inner pattern */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-full bg-accent-400/50 flex items-center justify-center">
              <div className="w-1/2 h-1/2 rounded-full bg-accent-300/80"></div>
            </div>
          </div>
          
          {/* Direction indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-0 h-0 border-l-[6px] border-l-transparent border-b-[12px] border-b-accent-800 border-r-[6px] border-r-transparent"
              style={{ transform: 'translateY(-30%)' }}
            />
          </div>
          
          {/* Eyes */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex space-x-3" style={{ transform: 'translateY(-15%)' }}>
              <motion.div 
                className="w-2 h-2 bg-accent-950 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 1 }}
              />
              <motion.div 
                className="w-2 h-2 bg-accent-950 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 1.2 }}
              />
            </div>
          </div>
          
          {/* Animated rings */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-accent-300/50"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.7, 0, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop"
            }}
          />
          
          {/* Energy particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1 h-1 bg-accent-200 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  x: [0, Math.random() * 20 - 10],
                  y: [0, Math.random() * 20 - 10],
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0]
                }}
                transition={{
                  duration: 1 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>
        </motion.div>
        
        {/* Movement indicator */}
        <motion.div
          className="absolute bottom-0 w-full flex justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="px-1 py-0.5 bg-dark-800/80 rounded text-[8px] text-accent-300 font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            ({x},{y})
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

Agent.propTypes = {
  data: PropTypes.shape({
    position: PropTypes.arrayOf(PropTypes.number).isRequired,
    direction: PropTypes.number,
    world_width: PropTypes.number,
    world_height: PropTypes.number
  }),
  onPositionChange: PropTypes.func
};

export default Agent; 