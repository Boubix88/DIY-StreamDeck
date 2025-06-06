import React from 'react';

interface ArduinoPreviewProps {
  previewData: any;
  activeScreen: number;
}

const SCALE = 200 / 240;
const OFFSET_X = 30;
const OFFSET_Y = 20;

const ArduinoPreview: React.FC<ArduinoPreviewProps> = ({ previewData, activeScreen }) => {
  // screenData doit être de la forme { t: { t: [[x, y, size, txt], ...], c: 'RRGGBB' }, v: [[svgPath, color], ...] }
  const screenData = previewData && previewData[activeScreen] ? previewData[activeScreen] : null;

  // Helper pour parser un path SVG simple ("M x y L x y ...") en points pour React
  function parseSvgPath(path: string) {
    // Très basique : supporte M x y L x y ... Z
    const cmds = path.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
    let d = '';
    for (const cmd of cmds) {
      const type = cmd[0];
      const nums = cmd.slice(1).trim().split(/[, ]+/).map(Number);
      if (type === 'M' || type === 'L') {
        d += `${type} ${nums[0]} ${nums[1]} `;
      } else if (type === 'H') {
        d += `${type} ${nums[0]} `;
      } else if (type === 'V') {
        d += `${type} ${nums[0]} `;
      } else if (type === 'Z') {
        d += 'Z ';
      }
    }
    return d.trim();
  }

  return (
    <div className="flex flex-col items-center p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border-2 border-gray-700 w-full h-full">
      <div className="relative w-48 h-fit flex justify-center">
        <svg width="150" height="150" viewBox="0 0 150 150">
          <circle cx="75" cy="75" r="72" fill="#18181b" stroke="#4ade80" strokeWidth="4" />
          {/* Textes dynamiques */}
          {screenData &&
            screenData.t &&
            Array.isArray(screenData.t.t) &&
            screenData.t.t.map((item: any, i: number) => (
              <text
                key={i}
                x={((item[0] + OFFSET_X) * SCALE).toFixed(1)}
                y={((item[1] + OFFSET_Y) * SCALE).toFixed(1)}
                fill={`#${screenData.t.c || 'fff'}`}
                fontSize={item[2] ? item[2] * 5 * SCALE : 16}
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {item[3]}
              </text>
            ))}
          {/* SVG dynamiques */}
          {screenData &&
            screenData.v &&
            Array.isArray(screenData.v) &&
            screenData.v.map((item: any, i: number) => (
              <path
                key={i}
                d={parseSvgPath(item[0])}
                stroke={`#${item[1]}`}
                fill="none"
                strokeWidth={1.5}
              />
            ))}
          {/* Fallback : numéro d'écran si rien */}
          {!screenData && (
            <text x="50%" y="50%" textAnchor="middle" fill="#fff" fontSize="28" dy=".3em">
              {activeScreen + 1}
            </text>
          )}
        </svg>
      </div>
      <div className="mt-2 text-gray-300 text-lg font-bold tracking-wider">
        Écran {activeScreen + 1}
      </div>
    </div>
  );
};

export default ArduinoPreview;
