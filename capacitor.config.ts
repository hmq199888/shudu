import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sudoku.game',
  appName: 'SudokuGame',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#0f0f1a',
    allowMixedContent: true
  }
};

export default config;
