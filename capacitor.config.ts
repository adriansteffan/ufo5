import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ufo5.app',
  appName: 'ufo5',
  webDir: 'dist',
  server: {
    hostname: 'localhost',
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['*']
  }
};

export default config;
