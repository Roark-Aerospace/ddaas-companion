
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9bf6d4d481ef4a6b8c9260342f66d66d',
  appName: 'Roark Aerospace DDaaS',
  webDir: 'dist',
  server: {
    url: 'https://9bf6d4d4-81ef-4a6b-8c92-60342f66d66d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1e293b",
      showSpinner: false
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#1e293b"
    }
  }
};

export default config;
