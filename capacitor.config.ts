import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.motomind.app',
  appName: 'MotoMind',
  webDir: 'out',
  server: {
    // Use local dev server during development
    // Comment out for production builds
    url: 'http://localhost:3005',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
