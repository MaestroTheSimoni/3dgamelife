import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Shuffle, SkipForward, Palette, Brush, Grid3X3, X } from 'lucide-react';

const GRID_SIZE = 25;
const CELL_WIDTH = 24;
const CELL_HEIGHT = 14;

const GameOfLife = () => {
  const [grid, setGrid] = useState(() =>
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [speed, setSpeed] = useState(300);
  const [theme, setTheme] = useState('synthwave');
  const [paintMode, setPaintMode] = useState(false);
  const [showPatternEditor, setShowPatternEditor] = useState(false);
  const [patternInput, setPatternInput] = useState('');
  const intervalRef = useRef(null);

  // Theme configurations
  const themes = {
    dark: {
      bg: 'bg-gray-900',
      container: 'bg-gray-800',
      deadCell: 'bg-gray-700 border-gray-600',
      aliveCell: 'bg-blue-400 border-blue-300 shadow-blue-400/50',
      controls: 'bg-gray-700 text-white border-gray-600'
    },
    neon: {
      bg: 'bg-black',
      container: 'bg-gray-900',
      deadCell: 'bg-purple-900/20 border-purple-800/30',
      aliveCell: 'bg-pink-400 border-pink-300 shadow-pink-400/70',
      controls: 'bg-purple-900 text-pink-300 border-purple-700'
    },
    synthwave: {
      bg: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900',
      container: 'bg-black/50',
      deadCell: 'bg-cyan-900/10 border-cyan-800/20',
      aliveCell: 'bg-cyan-400 border-cyan-300 shadow-cyan-400/80',
      controls: 'bg-purple-800/80 text-cyan-300 border-purple-600'
    }
  };

  // Conway's Game of Life rules
  const getNeighbors = (grid, x, y) => {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const newX = x + i;
        const newY = y + j;
        if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
          count += grid[newX][newY] ? 1 : 0;
        }
      }
    }
    return count;
  };

  const nextGeneration = useCallback(() => {
    setGrid(currentGrid => {
      const newGrid = currentGrid.map(row => [...row]);

      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          const neighbors = getNeighbors(currentGrid, x, y);

          if (currentGrid[x][y]) {
            // Cell is alive
            if (neighbors < 2 || neighbors > 3) {
              newGrid[x][y] = false; // Dies
            }
          } else {
            // Cell is dead
            if (neighbors === 3) {
              newGrid[x][y] = true; // Becomes alive
            }
          }
        }
      }

      return newGrid;
    });

    setGeneration(prev => prev + 1);
  }, []);

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
    clearInterval(intervalRef.current);
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)));
    setGeneration(0);
  };

  const randomizeGrid = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setGrid(
      Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(null).map(() => Math.random() > 0.7)
      )
    );
    setGeneration(0);
  };

  const applyPattern = () => {
    if (!patternInput.trim()) return;

    setIsRunning(false);
    clearInterval(intervalRef.current);

    // Clear grid first
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));

    // Parse coordinates
    const lines = patternInput.trim().split('\n');
    lines.forEach(line => {
      const coords = line.trim().split(/[,\s]+/).map(n => parseInt(n.trim()));
      if (coords.length >= 2) {
        const [x, y] = coords;
        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
          newGrid[x][y] = true;
        }
      }
    });

    setGrid(newGrid);
    setGeneration(0);
    setShowPatternEditor(false);
    setPatternInput('');
  };

  const loadPresetPattern = (pattern) => {
    setPatternInput(pattern);
  };

  const toggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const stepForward = () => {
    if (!isRunning) {
      nextGeneration();
    }
  };

  // Calculate isometric position
  const getIsometricPosition = (x, y) => {
    const left = (x - y) * (CELL_WIDTH / 2);
    const top = (x + y) * (CELL_HEIGHT / 2);
    return { left, top };
  };

  const currentTheme = themes[theme];

  return (
    <div className={`h-screen w-screen overflow-auto ${currentTheme.bg}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Isometric Game of Life</h1>
          <p className="text-gray-300">Generation: {generation}</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setShowPatternEditor(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 hover:scale-105 ${currentTheme.controls}`}
          >
            <Grid3X3 size={20} />
            Pattern Editor
          </button>

          <button
            onClick={() => setPaintMode(!paintMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 hover:scale-105 ${paintMode
              ? 'bg-green-600 text-white border-green-500 shadow-green-500/50 shadow-lg'
              : currentTheme.controls
              }`}
          >
            <Brush size={20} />
            {paintMode ? 'Paint: ON' : 'Paint: OFF'}
          </button>

          <button
            onClick={toggleRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 hover:scale-105 ${currentTheme.controls}`}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            {isRunning ? 'Pause' : 'Play'}
          </button>

          <button
            onClick={stepForward}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 hover:scale-105 disabled:opacity-50 ${currentTheme.controls}`}
          >
            <SkipForward size={20} />
            Step
          </button>

          <button
            onClick={clearGrid}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 hover:scale-105 ${currentTheme.controls}`}
          >
            <RotateCcw size={20} />
            Clear
          </button>

          <button
            onClick={randomizeGrid}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 hover:scale-105 ${currentTheme.controls}`}
          >
            <Shuffle size={20} />
            Random
          </button>

          <div className="flex items-center gap-2">
            <label className="text-gray-300">Speed:</label>
            <input
              type="range"
              min="50"
              max="1000"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-gray-300 text-sm">{speed}ms</span>
          </div>

          <div className="flex items-center gap-2">
            <Palette size={20} className="text-gray-300" />
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${currentTheme.controls}`}
            >
              <option value="dark">Dark</option>
              <option value="neon">Neon</option>
              <option value="synthwave">Synthwave</option>
            </select>
          </div>
        </div>

        {/* Game Grid */}
        <div className="flex justify-center">
          <div
            className={`relative rounded-xl p-8 backdrop-blur-sm ${currentTheme.container}`}
            style={{
              width: GRID_SIZE * CELL_WIDTH + 400,   // was +200, now +400 for more space
              height: GRID_SIZE * CELL_HEIGHT + 400, // was +200, now +400 for more space
              overflow: 'hidden'
            }}
          >
            <div
              className="relative"
              style={{
                width: GRID_SIZE * CELL_WIDTH,
                height: GRID_SIZE * CELL_HEIGHT,
                margin: '200px auto' // was 100px, now 200px for more centering
              }}
            >
              {grid.map((row, x) =>
                row.map((cell, y) => {
                  const { left, top } = getIsometricPosition(x, y);
                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`absolute cursor-pointer ${!paintMode ? 'pointer-events-none' : ''}`}
                      style={{
                        left: left + GRID_SIZE * CELL_WIDTH / 2,
                        top: top + GRID_SIZE * CELL_HEIGHT / 4,
                        width: CELL_WIDTH,
                        height: CELL_HEIGHT,
                        zIndex: x + y + (cell ? 100 : 0),
                        cursor: paintMode ? 'crosshair' : 'not-allowed'
                      }}
                      onClick={() => paintMode && toggleCell(x, y)}
                    >
                      {/* Dead cell (flat rhombus) */}
                      <div
                        className={`absolute w-full h-full border transition-all duration-300 ease-out transform hover:scale-110 ${currentTheme.deadCell} hover:bg-opacity-50`}
                        style={{
                          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
                        }}
                      />

                      {/* Living cell (3D block) */}
                      {cell && (
                        <div className="absolute inset-0 transition-all duration-300 ease-out">
                          {/* Top face - elevated */}
                          <div
                            className={`absolute w-full h-full ${currentTheme.aliveCell} shadow-2xl transition-all duration-300 animate-pulse`}
                            style={{
                              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                              transform: 'translate(-2px, -4px) scale(1.1)'
                            }}
                          />

                          {/* Left side face */}
                          <div
                            className={`absolute ${currentTheme.aliveCell.split(' ')[0]} opacity-60`}
                            style={{
                              width: CELL_WIDTH * 0.7,
                              height: 6,
                              left: 2,
                              top: CELL_HEIGHT / 2 - 1,
                              clipPath: 'polygon(0% 0%, 70% 0%, 100% 100%, 0% 100%)',
                              transform: 'skewX(-30deg)'
                            }}
                          />

                          {/* Right side face */}
                          <div
                            className={`absolute ${currentTheme.aliveCell.split(' ')[0]} opacity-40`}
                            style={{
                              width: CELL_WIDTH * 0.7,
                              height: 6,
                              right: 2,
                              top: CELL_HEIGHT / 2 - 1,
                              clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
                              transform: 'skewX(30deg)'
                            }}
                          />

                          {/* Glow effect */}
                          <div
                            className="absolute inset-0 opacity-50 animate-ping"
                            style={{
                              background: theme === 'neon' ? 'radial-gradient(circle, rgba(244,114,182,0.6) 0%, transparent 70%)' :
                                theme === 'synthwave' ? 'radial-gradient(circle, rgba(34,211,238,0.6) 0%, transparent 70%)' :
                                  'radial-gradient(circle, rgba(96,165,250,0.6) 0%, transparent 70%)',
                              transform: 'translate(-4px, -8px) scale(1.4)',
                              borderRadius: '50%'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center mt-8 text-gray-400">
          <p className="mb-2">
            {paintMode
              ? "🎨 Paint Mode: Click cells to toggle them (works even while running!)"
              : "Click cells to toggle them on/off • Use controls to play/pause the simulation"
            }
          </p>
          <p>Conway's Game of Life rules: Live cells with 2-3 neighbors survive, dead cells with 3 neighbors become alive</p>
          <p className="text-sm mt-2">Grid Size: {GRID_SIZE} × {GRID_SIZE} cells</p>
          {/* Add your links below */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <a
              href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline hover:text-cyan-300 transition"
            >
              https://en.wikipedia.org/wiki/Conway_Game_of_Life
            </a>
            <a
              href="https://www.linkedin.com/in/riccardo-de-simoni-8917a0335/"
              className="text-fuchsia-400 underline hover:text-fuchsia-300 transition"
            >
              Contact me
            </a>
          </div>
        </div>

        {/* Advice Box */}
        <div className="flex justify-center mt-8">
          <div className="bg-blue-900/80 border border-blue-400 rounded-lg px-6 py-4 max-w-xl text-left shadow-lg">
            <h2 className="text-lg font-bold text-blue-200 mb-2">How to Play</h2>
            <ul className="list-disc list-inside text-blue-100 text-sm space-y-1">
              <li>
                <span className="font-semibold text-blue-300">Pattern Editor:</span>

                The Pattern Editor allows you to create, edit, and apply custom patterns to the Game of Life grid.
                You can enter coordinates (x, y) for live cells, one per line, or select from preset patterns.
                When select a pattern, you have to press APPLY PATTERN, letting you experiment and watch how different shapes evolve in real time.
                Use this tool to design your own starting configurations or explore classic patterns!
              </li>
              <li>
                <span className="font-semibold text-blue-300">Paint Mode ON:</span> Click cells to toggle them (even while running).
              </li>
              <li>
                <span className="font-semibold text-blue-300">Paint Mode OFF:</span> The board is <span className="font-bold text-red-300">read-only</span> and cannot be modified.
              </li>
              <li>
                Use the controls above to play, pause, step, clear, randomize, or edit patterns.
              </li>
              <li>
                <span className="font-semibold">Rules:</span> Live cells with 2-3 neighbors survive, dead cells with 3 neighbors become alive.
              </li>
            </ul>
          </div>
        </div>

        {/* Pattern Editor Sidebar */}
        {showPatternEditor && (
          <div className="fixed right-4 top-4 bottom-4 w-80 z-50">
            <div className={`${currentTheme.container} rounded-xl p-4 h-full overflow-y-auto backdrop-blur-sm border border-gray-600 shadow-2xl`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Pattern Editor</h3>
                <button
                  onClick={() => setShowPatternEditor(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4 text-sm">
                <p className="text-gray-300 mb-1">
                  Board: <span className="font-bold text-white">{GRID_SIZE}×{GRID_SIZE}</span>
                </p>
                <p className="text-gray-400 text-xs">
                  Range: 0-{GRID_SIZE - 1}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-white text-sm mb-2">Coordinates (x,y):</label>
                <textarea
                  value={patternInput}
                  onChange={(e) => setPatternInput(e.target.value)}
                  placeholder={`5,5\n6,5\n7,5`}
                  className="w-full h-24 p-2 bg-gray-800 text-white rounded text-sm border border-gray-600 focus:border-blue-500 focus:outline-none resize-none font-mono"
                />
              </div>

              <div className="mb-4">
                <p className="text-white text-sm mb-2">Presets:</p>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => loadPresetPattern('12,11\n12,12\n12,13')}
                    className={`px-2 py-1 rounded text-xs ${currentTheme.controls}`}
                  >
                    Blinker
                  </button>
                  <button
                    onClick={() => loadPresetPattern('10,10\n11,11\n11,12\n10,12\n9,12')}
                    className={`px-2 py-1 rounded text-xs ${currentTheme.controls}`}
                  >
                    Glider
                  </button>
                  <button
                    onClick={() => loadPresetPattern('10,10\n10,11\n11,10\n11,11')}
                    className={`px-2 py-1 rounded text-xs ${currentTheme.controls}`}
                  >
                    Block
                  </button>
                  <button
                    onClick={() => loadPresetPattern('10,9\n10,10\n10,11\n11,8\n11,12\n12,10')}
                    className={`px-2 py-1 rounded text-xs ${currentTheme.controls}`}
                  >
                    Toad
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={applyPattern}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Apply Pattern
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPatternInput('')}
                    className={`flex-1 px-3 py-1 rounded text-sm ${currentTheme.controls}`}
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowPatternEditor(false)}
                    className={`flex-1 px-3 py-1 rounded text-sm ${currentTheme.controls}`}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-600">
                <p className="text-xs text-gray-400">
                  💡 Tip: Apply patterns and watch them evolve in real-time
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameOfLife;