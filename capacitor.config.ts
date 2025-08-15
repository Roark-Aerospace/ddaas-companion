
import { CapacitorConfig } from '@capacitor/core @capacitor/cli';

const config: CapacitorConfig = {
  appId: 'lovable.9bf6d4d481ef4a6b8c9260342f66d66d.app',
  appName: 'Roark DDaaS Companion',
  webDir: 'dist',
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
