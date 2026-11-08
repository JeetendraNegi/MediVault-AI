import { Platform } from 'react-native';

// Machine LAN IP on Wi-Fi (Host machine IP)
const LAN_IP = '192.168.1.4';

// Dynamically select API endpoint:
// - Android emulator uses 10.0.2.2 to connect to host machine localhost
// - Web app uses localhost
// - Physical mobile devices on Wi-Fi use host LAN IP
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return `http://localhost:8000/api`;
  }
  // Default to Host LAN IP on Wi-Fi (works for physical Android phones & iOS)
  return `http://${LAN_IP}:8000/api`;
};

const DEV_API_URL = getApiBaseUrl();

export const CONFIG = {
  API_BASE_URL: DEV_API_URL,
  FILE_BASE_URL: DEV_API_URL.replace(/\/api$/, ''),
  LAN_IP: LAN_IP,
  THEME: {
    bgDark: '#0f172a',
    cardBg: '#1e293b',
    cardBorder: '#334155',
    primary: '#38bdf8',
    primaryHover: '#0284c7',
    secondary: '#818cf8',
    accent: '#a855f7',
    textMain: '#f8fafc',
    textMuted: '#94a3b8',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171'
  }
};

