import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import numpy as np
import random
import time
import sys
from collections import defaultdict
import threading

# Add the parent directory to the path to import from sibling directories
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import our custom modules
from environment.world import World
from agent.q_learning_agent import QLearningAgent
from training.trainer import Trainer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Global variables to store our environment and agent
world = None
agent = None
trainer = None
training_thread = None
training_status = {
    "completed": False,
    "current_episode": 0,
    "total_episodes": 0,
    "training_data": None,
    "current_path": [],  # Track current episode path
    "visited_cells": [],  # Track all visited cells
    "paused": False      # Track if training is paused
}

@app.route('/world', methods=['GET', 'POST'])
def generate_world():
    global world
    
    if request.method == 'POST':
        data = request.json
        size = data.get('size', 15)
        obstacle_density = data.get('obstacle_density', 0.3)
        
        logger.info(f"Generating world with size={size}, obstacle_density={obstacle_density}")
        
        # Create a new world
        world = World(size=size, obstacle_density=obstacle_density)
        world.reset()
        
        # Return the world data
        return jsonify({
            'width': world.size,
            'height': world.size,
            'obstacles': world.obstacles.tolist(),
            'start_position': world.start_position.tolist(),
            'goal_position': world.goal_position.tolist()
        })
    else:
        # Return the current world data
        if world is None:
            return jsonify({"error": "No world has been generated yet"}), 400
        
        # If agent has been trained, include the optimal path
        path = None
        if agent is not None and agent.q_table is not None:
            path = find_optimal_path()
            
        return jsonify({
            'width': world.size,
            'height': world.size,
            'obstacles': world.obstacles.tolist(),
            'start_position': world.start_position.tolist(),
            'goal_position': world.goal_position.tolist(),
            'path': path
        })

@app.route('/agent', methods=['GET', 'POST'])
def initialize_agent():
    global world, agent
    
    if world is None:
        return jsonify({"error": "World must be generated first"}), 400
    
    if request.method == 'POST':
        data = request.json
        learning_rate = data.get('learning_rate', 0.1)
        discount_factor = data.get('discount_factor', 0.9)
        exploration_rate = data.get('exploration_rate', 0.1)
        
        logger.info(f"Initializing agent with learning_rate={learning_rate}, discount_factor={discount_factor}, exploration_rate={exploration_rate}")
        
        # Create a new agent
        agent = QLearningAgent(
            world=world,
            learning_rate=learning_rate,
            discount_factor=discount_factor,
            exploration_rate=exploration_rate
        )
        
        # Return the agent data
        return jsonify({
            'position': agent.position.tolist(),
            'direction': int(agent.direction)
        })
    else:
        # Return the current agent data
        if agent is None:
            return jsonify({"error": "No agent has been initialized yet"}), 400
            
        return jsonify({
            'position': agent.position.tolist(),
            'direction': int(agent.direction)
        })

def train_agent_thread(episodes, visualize=False, delay=0):
    global world, agent, trainer, training_status
    
    try:
        # Reset training status
        training_status["completed"] = False
        training_status["current_episode"] = 0
        training_status["total_episodes"] = episodes
        training_status["training_data"] = {
            "episode_rewards": [],
            "episode_steps": []
        }
        training_status["current_path"] = []
        training_status["visited_cells"] = []
        training_status["paused"] = False
        
        # Create a trainer
        trainer = Trainer(agent=agent, world=world)
        
        # Train the agent
        for episode in range(episodes):
            # Check if training was stopped completely, exit if true
            if training_status["completed"]:
                return
                
            # Update current episode
            training_status["current_episode"] = episode + 1
            
            # Check if training is paused
            while training_status["paused"]:
                time.sleep(0.5)  # Sleep while paused
                
                # If training was stopped completely, exit
                if training_status["completed"]:
                    return
            
            # Train for one episode
            episode_reward, episode_steps = trainer.train_episode(visualize=visualize)
            
            # Update training data
            training_status["training_data"]["episode_rewards"].append(float(episode_reward))
            training_status["training_data"]["episode_steps"].append(int(episode_steps))
            
            # Update path tracking
            training_status["current_path"] = trainer.get_current_path()
            training_status["visited_cells"] = trainer.get_visited_cells()
            
            # Add delay if visualization is enabled
            if visualize and delay > 0:
                time.sleep(delay / 1000)  # Convert ms to seconds
        
        # Find optimal path
        path = find_optimal_path()
        
        # Update training status
        training_status["completed"] = True
        
        logger.info(f"Training completed after {episodes} episodes")
        
    except Exception as e:
        logger.error(f"Error during training: {str(e)}")
        training_status["completed"] = True  # Mark as completed to stop polling

