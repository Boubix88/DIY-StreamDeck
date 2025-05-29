// Modes de contrôle des LED
export const MODE_STATIC = 1;
export const MODE_SCROLLING_STATIC = 2;
export const MODE_SCROLLING_RGB = 3;

// Écrans disponibles
export const SCREENS = {
  CPU: 'cpu',
  GPU: 'gpu',
  SPOTIFY: 'spotify',
  NETWORK: 'network',
  VOLUME: 'volume',
} as const;

export type ScreenType = typeof SCREENS[keyof typeof SCREENS];

// Paramètres par défaut
export const DEFAULT_SETTINGS = {
  rgb: {
    mode: MODE_STATIC,
    color: { r: 0, g: 0, b: 255 }, // Bleu par défaut
    speed: 10,
  },
  volume: 50,
  theme: 'dark',
  refreshRate: 1000, // ms
} as const;

// Chemins de fichiers
export const PATHS = {
  SETTINGS: 'settings.json',
  LOGS: 'logs',
} as const;

// Commandes série
export const SERIAL_COMMANDS = {
  SET_RGB: 'RGB',
  SET_BRIGHTNESS: 'BRIGHTNESS',
  SET_SCREEN: 'SCREEN',
  GET_INFO: 'GET_INFO',
} as const;

// Tailles des données
export const DATA_SIZES = {
  MAX_PAYLOAD: 512, // Taille maximale des données en octets
  HEADER_SIZE: 4, // Taille de l'en-tête en octets
} as const;

// Codes d'erreur
export const ERROR_CODES = {
  SERIAL_PORT_NOT_FOUND: 'SERIAL_PORT_NOT_FOUND',
  SERIAL_PORT_IN_USE: 'SERIAL_PORT_IN_USE',
  SERIAL_PORT_DISCONNECTED: 'SERIAL_PORT_DISCONNECTED',
  INVALID_DATA: 'INVALID_DATA',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Types de messages IPC
export const IPC_MESSAGES = {
  SERIAL: {
    CONNECT: 'serial:connect',
    DISCONNECT: 'serial:disconnect',
    SEND: 'serial:send',
    RECEIVE: 'serial:receive',
    LIST: 'serial:list',
    ERROR: 'serial:error',
  },
  SPOTIFY: {
    PLAY_PAUSE: 'spotify:play-pause',
    NEXT: 'spotify:next',
    PREVIOUS: 'spotify:previous',
    GET_CURRENT_TRACK: 'spotify:get-current-track',
    STATE_CHANGED: 'spotify:state-changed',
  },
  SYSTEM: {
    GET_INFO: 'system:get-info',
    GET_VOLUME: 'system:get-volume',
    SET_VOLUME: 'system:set-volume',
    GET_SETTINGS: 'system:get-settings',
    SAVE_SETTINGS: 'system:save-settings',
  },
} as const;
