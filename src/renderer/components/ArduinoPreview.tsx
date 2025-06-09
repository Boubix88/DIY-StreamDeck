import React, { useMemo } from 'react';

interface ArduinoPreviewProps {
  previewData: any;
  activeScreen: number;
}

// Types d'écrans disponibles
enum ScreenTypes {
  CPU = 0,
  GPU = 1,
  RAM = 2,
  NET = 3,
  VOLUME = 4
}

// Constantes pour le rendu SVG
const SCALE = 150 / 240;
const SCREEN_SCALE = 145 / 240;
const OFFSET_X = 30;
const OFFSET_Y = 20;
const PATH_OFFSET = 2.5;

// Noms des écrans pour l'affichage
const SCREEN_NAMES = ["CPU", "GPU", "RAM", "Réseau", "Volume"];

// Couleurs d'accent pour chaque type d'écran
const SCREEN_COLORS: { [key: number]: string } = {
  [ScreenTypes.CPU]: "#06b6d4", // cyan
  [ScreenTypes.GPU]: "#a855f7", // purple
  [ScreenTypes.RAM]: "#3b82f6", // blue
  [ScreenTypes.NET]: "#22c55e", // green
  [ScreenTypes.VOLUME]: "#f97316" // orange
};

const ArduinoPreview: React.FC<ArduinoPreviewProps> = ({ previewData, activeScreen }) => {
  // screenData doit être de la forme { t: { t: [[x, y, size, txt], ...], c: 'RRGGBB' }, v: [[svgPath, color], ...] }
  
  // Couleur d'accent pour l'écran actif
  const accentColor = SCREEN_COLORS[activeScreen] || "#4ade80";

  // Helper pour parser et redimensionner un path SVG simple ("M x y L x y ...") en points pour React
  function parseSvgPath(path: string) {
    // Très basique : supporte M x y L x y ... Z
    const cmds = path.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
    let d = '';
    for (const cmd of cmds) {
      const type = cmd[0];
      const nums = cmd.slice(1).trim().split(/[, ]+/).map(Number);
      if (type === 'M' || type === 'L' || type === 'm' || type === 'l') {
        // Appliquer le facteur d'échelle aux coordonnées x et y
        d += `${type} ${(nums[0] * SCREEN_SCALE + PATH_OFFSET).toFixed(2)} ${(nums[1] * SCREEN_SCALE + PATH_OFFSET).toFixed(2)} `;
      } else if (type === 'H' || type === 'h') {
        // Appliquer le facteur d'échelle à la coordonnée x
        d += `${type} ${(nums[0] * SCREEN_SCALE + PATH_OFFSET).toFixed(2)} `;
      } else if (type === 'V' || type === 'v') {
        // Appliquer le facteur d'échelle à la coordonnée y
        d += `${type} ${(nums[0] * SCREEN_SCALE + PATH_OFFSET).toFixed(2)} `;
      } else if (type === 'Z' || type === 'z') {
        d += 'Z ';
      } else if (type === 'C' || type === 'c') {
        // Pour les courbes de Bézier cubiques, échelle tous les points de contrôle
        d += `${type} ${nums.map(n => (n * SCREEN_SCALE + PATH_OFFSET).toFixed(2)).join(' ')} `;
      } else if (type === 'S' || type === 's' || type === 'Q' || type === 'q' || type === 'T' || type === 't') {
        // Pour les autres types de courbes, appliquer l'échelle de la même manière
        d += `${type} ${nums.map(n => (n * SCREEN_SCALE + PATH_OFFSET).toFixed(2)).join(' ')} `;
      }
    }
    return d.trim();
  }

  return (
    <div className="flex flex-col items-center p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border-2 border-gray-700 w-full h-full">
      <div className="relative w-48 h-fit flex justify-center">
        <svg width="150" height="150" viewBox="0 0 150 150">
          {/* Fond d'écran avec couleur d'accent */}
          <circle cx="75" cy="75" r="72" fill="#18181b"/>
          
          {/* Si nous avons des données valides pour cet écran */}
          {previewData && previewData.t && previewData.v ? (
            <>
              {/* Textes dynamiques */}
              {Array.isArray(previewData.t.t) && previewData.t.t.map((item: any, i: number) => (
                <text
                  key={`text-${i}`}
                  x={((item[0] + OFFSET_X) * SCALE).toFixed(1)}
                  y={((item[1] + OFFSET_Y) * SCALE).toFixed(1)}
                  fill={`#${previewData.t.c || 'fff'}`}
                  fontSize={item[2] ? item[2] * 5 : 16}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {item[3]}
                </text>
              ))}
              
              {/* SVG dynamiques */}
              {Array.isArray(previewData.v) && previewData.v.map((item: any, i: number) => (
                <path
                  key={`path-${i}`}
                  d={parseSvgPath(item[0])}
                  stroke={`#${item[1]}`}
                  fill="none"
                  strokeWidth={1.5}
                />
              ))}
            </>
          ) : (
            // Template de secours si pas de données
            //fallbackTemplate
            <></>
          )}
        </svg>
      </div>
      
      {/* Nom de l'écran avec couleur d'accent */}
      <div className="mt-2 text-gray-300 text-lg font-bold tracking-wider">
        <span className="mr-1" style={{ color: accentColor }}>{SCREEN_NAMES[activeScreen] || `Écran ${activeScreen + 1}`}</span>
      </div>
    </div>
  );
};

export default ArduinoPreview;
