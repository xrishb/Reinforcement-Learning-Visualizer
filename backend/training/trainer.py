import numpy as np
import logging
import time

logger = logging.getLogger(__name__)

class Trainer:
    """Class for training a reinforcement learning agent in a grid world environment"""
    
    def __init__(self, agent, world):
        """Initialize the trainer with an agent and a world"""
        self.agent = agent
        self.world = world
        self.current_path = []  # Track the current episode path
        self.visited_cells = []  # Track all visited cells
    
    def train_episode(self, max_steps=1000, visualize=False):
        """
        Train the agent for one episode
        
        Args:
            max_steps (int): Maximum number of steps per episode
            visualize (bool): Whether to update agent position for visualization
            
        Returns:
            tuple: (total_reward, steps) for the episode
        """
        # Reset the agent to the start position
        self.agent.reset()
        
        # Initialize episode variables
        total_reward = 0
        steps = 0
        done = False
        
        # Reset the current path for this episode
        self.current_path = []
        
        # Add initial position to path
        self.current_path.append(self.agent.position.copy().tolist())
        self.visited_cells.append(self.agent.position.copy().tolist())
        
        # Run the episode
        while not done and steps < max_steps:
            # Get the current state
            state = self.agent.get_state()
            
            # Choose an action using the agent's policy
            action = self.agent.choose_action(state)
            
            # Take the action and observe the next state and reward
            next_state, reward, done = self.agent.step(action)
            
            # Add current position to path
            self.current_path.append(self.agent.position.copy().tolist())
            self.visited_cells.append(self.agent.position.copy().tolist())
            
            # Update the agent's Q-table
            self.agent.update_q_table(state, action, reward, next_state, done)
            
            # Update episode variables
            total_reward += reward
            steps += 1
            
            # Log every 100 steps if the episode is long
            if steps % 100 == 0 and steps > 0:
                logger.debug(f"Step {steps}, State: {state}, Action: {action}, Reward: {reward:.2f}, Done: {done}")
            
            # Add a small delay if visualization is enabled
            if visualize:
                time.sleep(0.01)  # 10ms delay for smoother visualization
        
        # Log episode results
        logger.info(f"Episode completed: Steps: {steps}, Total Reward: {total_reward:.2f}, Goal Reached: {done}")
        
        # Store the path in the agent for visualization
        self.agent.last_episode_path = self.current_path
        
        return total_reward, steps
    
    def find_optimal_path(self, max_steps=1000):
        """Find the optimal path from start to goal using the trained Q-table
        
        Args:
            max_steps (int): Maximum steps to prevent infinite loops
            
        Returns:
            numpy.ndarray: Array of positions representing the optimal path
        """
        # Reset agent to start position
        self.agent.reset()
        
        # Initialize path with start position
        path = [self.agent.position.copy()]
        
        steps = 0
        done = False
        
        # Follow the optimal policy (no exploration)
        while not done and steps < max_steps:
            # Get current state
            state = self.agent.get_state()
            
            # Choose best action according to Q-table (no exploration)
            action = np.argmax(self.agent.q_table[state])
            
            # Take action
            _, _, done = self.agent.step(action)
            
            # Add position to path
            path.append(self.agent.position.copy())
            
            steps += 1
            
            # Break if we're stuck in a loop
            if steps > 2 and np.array_equal(path[-1], path[-3]):
                break
        
        # Convert path to numpy array
        return np.array(path)
        
    def get_current_path(self):
        """Get the current episode path
        
        Returns:
            list: List of positions representing the current episode path
        """
        return self.current_path
        
    def get_visited_cells(self):
        """Get all visited cells
        
        Returns:
            list: List of positions representing all visited cells
        """
        return self.visited_cells