@app.route('/train', methods=['POST'])
def train_agent():
    global world, agent, trainer, training_thread, training_status
    
    if world is None or agent is None:
        return jsonify({"error": "World and agent must be initialized first"}), 400
    
    data = request.json
    episodes = data.get('episodes', 100)
    visualize = data.get('visualize', False)
    delay = data.get('delay', 0)
    
    logger.info(f"Starting training for {episodes} episodes (visualize={visualize}, delay={delay}ms)")
    
    # If visualization is enabled, start training in a separate thread
    if visualize:
        if training_thread is not None and training_thread.is_alive():
            return jsonify({"error": "Training is already in progress"}), 400
            
        training_thread = threading.Thread(
            target=train_agent_thread, 
            args=(episodes, visualize, delay)
        )
        training_thread.start()
        
        return jsonify({"message": "Training started in background"})
    else:
        # If visualization is disabled, train synchronously
        trainer = Trainer(agent=agent, world=world)
        
        episode_rewards = []
        episode_steps = []
        
        for episode in range(episodes):
            episode_reward, episode_steps_count = trainer.train_episode()
            episode_rewards.append(float(episode_reward))
            episode_steps.append(int(episode_steps_count))
        
        # Find optimal path
        path = find_optimal_path()
        
        return jsonify({
            "episode_rewards": episode_rewards,
            "episode_steps": episode_steps
        })

@app.route('/training_status', methods=['GET'])
def get_training_status():
    global training_status
    
    # Include agent position if available
    if agent is not None:
        training_status["agent_position"] = agent.position.tolist()
        training_status["agent_direction"] = int(agent.direction)
    
    return jsonify(training_status)

@app.route('/reset', methods=['POST'])
def reset_environment():
    global world, agent, trainer, training_thread, training_status
    
    # Reset all global variables
    world = None
    agent = None
    trainer = None
    training_thread = None
    training_status = {
        "completed": False,
        "current_episode": 0,
        "total_episodes": 0,
        "training_data": None,
        "current_path": [],  # Track current episode path
        "visited_cells": [],  # Track all visited cells
        "paused": False      # Track if training is paused
    }
    
    logger.info("Environment reset")
    
    return jsonify({"message": "Environment reset successfully"})

@app.route('/step', methods=['POST'])
def take_step():
    global world, agent, training_status
    
    if world is None or agent is None:
        return jsonify({"error": "World and agent must be initialized first"}), 400
    
    data = request.json
    action = data.get('action')
    
    if action is None:
        return jsonify({"error": "Action is required"}), 400
    
    # Take a step
    next_state, reward, done = agent.step(action)
    
    # Track the agent's position
    training_status["current_path"].append(agent.position.tolist())
    training_status["visited_cells"].append(agent.position.tolist())
    
    return jsonify({
        'position': agent.position.tolist(),
        'direction': int(agent.direction),
        'reward': float(reward),
        'done': done,
        'world_width': world.size,
        'world_height': world.size
    })

def find_optimal_path():
    """Find the optimal path using the trained Q-table"""
    global world, agent, trainer
    
    if agent.q_table is None:
        return None
    
    # Use the trainer to find the optimal path
    if trainer is None:
        trainer = Trainer(agent=agent, world=world)
    
    # Find the optimal path
    path = trainer.find_optimal_path()
    
    # Convert numpy array to list for JSON serialization
    return path.tolist() if path is not None else None

@app.route('/toggle_pause', methods=['POST'])
def toggle_pause_training():
    global training_status
    
    if training_thread is None or not training_thread.is_alive():
        return jsonify({"error": "No training in progress"}), 400
    
    # Toggle pause state
    training_status["paused"] = not training_status["paused"]
    
    logger.info(f"Training {'paused' if training_status['paused'] else 'resumed'}")
    
    return jsonify({
        "paused": training_status["paused"]
    })

@app.route('/stop_training', methods=['POST'])
def stop_training():
    global training_status, training_thread
    
    if training_thread is None or not training_thread.is_alive():
        return jsonify({"error": "No training in progress"}), 400
    
    # Mark training as completed to stop the thread
    training_status["paused"] = False
    training_status["completed"] = True
    
    logger.info("Training stopped by user")
    
    return jsonify({
        "message": "Training stopped"
    })

@app.route('/reset_agent', methods=['POST'])
def reset_agent_position():
    global world, agent
    
    if world is None:
        return jsonify({"error": "World must be generated first"}), 400
    
    # Reset agent position in the world
    world.reset_agent_position()
    
    # Reset agent position and direction
    if agent is not None:
        agent.reset()
    
    logger.info("Agent position reset to start")
    
    return jsonify({
        "position": world.start_position.tolist(),
        "message": "Agent position reset to start"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)