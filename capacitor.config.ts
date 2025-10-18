import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.motomind.app',
  appName: 'MotoMind',
  webDir: 'out',
  server: {
    // Use local dev server during development
    // Comment out for production builds
    url: 'http://192.168.4.45:3005',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    // Custom URL scheme for OAuth callbacks
    scheme: 'motomind'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    Browser: {
      // For OAuth flows on native
      androidBrowserToolbarColor: '#000000'
    }
  }
};

export default config;
