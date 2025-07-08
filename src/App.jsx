import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Shuffle, SkipForward, Palette, Brush, Grid3X3, X } from 'lucide-react';
import Cell from './components/cell';
import CellManager from './components/cellManager';
import { GameLogic } from './components/gameLogic';

const GRID_SIZE = 25;
const CELL_SIZE = { width: 24, height: 14 };

const EnhancedGameOfLife = () => {
  const [grid, setGrid] = useState(() =>
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
  );
  const [cellStats, setCellStats] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [speed, setSpeed] = useState(300);
  const [theme, setTheme] = useState('synthwave');
  const [paintMode, setPaintMode] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [experienceRules, setExperienceRules] = useState({
    minExperience: 5,
    requireBothNeighbors: true
  });

  const gameLogic = useRef(new GameLogic(GRID_SIZE));
  const intervalRef = useRef(null);

  // Initialize cell stats
  useEffect(() => {
    const initialStats = {};
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
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
  }, []);

  // Update cell statistics using GameLogic
  const updateCellStats = useCallback((updates) => {
    setCellStats(prev => gameLogic.current.updateCellStatistics(prev, updates, generation));
  }, [generation]);

  // Next generation with experience system
  const nextGeneration = useCallback(() => {
    const { newGrid, updates } = gameLogic.current.nextGeneration(grid, cellStats, experienceRules);
    setGrid(newGrid);
    updateCellStats(updates);
    setGeneration(prev => prev + 1);
  }, [grid, cellStats, experienceRules, updateCellStats]);

  // Auto-run effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(nextGeneration, speed);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, speed, nextGeneration]);

  const toggleCell = (x, y) => {
    if (isRunning && !paintMode) return;
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[x][y] = !newGrid[x][y];
      return newGrid;
    });
  };

  const clearGrid = () => {
    setIsRunning(false);
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)));
    setGeneration(0);
    // Reset cell stats
    const resetStats = {};
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        resetStats[`${x}-${y}`] = {
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
    setCellStats(resetStats);
  };

  const randomizeGrid = () => {
    setIsRunning(false);
    setGrid(gameLogic.current.generateRandomGrid(0.3));
    setGeneration(0);
  };

  const handleCellHover = (x, y, cellData) => {
    setHoveredCell({ x, y, ...cellData });
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
  };

  // Get global stats using GameLogic
  const globalStats = React.useMemo(() => {
    return gameLogic.current.getGlobalStatistics(grid, cellStats);
  }, [grid, cellStats]);

  const themes = {
    dark: {
      bg: 'bg-gray-900',
      container: 'bg-gray-800',
      controls: 'bg-gray-700 text-white border-gray-600'
    },
    neon: {
      bg: 'bg-black',
      container: 'bg-gray-900',
      controls: 'bg-purple-900 text-pink-300 border-purple-700'
    },
    synthwave: {
      bg: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900',
      container: 'bg-black/50',
      controls: 'bg-purple-800/80 text-cyan-300 border-purple-600'
    }
  };

  const currentTheme = themes[theme];

  return (
    <div className={`min-h-screen w-full ${currentTheme.bg}`}>
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Enhanced Game of Life</h1>
          <p className="text-gray-300">Generation: {generation} | Experience System Active</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className={`${currentTheme.container} rounded-lg p-3 text-center`}>
            <div className="text-2xl font-bold text-cyan-400">{globalStats.aliveCells}</div>
            <div className="text-sm text-gray-300">Alive Cells</div>
          </div>
          <div className={`${currentTheme.container} rounded-lg p-3 text-center`}>
            <div className="text-2xl font-bold text-green-400">{globalStats.totalExperience?.toFixed(1)}</div>
            <div className="text-sm text-gray-300">Total Experience</div>
          </div>
          <div className={`${currentTheme.container} rounded-lg p-3 text-center`}>
            <div className="text-2xl font-bold text-yellow-400">{globalStats.avgExperience?.toFixed(1)}</div>
            <div className="text-sm text-gray-300">Avg Experience</div>
          </div>
          <div className={`${currentTheme.container} rounded-lg p-3 text-center`}>
            <div className="text-2xl font-bold text-purple-400">{globalStats.totalReproductions}</div>
            <div className="text-sm text-gray-300">Reproductions</div>
          </div>
          <div className={`${currentTheme.container} rounded-lg p-3 text-center`}>
            <div className="text-2xl font-bold text-red-400">{globalStats.totalDeaths}</div>
            <div className="text-sm text-gray-300">Deaths</div>
          </div>
        </div>

        {/* Cell Manager Component */}
        <CellManager
          grid={grid}
          cellStats={cellStats}
          setCellStats={setCellStats}
          generation={generation}
          experienceRules={experienceRules}
          onRulesChange={setExperienceRules}
          theme={theme}
        />

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <button
            onClick={() => setPaintMode(!paintMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              paintMode ? 'bg-green-600 text-white border-green-500' : currentTheme.controls
            }`}
          >
            <Brush size={20} />
            Paint: {paintMode ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${currentTheme.controls}`}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            {isRunning ? 'Pause' : 'Play'}
          </button>

          <button
            onClick={() => !isRunning && nextGeneration()}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all disabled:opacity-50 ${currentTheme.controls}`}
          >
            <SkipForward size={20} />
            Step
          </button>

          <button
            onClick={clearGrid}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${currentTheme.controls}`}
          >
            <RotateCcw size={20} />
            Clear
          </button>

          <button
            onClick={randomizeGrid}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${currentTheme.controls}`}
          >
            <Shuffle size={20} />
            Random
          </button>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'neon' : theme === 'neon' ? 'synthwave' : 'dark')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${currentTheme.controls}`}
          >
            <Palette size={20} />
            Theme
          </button>

          <button
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${currentTheme.controls}`}
          >
            <Grid3X3 size={20} />
            Stats: {showStats ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex justify-center mb-6">
          <div className={`${currentTheme.container} rounded-lg p-4 flex items-center gap-4`}>
            <span className="text-white">Speed:</span>
            <input
              type="range"
              min="50"
              max="1000"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="flex-1 max-w-xs"
            />
            <span className="text-white">{speed}ms</span>
          </div>
        </div>

        {/* Game Grid */}
        <div className="relative mx-auto" style={{ width: '800px', height: '600px' }}>
          <div className={`${currentTheme.container} rounded-lg p-4 relative overflow-hidden`}>
            {grid.map((row, x) =>
              row.map((isAlive, y) => {
                const cellInfo = gameLogic.current.getCellInfo(cellStats, x, y);
                return (
                  <Cell
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    isAlive={isAlive}
                    experience={cellInfo.experience}
                    generation={cellInfo.birthGeneration}
                    neighbors={cellInfo.neighbors}
                    onClick={toggleCell}
                    onHover={handleCellHover}
                    onLeave={handleCellLeave}
                    theme={theme}
                    paintMode={paintMode}
                    showStats={showStats}
                    cellSize={CELL_SIZE}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Hovered Cell Info */}
        {hoveredCell && (
          <div className={`${currentTheme.container} rounded-lg p-4 mt-4 max-w-md mx-auto`}>
            <h3 className="text-lg font-bold text-white mb-2">
              Cell ({hoveredCell.x}, {hoveredCell.y})
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-300">
                Status: <span className={hoveredCell.isAlive ? 'text-green-400' : 'text-red-400'}>
                  {hoveredCell.isAlive ? 'Alive' : 'Dead'}
                </span>
              </div>
              <div className="text-gray-300">
                Experience: <span className="text-cyan-400">{hoveredCell.experience?.toFixed(1)}</span>
              </div>
              <div className="text-gray-300">
                Generation: <span className="text-cyan-400">{hoveredCell.generation}</span>
              </div>
              <div className="text-gray-300">
                Neighbors: <span className="text-cyan-400">{hoveredCell.neighbors}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedGameOfLife;