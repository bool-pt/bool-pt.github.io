import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './base.ts';

const setupDom = fileURLToPath(new URL('./setup-dom.ts', import.meta.url));

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: [setupDom],
    },
  })
);
