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
    // Custom URL scheme for OAuth callbacks
    scheme: 'motomind'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    Browser: {
      // Use in-app browser for OAuth
      androidBrowserToolbarColor: '#000000'
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '642890697588-tpd1g2uduf51qmdkkdrue565sq40vf4s.apps.googleusercontent.com',
      clientId: '642890697588-ecojj9mtif8j4n1gu7jri95a681ghgca.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
