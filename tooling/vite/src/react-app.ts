import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { type UserConfig, mergeConfig } from 'vite';
import { baseConfig } from './base.ts';

const reactAppConfig: UserConfig = mergeConfig(baseConfig, {
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});

export function createReactAppConfig(overrides: UserConfig = {}): UserConfig {
  return mergeConfig(reactAppConfig, overrides);
}
