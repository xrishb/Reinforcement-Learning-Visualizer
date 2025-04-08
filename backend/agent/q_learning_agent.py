import numpy as np
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

class QLearningAgent:
    """
    Q-Learning Agent for navigating in a grid world environment.
    
    This agent learns a policy using Q-learning, a model-free reinforcement
    learning algorithm that learns the value of actions in states.
    """
    
    # Action mapping: 0=Forward, 1=Turn Right, 2=Turn Left, 3=Backward
    ACTIONS = {
        0: "Forward",
        1: "Turn Right",
        2: "Turn Left",
        3: "Backward"
    }
    
    # Direction mapping: 0=North, 1=East, 2=South, 3=West
    DIRECTIONS = {
        0: "North",
        1: "East",
        2: "South",
        3: "West"
    }
    
    def __init__(self, world, learning_rate=0.1, discount_factor=0.9, exploration_rate=0.1):
        """
        Initialize the Q-Learning Agent.
        
        Args:
            world: The environment the agent will interact with
            learning_rate: Alpha - learning rate for Q-value updates
            discount_factor: Gamma - discount factor for future rewards
            exploration_rate: Epsilon - probability of taking a random action
        """
        self.world = world
        self.learning_rate = learning_rate
        self.discount_factor = discount_factor
        self.exploration_rate = exploration_rate
        
        # Initialize Q-table as a defaultdict to handle new states automatically
        self.q_table = defaultdict(lambda: np.zeros(len(self.ACTIONS)))
        
        # Initialize agent position and direction
        self.reset()
        
        # Store the path taken in the last episode
        self.last_episode_path = []
        
        logger.info(f"Agent initialized with learning_rate={learning_rate}, discount_factor={discount_factor}, exploration_rate={exploration_rate}")
    
    def reset(self):
        """Reset the agent to the start position."""
        self.position = np.array(self.world.start_position)
        self.direction = 0  # Start facing North
        return self.get_state()
    
    def get_state(self):
        """
        Get the current state representation.
        
        Returns:
            tuple: (position_x, position_y, direction)
        """
        return (int(self.position[0]), int(self.position[1]), int(self.direction))
    
    def choose_action(self, state):
        """
        Choose an action using epsilon-greedy policy.
        
        Args:
            state: The current state
            
        Returns:
            int: The chosen action
        """
        # Exploration: choose a random action
        if np.random.random() < self.exploration_rate:
            return np.random.randint(len(self.ACTIONS))
        
        # Exploitation: choose the best action from Q-table
        return np.argmax(self.q_table[state])
    
    def step(self, action):
        """
        Take a step in the environment using the given action.
        
        Args:
            action: The action to take (0=Forward, 1=Turn Right, 2=Turn Left, 3=Backward)
            
        Returns:
            tuple: (next_state, reward, done)
        """
        # Save the current position
        old_position = self.position.copy()
        
        # Initialize reward and done flag
        reward = 0.0
        done = False
        
        # Execute the action
        if action == 0:  # Forward
            # Move in the current direction
            if self.direction == 0:  # North
                self.position[0] -= 1
            elif self.direction == 1:  # East
                self.position[1] += 1
            elif self.direction == 2:  # South
                self.position[0] += 1
            elif self.direction == 3:  # West
                self.position[1] -= 1
        
        elif action == 1:  # Turn Right
            self.direction = (self.direction + 1) % 4
        
        elif action == 2:  # Turn Left
            self.direction = (self.direction - 1) % 4
        
        elif action == 3:  # Backward
            # Move in the opposite direction
            if self.direction == 0:  # North
                self.position[0] += 1
            elif self.direction == 1:  # East
                self.position[1] -= 1
            elif self.direction == 2:  # South
                self.position[0] -= 1
            elif self.direction == 3:  # West
                self.position[1] += 1
        
        # Check if the new position is valid
        if not self.is_valid_position(self.position):
            # If not, revert to the old position
            self.position = old_position
            reward = -1.0  # Penalty for hitting a wall or obstacle
        else:
            # Check if the agent reached the goal
            if np.array_equal(self.position, self.world.goal_position):
                reward = 10.0  # Reward for reaching the goal
                done = True
            else:
                # Small penalty for each step to encourage shorter paths
                reward = -0.1
        
        return self.get_state(), reward, done
    
    def update_q_table(self, state, action, reward, next_state, done):
        """
        Update the Q-table using the Q-learning update rule.
        
        Args:
            state: The current state
            action: The action taken
            reward: The reward received
            next_state: The next state
            done: Whether the episode is done
        """
        # Get the current Q-value
        current_q = self.q_table[state][action]
        
        # Calculate the maximum Q-value for the next state
        max_next_q = np.max(self.q_table[next_state]) if not done else 0
        
        # Calculate the new Q-value using the Q-learning update rule
        new_q = current_q + self.learning_rate * (reward + self.discount_factor * max_next_q - current_q)
        
        # Update the Q-table
        self.q_table[state][action] = new_q
    
    def is_valid_position(self, position):
        """
        Check if a position is valid (within bounds and not an obstacle)
        
        Args:
            position: The position to check
            
        Returns:
            bool: True if the position is valid, False otherwise
        """
        # Check if the position is within bounds
        if (position[0] < 0 or position[0] >= self.world.size or
            position[1] < 0 or position[1] >= self.world.size):
            return False
        
        # Check if the position is an obstacle
        if self.world.is_obstacle(position):
            return False
        
        return True
    
    def _calculate_reward(self):
        """
        Calculate the reward for the current position.
        
        Returns:
            A numerical reward value
        """
        # Check if agent reached the goal
        if np.array_equal(self.position, self.world.goal_pos):
            return 100  # High reward for reaching the goal
        
        # Penalty for each step to encourage finding the shortest path
        step_penalty = -0.1
        
        # Calculate distance to goal (Manhattan distance)
        distance_to_goal = np.sum(np.abs(self.position - np.array(self.world.goal_pos)))
        
        # Small reward for getting closer to the goal
        proximity_reward = -0.1 * distance_to_goal
        
        return step_penalty + proximity_reward 