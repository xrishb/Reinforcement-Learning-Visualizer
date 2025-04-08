import numpy as np
import random
import logging
import matplotlib.pyplot as plt

logger = logging.getLogger(__name__)

class World:
    """A grid world environment for our AI agent to navigate"""
    
    # Cell types
    EMPTY = 0
    OBSTACLE = 1
    AGENT = 2
    GOAL = 3
    
    # Action space
    UP = 0
    RIGHT = 1
    DOWN = 2
    LEFT = 3
    
    def __init__(self, size=15, obstacle_density=0.3):
        """Initialize the world with given size and obstacle density
        
        Args:
            size (int): The size of the square grid world
            obstacle_density (float): Percentage of cells that are obstacles (0.0 to 1.0)
        """
        self.size = size
        self.obstacle_density = obstacle_density
        self.grid = None
        self.start_position = None
        self.goal_position = None
        self.obstacles = None
        self.reset()
        
        logger.info(f"World created with size={size}, obstacle_density={obstacle_density}")
    
    def reset(self):
        """Reset the environment to initial state"""
        # Create an empty grid
        self.grid = np.zeros((self.size, self.size), dtype=int)
        
        # Add obstacles randomly based on density
        num_obstacles = int(self.size * self.size * self.obstacle_density)
        obstacle_positions = random.sample(range(self.size * self.size), num_obstacles)
        
        obstacle_coords = []
        for pos in obstacle_positions:
            row = pos // self.size
            col = pos % self.size
            self.grid[row, col] = self.OBSTACLE
            obstacle_coords.append((row, col))
        
        self.obstacles = np.array(obstacle_coords)
        
        # Find valid positions for agent and goal (not on obstacles)
        valid_positions = []
        for i in range(self.size):
            for j in range(self.size):
                if self.grid[i, j] == self.EMPTY:
                    valid_positions.append((i, j))
        
        if len(valid_positions) < 2:
            raise ValueError("Not enough empty cells for agent and goal")
        
        # Place agent and goal
        self.start_position = np.array(random.choice(valid_positions))
        valid_positions.remove(tuple(self.start_position))
        
        # Try to place goal at a minimum distance from agent
        min_distance = max(3, self.size // 3)  # Minimum distance between agent and goal
        far_positions = [pos for pos in valid_positions 
                        if self._manhattan_distance(self.start_position, pos) >= min_distance]
        
        if far_positions:
            self.goal_position = np.array(random.choice(far_positions))
        else:
            self.goal_position = np.array(random.choice(valid_positions))
        
        # Update grid with agent and goal
        self.grid[tuple(self.start_position)] = self.AGENT
        self.grid[tuple(self.goal_position)] = self.GOAL
        
        logger.debug(f"Reset world: start_position={self.start_position}, goal_position={self.goal_position}, obstacles={len(self.obstacles)}")
        
        return self.grid.copy()
    
    def reset_agent_position(self):
        """Reset the agent to the start position without resetting the entire environment"""
        # Find current agent position
        agent_pos = None
        for i in range(self.size):
            for j in range(self.size):
                if self.grid[i, j] == self.AGENT:
                    agent_pos = (i, j)
                    break
            if agent_pos:
                break
        
        # Clear current agent position if found
        if agent_pos:
            self.grid[agent_pos] = self.EMPTY
        
        # Set agent back to start position
        self.start_position = np.array(self.start_position)
        
        # Don't overwrite goal if agent and goal are at the same position
        if not np.array_equal(self.start_position, self.goal_position):
            self.grid[tuple(self.start_position)] = self.AGENT
        
        logger.debug(f"Reset agent position to start: {self.start_position}")
        
        return self.grid.copy()
    
    def is_obstacle(self, position):
        """Check if a position contains an obstacle
        
        Args:
            position: The position to check
            
        Returns:
            bool: True if the position contains an obstacle, False otherwise
        """
        # Convert position to tuple for indexing
        pos = tuple(position)
        
        # Check if position is within bounds
        if not (0 <= pos[0] < self.size and 0 <= pos[1] < self.size):
            return False
        
        return self.grid[pos] == self.OBSTACLE
    
    def get_state(self):
        """Get the current state of the environment
        
        Returns:
            numpy.ndarray: Copy of the grid
        """
        return self.grid.copy()
    
    def _manhattan_distance(self, pos1, pos2):
        """Calculate Manhattan distance between two positions"""
        return abs(pos1[0] - pos2[0]) + abs(pos1[1] - pos2[1])
    
    def __str__(self):
        """String representation of the grid world"""
        symbols = {
            self.EMPTY: '.',
            self.OBSTACLE: '#',
            self.AGENT: 'A',
            self.GOAL: 'G'
        }
        
        result = []
        for i in range(self.size):
            row = []
            for j in range(self.size):
                row.append(symbols[self.grid[i, j]])
            result.append(''.join(row))
        
        return '\n'.join(result)
    
    def step(self, action):
        """Take a step in the environment
        
        Args:
            action (int): The action to take (UP, RIGHT, DOWN, LEFT)
            
        Returns:
            tuple: (next_state, reward, done, info)
        """
        # Get current position
        row, col = self.start_position
        
        # Calculate new position based on action
        new_row, new_col = row, col
        
        if action == self.UP and row > 0:
            new_row -= 1
        elif action == self.RIGHT and col < self.size - 1:
            new_col += 1
        elif action == self.DOWN and row < self.size - 1:
            new_row += 1
        elif action == self.LEFT and col > 0:
            new_col -= 1
        
        # Check if new position is valid (not an obstacle)
        if self.grid[new_row, new_col] == self.OBSTACLE:
            # Hit an obstacle, stay in place and get negative reward
            reward = -1.0
            done = False
            info = {'status': 'hit_obstacle'}
        else:
            # Update agent position in grid
            self.grid[row, col] = self.EMPTY
            self.start_position = (new_row, new_col)
            
            # Check if reached goal
            if (new_row, new_col) == tuple(self.goal_position):
                reward = 10.0
                done = True
                info = {'status': 'reached_goal'}
            else:
                # Small negative reward for each step to encourage efficiency
                reward = -0.1
                done = False
                info = {'status': 'moved'}
            
            # Update agent position in grid (don't overwrite goal)
            if not done:
                self.grid[new_row, new_col] = self.AGENT
        
        # Return next state, reward, done flag, and info
        return self.grid.copy(), reward, done, info
    
    def get_state_size(self):
        """Return the size of the state vector for the neural network"""
        # Agent position (2) + Goal position (2) + Surroundings (4) + Relative goal position (2)
        return 10
    
    def get_action_size(self):
        """Return the number of possible actions"""
        return 4
    
    def get_info(self):
        """Return information about the current state of the world"""
        return {
            'grid': self.grid.tolist(),
            'start_position': self.start_position.tolist(),
            'goal_position': self.goal_position.tolist(),
            'size': self.size
        }
    
    def render(self, mode='human'):
        """Render the environment"""
        if mode == 'human':
            plt.figure(figsize=(8, 8))
            plt.imshow(self.grid, cmap='viridis')
            plt.title('World Grid')
            plt.colorbar(ticks=[self.EMPTY, self.OBSTACLE, self.AGENT, self.GOAL],
                         label='Cell Type')
            plt.grid(True)
            plt.show()
        
        return self.grid.copy()