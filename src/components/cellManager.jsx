import React, { useState, useCallback, useEffect } from 'react';
import { Activity, BarChart3, TrendingUp, Users, Award, Eye, EyeOff } from 'lucide-react';

const CellManager = ({ 
  grid, 
  cellStats, 
  setCellStats, 
  generation, 
  experienceRules = { minExperience: 5, requireBothNeighbors: true },
  onRulesChange,
  theme = 'dark'
}) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [showGlobalStats, setShowGlobalStats] = useState(false);
  const [showExperienceOverlay, setShowExperienceOverlay] = useState(false);

  // Initialize cell stats if not provided
  useEffect(() => {
    if (!cellStats) {
      const initialStats = {};
      for (let x = 0; x < grid.length; x++) {
        for (let y = 0; y < grid[0].length; y++) {
          initialStats[`${x}-${y}`] = {
            experience: 0,
            timesAlive: 0,
            timesReproduced: 0,
            deathCount: 0,
            birthGeneration: null,
            lastAliveGeneration: null,
            neighbors: 0,
            reproductionAttempts: 0,
            maxNeighbors: 0,
            avgNeighbors: 0,
            lifespan: 0
          };
        }
      }
      setCellStats(initialStats);
    }
  }, [grid, cellStats, setCellStats]);

  // Update cell statistics
  const updateCellStats = useCallback((x, y, wasAlive, isAlive, neighbors) => {
    const key = `${x}-${y}`;
    
    setCellStats(prev => {
      const current = prev[key] || {
        experience: 0,
        timesAlive: 0,
        timesReproduced: 0,
        deathCount: 0,
        birthGeneration: null,
        lastAliveGeneration: null,
        neighbors: 0,
        reproductionAttempts: 0,
        maxNeighbors: 0,
        avgNeighbors: 0,
        lifespan: 0
      };

      const updated = { ...current };

      // Update neighbor statistics
      updated.neighbors = neighbors;
      updated.maxNeighbors = Math.max(updated.maxNeighbors, neighbors);
      updated.avgNeighbors = (updated.avgNeighbors + neighbors) / 2;

      // If cell just became alive
      if (!wasAlive && isAlive) {
        updated.timesAlive++;
        updated.birthGeneration = generation;
        updated.experience += 1;
      }

      // If cell is currently alive
      if (isAlive) {
        updated.lastAliveGeneration = generation;
        updated.experience += 0.1; // Experience grows while alive
        
        // Calculate current lifespan
        if (updated.birthGeneration !== null) {
          updated.lifespan = generation - updated.birthGeneration;
        }
      }

      // If cell just died
      if (wasAlive && !isAlive) {
        updated.deathCount++;
        updated.experience += 0.5; // Death gives some experience
      }

      // Track reproduction attempts (when cell has exactly 3 neighbors)
      if (isAlive && neighbors === 3) {
        updated.reproductionAttempts++;
      }

      return {
        ...prev,
        [key]: updated
      };
    });
  }, [generation, setCellStats]);

  // Enhanced reproduction rules with experience
  const canCellReproduce = useCallback((x, y, neighbors) => {
    const key = `${x}-${y}`;
    const stats = cellStats?.[key];
    
    if (!stats || neighbors !== 3) return false;

    // Original rule: dead cell with 3 neighbors
    if (neighbors === 3) {
      // New rule: check experience of closest neighbors
      if (experienceRules.minExperience > 0) {
        const neighborExperience = getNeighborExperience(x, y);
        
        if (experienceRules.requireBothNeighbors) {
          // Both closest neighbors must meet experience requirement
          return neighborExperience.filter(exp => exp >= experienceRules.minExperience).length >= 2;
        } else {
          // At least one neighbor must meet experience requirement
          return neighborExperience.some(exp => exp >= experienceRules.minExperience);
        }
      }
    }

    return true;
  }, [cellStats, experienceRules]);

  // Get experience levels of neighboring cells
  const getNeighborExperience = useCallback((x, y) => {
    const experiences = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const newX = x + i;
        const newY = y + j;
        if (newX >= 0 && newX < grid.length && newY >= 0 && newY < grid[0].length) {
          const key = `${newX}-${newY}`;
          const stats = cellStats?.[key];
          if (stats && grid[newX][newY]) { // Only count alive neighbors
            experiences.push(stats.experience);
          }
        }
      }
    }
    return experiences.sort((a, b) => b - a); // Sort by experience descending
  }, [grid, cellStats]);

  // Calculate global statistics
  const getGlobalStats = useCallback(() => {
    if (!cellStats) return {};

    const stats = Object.values(cellStats);
    const aliveCells = Object.keys(cellStats).filter(key => {
      const [x, y] = key.split('-').map(Number);
      return grid[x] && grid[x][y];
    });

    return {
      totalCells: stats.length,
      aliveCells: aliveCells.length,
      totalExperience: stats.reduce((sum, stat) => sum + stat.experience, 0),
      avgExperience: stats.reduce((sum, stat) => sum + stat.experience, 0) / stats.length,
      totalReproductions: stats.reduce((sum, stat) => sum + stat.timesReproduced, 0),
      totalDeaths: stats.reduce((sum, stat) => sum + stat.deathCount, 0),
      mostExperienced: stats.reduce((max, stat) => stat.experience > max.experience ? stat : max, { experience: 0 }),
      eldestCells: aliveCells.filter(key => {
        const stat = cellStats[key];
        return stat.experience >= 30;
      }).length
    };
  }, [cellStats, grid]);

  const globalStats = getGlobalStats();

  // Theme configurations
  const themes = {
    dark: {
      bg: 'bg-gray-800',
      text: 'text-white',
      accent: 'text-blue-400',
      border: 'border-gray-600'
    },
    neon: {
      bg: 'bg-purple-900/80',
      text: 'text-pink-300',
      accent: 'text-pink-400',
      border: 'border-purple-600'
    },
    synthwave: {
      bg: 'bg-black/50',
      text: 'text-cyan-300',
      accent: 'text-cyan-400',
      border: 'border-cyan-600'
    }
  };

  const currentTheme = themes[theme] || themes.dark;

  return (
    <div className="space-y-4">
      {/* Experience Rules Configuration */}
      <div className={`${currentTheme.bg} rounded-lg p-4 ${currentTheme.border} border backdrop-blur-sm`}>
        <h3 className={`text-lg font-bold ${currentTheme.text} mb-3 flex items-center gap-2`}>
          <Award className={currentTheme.accent} size={20} />
          Experience Rules
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm ${currentTheme.text} mb-2`}>
              Minimum Experience for Reproduction:
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={experienceRules.minExperience}
              onChange={(e) => onRulesChange?.({ 
                ...experienceRules, 
                minExperience: Number(e.target.value) 
              })}
              className={`w-full p-2 rounded ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border} border`}
            />
          </div>
          
          <div>
            <label className={`block text-sm ${currentTheme.text} mb-2`}>
              <input
                type="checkbox"
                checked={experienceRules.requireBothNeighbors}
                onChange={(e) => onRulesChange?.({ 
                  ...experienceRules, 
                  requireBothNeighbors: e.target.checked 
                })}
                className="mr-2"
              />
              Require Both Neighbors to Meet Experience
            </label>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setShowGlobalStats(!showGlobalStats)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border} border hover:opacity-80 transition-all`}
        >
          <BarChart3 size={16} />
          {showGlobalStats ? 'Hide' : 'Show'} Global Stats
        </button>
        
        <button
          onClick={() => setShowExperienceOverlay(!showExperienceOverlay)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border} border hover:opacity-80 transition-all`}
        >
          {showExperienceOverlay ? <EyeOff size={16} /> : <Eye size={16} />}
          Experience Overlay
        </button>
      </div>

      {/* Global Statistics */}
      {showGlobalStats && (
        <div className={`${currentTheme.bg} rounded-lg p-4 ${currentTheme.border} border backdrop-blur-sm`}>
          <h3 className={`text-lg font-bold ${currentTheme.text} mb-3 flex items-center gap-2`}>
            <TrendingUp className={currentTheme.accent} size={20} />
            Global Statistics
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${currentTheme.accent}`}>
                {globalStats.aliveCells}
              </div>
              <div className={`text-sm ${currentTheme.text}`}>Alive Cells</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${currentTheme.accent}`}>
                {globalStats.totalExperience?.toFixed(1)}
              </div>
              <div className={`text-sm ${currentTheme.text}`}>Total Experience</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${currentTheme.accent}`}>
                {globalStats.avgExperience?.toFixed(1)}
              </div>
              <div className={`text-sm ${currentTheme.text}`}>Avg Experience</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${currentTheme.accent}`}>
                {globalStats.eldestCells}
              </div>
              <div className={`text-sm ${currentTheme.text}`}>Elder Cells</div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Cell Details */}
      {selectedCell && (
        <div className={`${currentTheme.bg} rounded-lg p-4 ${currentTheme.border} border backdrop-blur-sm`}>
          <h3 className={`text-lg font-bold ${currentTheme.text} mb-3 flex items-center gap-2`}>
            <Activity className={currentTheme.accent} size={20} />
            Cell Details ({selectedCell.x}, {selectedCell.y})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className={currentTheme.text}>Status:</span>
              <span className={`ml-2 ${selectedCell.isAlive ? 'text-green-400' : 'text-red-400'}`}>
                {selectedCell.isAlive ? 'Alive' : 'Dead'}
              </span>
            </div>
            <div>
              <span className={currentTheme.text}>Experience:</span>
              <span className={`ml-2 ${currentTheme.accent}`}>
                {selectedCell.experience?.toFixed(1)}
              </span>
            </div>
            <div>
              <span className={currentTheme.text}>Times Alive:</span>
              <span className={`ml-2 ${currentTheme.accent}`}>
                {selectedCell.timesAlive}
              </span>
            </div>
            <div>
              <span className={currentTheme.text}>Deaths:</span>
              <span className={`ml-2 ${currentTheme.accent}`}>
                {selectedCell.deathCount}
              </span>
            </div>
            <div>
              <span className={currentTheme.text}>Lifespan:</span>
              <span className={`ml-2 ${currentTheme.accent}`}>
                {selectedCell.lifespan}
              </span>
            </div>
            <div>
              <span className={currentTheme.text}>Neighbors:</span>
              <span className={`ml-2 ${currentTheme.accent}`}>
                {selectedCell.neighbors}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CellManager;