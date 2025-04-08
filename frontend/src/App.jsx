import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Dashboard from "./components/Dashboard";
import ControlPanel from "./components/ControlPanel";
import EnvironmentVisualization from "./components/EnvironmentVisualization";
import TrainingStats from "./components/TrainingStats";

// API base URL
const API_URL = "http://localhost:5000";

function App() {
  // State variables
  const [worldData, setWorldData] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [trainingData, setTrainingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trainingInProgress, setTrainingInProgress] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [visualizationSpeed, setVisualizationSpeed] = useState(0);
  const [activeTab, setActiveTab] = useState("environment"); // 'environment', 'stats' only
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Function to generate a new world
  const handleGenerateWorld = async (params) => {
    try {
      // Don't set loading state to avoid showing loading indicator
      setError(null);
      setWorldData(null);
      setAgentData(null);
      setTrainingData(null);

      const response = await axios.post(`${API_URL}/world`, {
        size: params.size,
        obstacle_density: params.obstacleDensity,
      });

      setWorldData(response.data);
      // Automatically switch to environment tab when world is generated
      setActiveTab("environment");
    } catch (err) {
      console.error("Error generating world:", err);
      setError(
        `Failed to generate world: ${err.response?.data?.error || err.message}`
      );
    }
  };

  // Function to initialize the agent
  const handleInitializeAgent = async (params) => {
    if (!worldData) return;

    try {
      // Don't set loading state to avoid showing loading indicator
      setError(null);

      const response = await axios.post(`${API_URL}/agent`, {
        learning_rate: params.learningRate,
        discount_factor: params.discountFactor,
        exploration_rate: params.explorationRate,
      });

      setAgentData(response.data);
    } catch (err) {
      console.error("Error initializing agent:", err);
      setError(
        `Failed to initialize agent: ${
          err.response?.data?.error || err.message
        }`
      );
    }
  };

  // Function to start training
  const handleStartTraining = async (params) => {
    if (!worldData || !agentData) return;

    try {
      // Don't set loading state to avoid showing loading indicator
      setError(null);
      setTrainingInProgress(true);
      setTotalEpisodes(params.episodes);
      setCurrentEpisode(0);
      setIsPaused(false);

      // If visualization is enabled, we'll poll for updates
      if (params.visualizeTraining) {
        // Start training in the background
        axios
          .post(`${API_URL}/train`, {
            episodes: params.episodes,
            visualize: true,
            delay: params.visualizationSpeed,
          })
          .catch((err) => {
            console.error("Training error:", err);
            setError(
              `Training error: ${err.response?.data?.error || err.message}`
            );
            setTrainingInProgress(false);
          });

        // Start polling for updates
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await axios.get(
              `${API_URL}/training_status`
            );
            const { completed, current_episode, training_data, paused } =
              statusResponse.data;

            setCurrentEpisode(current_episode);
            setIsPaused(paused);

            if (training_data) {
              setTrainingData(training_data);
              // Switch to stats tab when training data is available
              if (activeTab !== "stats" && current_episode > 5) {
                setActiveTab("stats");
              }
            }

            if (completed) {
              clearInterval(pollInterval);
              setTrainingInProgress(false);

              // Get final world data with optimal path
              const worldResponse = await axios.get(`${API_URL}/world`);
              setWorldData(worldResponse.data);
              // Switch back to environment tab when training is complete
              setActiveTab("environment");
            }
          } catch (pollErr) {
            console.error("Error polling training status:", pollErr);
            clearInterval(pollInterval);
            setTrainingInProgress(false);
          }
        }, 1000); // Poll every second
      } else {
        // If visualization is disabled, just wait for training to complete
        const response = await axios.post(`${API_URL}/train`, {
          episodes: params.episodes,
          visualize: false,
        });

        setTrainingData(response.data);

        // Get updated world data with optimal path
        const worldResponse = await axios.get(`${API_URL}/world`);
        setWorldData(worldResponse.data);

        setTrainingInProgress(false);
        // Switch to environment tab when training is complete
        setActiveTab("environment");
      }
    } catch (err) {
      console.error("Error starting training:", err);
      setError(
        `Failed to start training: ${err.response?.data?.error || err.message}`
      );
      setTrainingInProgress(false);
    }
  };

  // Function to reset the environment
  const handleReset = async () => {
    try {
      // Don't set loading state to avoid showing loading indicator
      setError(null);

      await axios.post(`${API_URL}/reset`);

      setWorldData(null);
      setAgentData(null);
      setTrainingData(null);
      setCurrentEpisode(0);
      setTotalEpisodes(0);
      setActiveTab("environment");
    } catch (err) {
      console.error("Error resetting environment:", err);
      setError(
        `Failed to reset environment: ${
          err.response?.data?.error || err.message
        }`
      );
    }
  };

  // Function to toggle pause/resume training
  const handleTogglePause = async () => {
    if (!trainingInProgress) return;

    try {
      // Don't set loading state to avoid showing loading indicator
      setError(null);

      const response = await axios.post(`${API_URL}/toggle_pause`);
      setIsPaused(response.data.paused);
    } catch (err) {
      console.error("Error toggling pause:", err);
      setError(
        `Failed to toggle pause: ${err.response?.data?.error || err.message}`
      );
    }
  };

  // Function to stop training
  const handleStopTraining = async () => {
    if (!trainingInProgress) return;

    try {
      // Don't set loading state to avoid showing loading indicator
      setError(null);

      await axios.post(`${API_URL}/stop_training`);
      setTrainingInProgress(false);

      // Get final world data with optimal path
      const worldResponse = await axios.get(`${API_URL}/world`);
      setWorldData(worldResponse.data);
      // Switch to environment tab when training is stopped
      setActiveTab("environment");
    } catch (err) {
      console.error("Error stopping training:", err);
      setError(
        `Failed to stop training: ${err.response?.data?.error || err.message}`
      );
    }
  };

  // Function to reset agent position
  const handleResetAgent = async () => {
    if (!worldData) return;

    try {
      // Don't set loading state to avoid showing loading indicator
      setError(null);

      const response = await axios.post(`${API_URL}/reset_agent`);

      // Update agent data
      if (agentData) {
        setAgentData({
          ...agentData,
          position: response.data.position,
        });
      }
    } catch (err) {
      console.error("Error resetting agent:", err);
      setError(
        `Failed to reset agent: ${err.response?.data?.error || err.message}`
      );
    }
  };

  // Function to update visualization speed
  const handleSpeedChange = (speed) => {
    setVisualizationSpeed(speed);
  };

  // Tab variants for animations
  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <Dashboard
      title="Autonomous Agent Navigation"
      subtitle="Reinforcement Learning Environment"
      isLoading={false} // Always set to false to avoid showing loading indicator
      error={error}
      onErrorDismiss={() => setError(null)}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Control Panel */}
        <div className="lg:col-span-1">
          <ControlPanel
            onGenerateWorld={handleGenerateWorld}
            onInitializeAgent={handleInitializeAgent}
            onStartTraining={handleStartTraining}
            onTogglePause={handleTogglePause}
            onStopTraining={handleStopTraining}
            onResetAgent={handleResetAgent}
            onSpeedChange={handleSpeedChange}
            worldGenerated={!!worldData}
            agentInitialized={!!agentData}
            trainingInProgress={trainingInProgress}
            isPaused={isPaused}
            visualizationSpeed={visualizationSpeed}
          />
        </div>

        {/* Right column - Visualization */}
        <div className="lg:col-span-2">
          {/* Mobile Tab Navigation */}
          <div className="flex lg:hidden mb-4 bg-dark-900/80 backdrop-blur-sm rounded-lg border border-primary-900/30 overflow-hidden">
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === "environment"
                  ? "bg-primary-900/50 text-white"
                  : "text-dark-300"
              }`}
              onClick={() => setActiveTab("environment")}
            >
              Environment
            </button>
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === "stats"
                  ? "bg-primary-900/50 text-white"
                  : "text-dark-300"
              }`}
              onClick={() => setActiveTab("stats")}
            >
              Stats
            </button>
          </div>

          {/* Environment Visualization */}
          <div
            className={`${
              activeTab === "environment" ? "block" : "hidden lg:block"
            }`}
          >
            <EnvironmentVisualization
              worldData={worldData}
              agentData={agentData}
              isLoading={false} // Always set to false to avoid showing loading indicator
              trainingInProgress={trainingInProgress}
              currentEpisode={currentEpisode}
              totalEpisodes={totalEpisodes}
              isPaused={isPaused}
            />
          </div>
        </div>
      </div>

      {/* Training Stats - Full width below the grid */}
      <div
        className={`mt-6 ${
          activeTab === "stats" ? "block" : "hidden lg:block"
        }`}
      >
        <TrainingStats
          trainingData={trainingData}
          isTraining={trainingInProgress}
          currentEpisode={currentEpisode}
        />
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden z-50">
        <div className="relative">
          {/* Main FAB Button */}
          <button
            className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center ${
              isMobileMenuOpen
                ? "bg-dark-800"
                : "bg-gradient-to-r from-primary-600 to-primary-700"
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-primary-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            )}
          </button>

          {/* FAB Menu */}
          {isMobileMenuOpen && (
            <div className="absolute bottom-16 right-0 bg-dark-800 rounded-lg shadow-xl border border-primary-900/30 w-48 overflow-hidden">
              <div className="p-2 space-y-1">
                {trainingInProgress && (
                  <>
                    <button
                      className="w-full text-left px-3 py-2 rounded-md text-sm flex items-center text-dark-200 hover:bg-dark-700"
                      onClick={() => {
                        handleTogglePause();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-primary-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {isPaused ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        )}
                      </svg>
                      {isPaused ? "Resume Training" : "Pause Training"}
                    </button>

                    <button
                      className="w-full text-left px-3 py-2 rounded-md text-sm flex items-center text-dark-200 hover:bg-dark-700"
                      onClick={() => {
                        handleStopTraining();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                        />
                      </svg>
                      Stop Training
                    </button>
                  </>
                )}

                {agentData && !trainingInProgress && (
                  <button
                    className="w-full text-left px-3 py-2 rounded-md text-sm flex items-center text-dark-200 hover:bg-dark-700"
                    onClick={() => {
                      handleResetAgent();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-secondary-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Reset Agent
                  </button>
                )}

                <div className="border-t border-dark-700 my-1 pt-1">
                  <button
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center ${
                      activeTab === "environment"
                        ? "text-primary-300 bg-dark-700"
                        : "text-dark-200 hover:bg-dark-700"
                    }`}
                    onClick={() => {
                      setActiveTab("environment");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Environment
                  </button>

                  <button
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center ${
                      activeTab === "stats"
                        ? "text-primary-300 bg-dark-700"
                        : "text-dark-200 hover:bg-dark-700"
                    }`}
                    onClick={() => {
                      setActiveTab("stats");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Statistics
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dashboard>
  );
}

export default App;
