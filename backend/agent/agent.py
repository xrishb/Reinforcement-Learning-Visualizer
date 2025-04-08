import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import random
import os
from collections import deque

class QNetwork(nn.Module):
    """Neural network for Q-learning"""
    
    def __init__(self, state_size, action_size, hidden_size=128):
        """Initialize the Q-Network
        
        Args:
            state_size (int): Size of the state vector
            action_size (int): Number of possible actions
            hidden_size (int): Size of the hidden layer
        """
        super(QNetwork, self).__init__()
        
        self.fc1 = nn.Linear(state_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, hidden_size)
        self.fc3 = nn.Linear(hidden_size, action_size)
        
        self.relu = nn.ReLU()
    
    def forward(self, x):
        """Forward pass through the network"""
        x = self.relu(self.fc1(x))
        x = self.relu(self.fc2(x))
        return self.fc3(x)

class ReplayBuffer:
    """Experience replay buffer for storing and sampling experiences"""
    
    def __init__(self, buffer_size=10000, batch_size=64):
        """Initialize the replay buffer
        
        Args:
            buffer_size (int): Maximum size of the buffer
            batch_size (int): Size of the batch to sample
        """
        self.buffer = deque(maxlen=buffer_size)
        self.batch_size = batch_size
    
    def add(self, state, action, reward, next_state, done):
        """Add an experience to the buffer"""
        self.buffer.append((state, action, reward, next_state, done))
    
    def sample(self):
        """Sample a batch of experiences from the buffer"""
        if len(self.buffer) < self.batch_size:
            return None
        
        batch = random.sample(self.buffer, self.batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)
        
        return states, actions, rewards, next_states, dones
    
    def __len__(self):
        """Return the current size of the buffer"""
        return len(self.buffer)

class RLAgent:
    """Reinforcement Learning Agent using Deep Q-Network"""
    
    def __init__(self, state_size, action_size, hidden_size=128, learning_rate=0.001):
        """Initialize the agent
        
        Args:
            state_size (int): Size of the state vector
            action_size (int): Number of possible actions
            hidden_size (int): Size of the hidden layer in the Q-Network
            learning_rate (float): Learning rate for the optimizer
        """
        self.state_size = state_size
        self.action_size = action_size
        
        # Q-Networks (current and target)
        self.q_network = QNetwork(state_size, action_size, hidden_size)
        self.target_network = QNetwork(state_size, action_size, hidden_size)
        self.target_network.load_state_dict(self.q_network.state_dict())
        
        # Optimizer
        self.optimizer = optim.Adam(self.q_network.parameters(), lr=learning_rate)
        
        # Replay buffer
        self.memory = ReplayBuffer()
        
        # Learning parameters
        self.batch_size = 64
        self.update_every = 4  # Update target network every 4 steps
        self.step_count = 0
    
    def step(self, state, action, reward, next_state, done):
        """Take a step in the learning process
        
        Args:
            state: Current state
            action: Action taken
            reward: Reward received
            next_state: Next state
            done: Whether the episode is done
        """
        # Add experience to memory
        self.memory.add(state, action, reward, next_state, done)
        
        # Increment step counter
        self.step_count += 1
        
        # Learn every few steps if enough samples in memory
        if self.step_count % self.update_every == 0 and len(self.memory) > self.batch_size:
            self.learn()
    
    def act(self, state, epsilon=0.0):
        """Choose an action based on the current state
        
        Args:
            state: Current state
            epsilon (float): Exploration rate (0.0 to 1.0)
            
        Returns:
            int: Selected action
        """
        # Convert state to tensor for neural network
        state_tensor = self._preprocess_state(state)
        
        # Epsilon-greedy action selection
        if random.random() > epsilon:
            # Exploit: choose best action
            self.q_network.eval()
            with torch.no_grad():
                action_values = self.q_network(state_tensor)
            self.q_network.train()
            return torch.argmax(action_values).item()
        else:
            # Explore: choose random action
            return random.choice(range(self.action_size))
    
    def learn(self):
        """Update the Q-Network based on experiences"""
        # Sample experiences from memory
        experiences = self.memory.sample()
        if experiences is None:
            return
        
        states, actions, rewards, next_states, dones = experiences
        
        # Convert to tensors
        states_tensor = torch.stack([self._preprocess_state(s) for s in states])
        actions_tensor = torch.tensor(actions, dtype=torch.long).unsqueeze(1)
        rewards_tensor = torch.tensor(rewards, dtype=torch.float).unsqueeze(1)
        next_states_tensor = torch.stack([self._preprocess_state(s) for s in next_states])
        dones_tensor = torch.tensor(dones, dtype=torch.float).unsqueeze(1)
        
        # Get Q-values for current states and actions
        q_values = self.q_network(states_tensor).gather(1, actions_tensor)
        
        # Get max Q-values for next states using target network
        with torch.no_grad():
            next_q_values = self.target_network(next_states_tensor).max(1)[0].unsqueeze(1)
        
        # Compute target Q-values
        target_q_values = rewards_tensor + (1 - dones_tensor) * 0.99 * next_q_values
        
        # Compute loss
        loss = nn.MSELoss()(q_values, target_q_values)
        
        # Update network
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        
        # Update target network
        if self.step_count % (self.update_every * 10) == 0:
            self.target_network.load_state_dict(self.q_network.state_dict())
    
    def _preprocess_state(self, state):
        """Convert state dictionary to tensor for neural network input"""
        # Extract features from state dictionary
        agent_pos = state['agent_pos']
        goal_pos = state['goal_pos']
        surroundings = state['surroundings']
        rel_goal_pos = state['rel_goal_pos']
        
        # Combine all features into a single vector
        state_vector = np.array([
            agent_pos[0], agent_pos[1],
            goal_pos[0], goal_pos[1],
            surroundings[0], surroundings[1], surroundings[2], surroundings[3],
            rel_goal_pos[0], rel_goal_pos[1]
        ], dtype=np.float32)
        
        return torch.from_numpy(state_vector)
    
    def save_model(self, filename):
        """Save the model to a file"""
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        # Save model state
        torch.save({
            'q_network_state': self.q_network.state_dict(),
            'target_network_state': self.target_network.state_dict(),
            'optimizer_state': self.optimizer.state_dict(),
        }, filename)
    
    def load_model(self, filename):
        """Load the model from a file"""
        if os.path.exists(filename):
            checkpoint = torch.load(filename)
            self.q_network.load_state_dict(checkpoint['q_network_state'])
            self.target_network.load_state_dict(checkpoint['target_network_state'])
            self.optimizer.load_state_dict(checkpoint['optimizer_state'])
            print(f"Model loaded from {filename}")
        else:
            print(f"No model found at {filename}")