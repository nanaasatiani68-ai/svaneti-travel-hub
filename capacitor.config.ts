import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.georgiagatewayhub.app',
  appName: 'Georgia Gateway Hub',
  webDir: 'public',
  server: {
    url: 'https://georgiagatewayhub.com',
    cleartext: false,
  },
};

export default config;