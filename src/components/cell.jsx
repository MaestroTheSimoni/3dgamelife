import React, { useState, useEffect } from 'react';

const Cell = ({ 
  x, 
  y, 
  isAlive, 
  experience = 0,
  generation = 0,
  neighbors = 0,
  onClick,
  onHover,
  onLeave,
  theme,
  paintMode,
  showStats = false,
  cellSize = { width: 24, height: 14 }
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Experience level calculation
  const getExperienceLevel = (exp) => {
    if (exp < 5) return { level: 'Newborn', color: 'text-green-400', bgColor: 'bg-green-500' };
    if (exp < 15) return { level: 'Young', color: 'text-blue-400', bgColor: 'bg-blue-500' };
    if (exp < 30) return { level: 'Mature', color: 'text-yellow-400', bgColor: 'bg-yellow-500' };
    if (exp < 50) return { level: 'Elder', color: 'text-purple-400', bgColor: 'bg-purple-500' };
    return { level: 'Ancient', color: 'text-red-400', bgColor: 'bg-red-500' };
  };

  const experienceLevel = getExperienceLevel(experience);

  // Calculate isometric position
  const getIsometricPosition = (x, y) => {
    const left = (x - y) * (cellSize.width / 2);
    const top = (x + y) * (cellSize.height / 2);
    return { left, top };
  };

  const { left, top } = getIsometricPosition(x, y);

  // Animation trigger when cell state changes
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [isAlive, experience]);

  const handleClick = () => {
    if (paintMode && onClick) {
      onClick(x, y);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onHover) {
      onHover(x, y, { isAlive, experience, generation, neighbors });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (onLeave) {
      onLeave();
    }
  };

  // Theme configurations
  const themes = {
    dark: {
      deadCell: 'bg-gray-700 border-gray-600',
      aliveCell: 'bg-blue-400 border-blue-300 shadow-blue-400/50',
      hover: 'bg-gray-600 border-gray-500'
    },
    neon: {
      deadCell: 'bg-purple-900/20 border-purple-800/30',
      aliveCell: 'bg-pink-400 border-pink-300 shadow-pink-400/70',
      hover: 'bg-purple-800/40 border-purple-700/50'
    },
    synthwave: {
      deadCell: 'bg-cyan-900/10 border-cyan-800/20',
      aliveCell: 'bg-cyan-400 border-cyan-300 shadow-cyan-400/80',
      hover: 'bg-cyan-800/30 border-cyan-700/40'
    }
  };

  const currentTheme = themes[theme] || themes.dark;

  // Experience-based visual enhancements
  const getExperienceVisuals = () => {
    if (!isAlive) return {};
    
    const { bgColor } = experienceLevel;
    const intensity = Math.min(experience / 50, 1);
    
    return {
      filter: `brightness(${1 + intensity * 0.3}) saturate(${1 + intensity * 0.2})`,
      transform: `scale(${1 + intensity * 0.1})`,
      transition: 'all 0.3s ease-out'
    };
  };

  return (
    <div
      className={`absolute cursor-pointer ${!paintMode ? 'pointer-events-none' : ''}`}
      style={{
        left: left + 200, // Offset for centering
        top: top + 100,
        width: cellSize.width,
        height: cellSize.height,
        zIndex: x + y + (isAlive ? 100 : 0),
        cursor: paintMode ? 'crosshair' : 'default'
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dead cell (flat rhombus) */}
      <div
        className={`absolute w-full h-full border transition-all duration-300 ease-out ${
          isHovered ? currentTheme.hover : currentTheme.deadCell
        } ${isHovered ? 'scale-110' : ''}`}
        style={{
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
        }}
      />

      {/* Living cell (3D block with experience effects) */}
      {isAlive && (
        <div 
          className="absolute inset-0 transition-all duration-300 ease-out"
          style={getExperienceVisuals()}
          key={animationKey}
        >
          {/* Top face - elevated with experience coloring */}
          <div
            className={`absolute w-full h-full ${currentTheme.aliveCell} shadow-2xl transition-all duration-300 animate-pulse`}
            style={{
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              transform: 'translate(-2px, -4px) scale(1.1)',
              backgroundColor: experience > 10 ? experienceLevel.bgColor.replace('bg-', '') : undefined
            }}
          />

          {/* Left side face */}
          <div
            className={`absolute ${currentTheme.aliveCell.split(' ')[0]} opacity-60`}
            style={{
              width: cellSize.width * 0.7,
              height: 6,
              left: 2,
              top: cellSize.height / 2 - 1,
              clipPath: 'polygon(0% 0%, 70% 0%, 100% 100%, 0% 100%)',
              transform: 'skewX(-30deg)'
            }}
          />

          {/* Right side face */}
          <div
            className={`absolute ${currentTheme.aliveCell.split(' ')[0]} opacity-40`}
            style={{
              width: cellSize.width * 0.7,
              height: 6,
              right: 2,
              top: cellSize.height / 2 - 1,
              clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
              transform: 'skewX(30deg)'
            }}
          />

          {/* Experience level indicator */}
          {experience > 0 && (
            <div
              className="absolute -top-2 -right-1 text-xs font-bold px-1 rounded-full"
              style={{
                backgroundColor: experienceLevel.bgColor.replace('bg-', ''),
                color: 'white',
                fontSize: '8px',
                minWidth: '12px',
                textAlign: 'center',
                zIndex: 1000
              }}
            >
              {experience}
            </div>
          )}

          {/* Enhanced glow effect based on experience */}
          <div
            className="absolute inset-0 opacity-50 animate-ping"
            style={{
              background: theme === 'neon' ? 
                `radial-gradient(circle, rgba(244,114,182,${0.6 + experience * 0.01}) 0%, transparent 70%)` :
                theme === 'synthwave' ? 
                `radial-gradient(circle, rgba(34,211,238,${0.6 + experience * 0.01}) 0%, transparent 70%)` :
                `radial-gradient(circle, rgba(96,165,250,${0.6 + experience * 0.01}) 0%, transparent 70%)`,
              transform: `translate(-4px, -8px) scale(${1.4 + experience * 0.02})`,
              borderRadius: '50%',
              animationDuration: `${2 - Math.min(experience * 0.02, 1)}s`
            }}
          />
        </div>
      )}

      {/* Stats tooltip on hover */}
      {isHovered && showStats && (
        <div
          className="absolute bg-black/90 text-white text-xs p-2 rounded shadow-lg pointer-events-none z-[1000]"
          style={{
            left: cellSize.width + 5,
            top: -10,
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div className="font-bold text-cyan-400">Cell ({x}, {y})</div>
          <div>Status: {isAlive ? 'Alive' : 'Dead'}</div>
          <div>Experience: {experience}</div>
          <div className={experienceLevel.color}>Level: {experienceLevel.level}</div>
          <div>Generation: {generation}</div>
          <div>Neighbors: {neighbors}</div>
        </div>
      )}
    </div>
  );
};

export default Cell;