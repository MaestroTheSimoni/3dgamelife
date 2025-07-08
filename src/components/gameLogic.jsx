/**
 * Enhanced Game of Life Logic with Experience System
 * 
 * This module contains the core game logic with experience-based rules
 * for cell reproduction and survival.
 */

export class GameLogic {
  constructor(gridSize = 25) {
    this.gridSize = gridSize;
  }

  /**
   * Count living neighbors around a cell
   */
  getNeighbors(grid, x, y) {
    let count = 0;
    const neighbors = [];
    
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        
        const newX = x + i;
        const newY = y + j;
        
        if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
          if (grid[newX][newY]) {
            count++;
            neighbors.push({ x: newX, y: newY });
          }
        }
      }
    }
    
    return { count, neighbors };
  }

  /**
   * Get experience levels of neighboring cells
   */
  getNeighborExperience(grid, cellStats, x, y) {
    const experiences = [];
    
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        
        const newX = x + i;
        const newY = y + j;
        
        if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
          if (grid[newX][newY]) { // Only count alive neighbors
            const key = `${newX}-${newY}`;
            const stats = cellStats[key];
            if (stats) {
              experiences.push({
                x: newX,
                y: newY,
                experience: stats.experience,
                distance: Math.abs(i) + Math.abs(j) // Manhattan distance
              });
            }
          }
        }
      }
    }
    
    // Sort by distance (closest first), then by experience (highest first)
    return experiences.sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return b.experience - a.experience;
    });
  }

  /**
   * Check if a cell can reproduce based on experience rules
   */
  canCellReproduce(grid, cellStats, x, y, neighborCount, experienceRules) {
    // Original Conway's rule: dead cell with exactly 3 neighbors
    if (neighborCount !== 3) return false;
    
    // If no experience rules, use original Conway's rules
    if (!experienceRules || experienceRules.minExperience === 0) {
      return true;
    }
    
    // Get neighbor experiences
    const neighborExperiences = this.getNeighborExperience(grid, cellStats, x, y);
    
    // Check experience requirements
    if (experienceRules.requireBothNeighbors) {
      // At least 2 neighbors must meet experience requirement
      const qualifiedNeighbors = neighborExperiences.filter(
        n => n.experience >= experienceRules.minExperience
      );
      return qualifiedNeighbors.length >= 2;
    } else {
      // At least 1 neighbor must meet experience requirement
      return neighborExperiences.some(n => n.experience >= experienceRules.minExperience);
    }
  }

  /**
   * Check if a living cell can survive
   */
  canCellSurvive(neighborCount, experience = 0) {
    // Original Conway's rule: 2 or 3 neighbors to survive
    if (neighborCount === 2 || neighborCount === 3) {
      return true;
    }
    
    // Enhanced rule: very experienced cells (Ancient level) have slight survival bonus
    if (experience >= 50 && neighborCount === 1) {
      return Math.random() < 0.1; // 10% chance to survive with 1 neighbor
    }
    
    return false;
  }

  /**
   * Calculate the next generation
   */
  nextGeneration(currentGrid, cellStats, experienceRules = {}) {
    const newGrid = currentGrid.map(row => [...row]);
    const updates = [];

    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        const { count: neighborCount } = this.getNeighbors(currentGrid, x, y);
        const key = `${x}-${y}`;
        const currentStats = cellStats[key] || { experience: 0 };
        const isCurrentlyAlive = currentGrid[x][y];

        let willBeAlive = false;

        if (isCurrentlyAlive) {
          // Cell is alive - check survival
          willBeAlive = this.canCellSurvive(neighborCount, currentStats.experience);
        } else {
          // Cell is dead - check reproduction
          willBeAlive = this.canCellReproduce(
            currentGrid, 
            cellStats, 
            x, 
            y, 
            neighborCount, 
            experienceRules
          );
        }

        newGrid[x][y] = willBeAlive;

        // Track what changed for statistics
        if (isCurrentlyAlive !== willBeAlive) {
          updates.push({
            x,
            y,
            wasAlive: isCurrentlyAlive,
            isAlive: willBeAlive,
            neighbors: neighborCount,
            reason: willBeAlive ? (isCurrentlyAlive ? 'survived' : 'born') : 'died',
            experience: currentStats.experience
          });
        }
      }
    }

    return { newGrid, updates };
  }

  /**
   * Update cell statistics based on generation changes
   */
  updateCellStatistics(cellStats, updates, generation) {
    const newStats = { ...cellStats };

    updates.forEach(({ x, y, wasAlive, isAlive, neighbors, reason, experience }) => {
      const key = `${x}-${y}`;
      const current = newStats[key] || {
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
        lifespan: 0,
        survivalBonus: 0
      };

      // Update neighbor statistics
      current.neighbors = neighbors;
      current.maxNeighbors = Math.max(current.maxNeighbors, neighbors);
      current.avgNeighbors = (current.avgNeighbors + neighbors) / 2;

      // Handle birth
      if (reason === 'born') {
        current.timesAlive++;
        current.birthGeneration = generation;
        current.experience += 1; // Birth experience
        current.timesReproduced++;
      }

      // Handle survival
      if (reason === 'survived') {
        current.lastAliveGeneration = generation;
        current.experience += 0.1; // Survival experience
        
        // Special survival bonus for experienced cells
        if (current.experience >= 50 && neighbors === 1) {
          current.survivalBonus++;
          current.experience += 0.5; // Bonus for surviving against odds
        }
      }

      // Handle death
      if (reason === 'died') {
        current.deathCount++;
        current.experience += 0.3; // Death experience
        
        // Calculate final lifespan
        if (current.birthGeneration !== null) {
          current.lifespan = generation - current.birthGeneration;
        }
      }

      // Update current lifespan for living cells
      if (isAlive && current.birthGeneration !== null) {
        current.lifespan = generation - current.birthGeneration;
      }

      newStats[key] = current;
    });

    return newStats;
  }

  /**
   * Get cell statistics for display
   */
  getCellInfo(cellStats, x, y) {
    const key = `${x}-${y}`;
    return cellStats[key] || {
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
      lifespan: 0,
      survivalBonus: 0
    };
  }

  /**
   * Get global statistics
   */
  getGlobalStatistics(grid, cellStats) {
    const stats = Object.values(cellStats);
    const aliveCells = [];
    
    // Count alive cells
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        if (grid[x][y]) {
          aliveCells.push({ x, y, stats: this.getCellInfo(cellStats, x, y) });
        }
      }
    }

    const totalExperience = stats.reduce((sum, stat) => sum + stat.experience, 0);
    const avgExperience = totalExperience / stats.length;
    
    // Find most experienced cell
    const mostExperienced = stats.reduce((max, stat) => 
      stat.experience > max.experience ? stat : max, { experience: 0 }
    );

    // Experience level distribution
    const experienceLevels = {
      newborn: stats.filter(s => s.experience < 5).length,
      young: stats.filter(s => s.experience >= 5 && s.experience < 15).length,
      mature: stats.filter(s => s.experience >= 15 && s.experience < 30).length,
      elder: stats.filter(s => s.experience >= 30 && s.experience < 50).length,
      ancient: stats.filter(s => s.experience >= 50).length
    };

    return {
      totalCells: this.gridSize * this.gridSize,
      aliveCells: aliveCells.length,
      totalExperience,
      avgExperience,
      mostExperienced,
      experienceLevels,
      totalReproductions: stats.reduce((sum, stat) => sum + stat.timesReproduced, 0),
      totalDeaths: stats.reduce((sum, stat) => sum + stat.deathCount, 0),
      longestLifespan: stats.reduce((max, stat) => Math.max(max, stat.lifespan), 0),
      survivalBonuses: stats.reduce((sum, stat) => sum + stat.survivalBonus, 0)
    };
  }

  /**
   * Load a pattern into the grid
   */
  loadPattern(pattern, offsetX = 0, offsetY = 0) {
    const grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(false));
    
    pattern.forEach(([x, y]) => {
      const newX = x + offsetX;
      const newY = y + offsetY;
      
      if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
        grid[newX][newY] = true;
      }
    });

    return grid;
  }

  /**
   * Generate random grid with specified density
   */
  generateRandomGrid(density = 0.3) {
    return Array(this.gridSize).fill(null).map(() =>
      Array(this.gridSize).fill(null).map(() => Math.random() < density)
    );
  }

  /**
   * Validate experience rules
   */
  validateExperienceRules(rules) {
    const defaults = {
      minExperience: 0,
      requireBothNeighbors: false
    };

    return {
      ...defaults,
      ...rules,
      minExperience: Math.max(0, Math.min(100, rules.minExperience || 0))
    };
  }
}

// Predefined patterns
export const PATTERNS = {
  glider: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
  blinker: [[1, 0], [1, 1], [1, 2]],
  block: [[0, 0], [0, 1], [1, 0], [1, 1]],
  toad: [[1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1]],
  beacon: [[0, 0], [1, 0], [0, 1], [3, 2], [2, 3], [3, 3]],
  pulsar: [
    [2, 0], [3, 0], [4, 0], [8, 0], [9, 0], [10, 0],
    [0, 2], [5, 2], [7, 2], [12, 2],
    [0, 3], [5, 3], [7, 3], [12, 3],
    [0, 4], [5, 4], [7, 4], [12, 4],
    [2, 5], [3, 5], [4, 5], [8, 5], [9, 5], [10, 5],
    [2, 7], [3, 7], [4, 7], [8, 7], [9, 7], [10, 7],
    [0, 8], [5, 8], [7, 8], [12, 8],
    [0, 9], [5, 9], [7, 9], [12, 9],
    [0, 10], [5, 10], [7, 10], [12, 10],
    [2, 12], [3, 12], [4, 12], [8, 12], [9, 12], [10, 12]
  ],
  gosperGliderGun: [
    [1, 5], [2, 5], [1, 6], [2, 6],
    [11, 5], [11, 6], [11, 7], [12, 4], [12, 8], [13, 3], [13, 9], [14, 3], [14, 9],
    [15, 6], [16, 4], [16, 8], [17, 5], [17, 6], [17, 7], [18, 6],
    [21, 3], [21, 4], [21, 5], [22, 3], [22, 4], [22, 5], [23, 2], [23, 6],
    [25, 1], [25, 2], [25, 6], [25, 7],
    [35, 3], [35, 4], [36, 3], [36, 4]
  ]
};

export default GameLogic;