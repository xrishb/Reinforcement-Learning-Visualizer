import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { motion, useAnimation } from "framer-motion";

const Dashboard = ({
  children,
  title = "AI Navigation Simulator",
  subtitle = "Reinforcement Learning Environment",
  isLoading = false,
  loadingText = "Loading...",
  error = null,
  onErrorDismiss = () => {},
}) => {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      opacity: 1,
      transition: { duration: 1 },
    });
  }, [controls]);

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950 text-white font-sans"
      initial={{ opacity: 0 }}
      animate={controls}
    >
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern bg-[length:50px_50px] opacity-10"></div>

        {/* Static gradient orbs instead of animated ones */}
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gradient-to-br from-primary-500/20 to-primary-700/5 blur-xl"
              style={{
                width: Math.random() * 400 + 200,
                height: Math.random() * 400 + 200,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                filter: "blur(60px)",
              }}
            />
          ))}
        </div>
      </div>

      <header className="relative z-10 bg-dark-900/80 backdrop-blur-md border-b border-primary-800/50 shadow-lg">
        <div className="container mx-auto py-6 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center">
            <div className="mr-0 sm:mr-6 mb-4 sm:mb-0">
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-neon relative overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400/0 to-primary-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <motion.div
                  className="absolute inset-0 bg-grid-pattern bg-[length:8px_8px] opacity-20"
                  animate={{
                    backgroundPosition: ["0px 0px", "24px 24px"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                ></motion.div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-9 w-9 text-white relative z-10"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
                <motion.div
                  className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary-300/20 to-primary-500/0"
                  animate={{
                    opacity: [0, 0.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                ></motion.div>
              </motion.div>
            </div>
            <div className="text-center sm:text-left">
              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-300 via-primary-400 to-primary-500"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {title}
              </motion.h1>
              <motion.p
                className="text-dark-300 mt-1 text-sm sm:text-base"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {subtitle}
              </motion.p>
            </div>

            {/* Decorative elements */}
            <div className="hidden md:flex ml-auto space-x-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`header-dot-${i}`}
                  className="w-2 h-2 rounded-full bg-primary-500"
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.4,
                    repeat: Infinity,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 relative z-10">
        {error && (
          <motion.div
            className="bg-gradient-to-r from-red-900/80 to-red-800/80 backdrop-blur-sm text-white p-6 mb-8 rounded-xl shadow-lg border border-red-700/50"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex">
                <div className="flex-shrink-0 mr-3">
                  <motion.div
                    className="w-10 h-10 rounded-full bg-red-800 flex items-center justify-center border border-red-600"
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(239, 68, 68, 0.2)",
                        "0 0 0 10px rgba(239, 68, 68, 0)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-red-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </motion.div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-red-200">
                    Error Detected
                  </h3>
                  <p className="text-red-100">{error}</p>
                </div>
              </div>
              <motion.button
                onClick={onErrorDismiss}
                className="text-red-300 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Content is always shown, no loading indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>

      <footer className="relative z-10 bg-dark-900/80 backdrop-blur-md p-6 mt-12 border-t border-primary-800/50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-dark-300 text-sm">
                Autonomous Agent Navigation using Reinforcement Learning
              </p>
              <p className="text-dark-400 text-xs mt-1">
                © {new Date().getFullYear()} - Built with React and Python
              </p>
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

Dashboard.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  isLoading: PropTypes.bool,
  loadingText: PropTypes.string,
  error: PropTypes.string,
  onErrorDismiss: PropTypes.func,
};

export default Dashboard;
