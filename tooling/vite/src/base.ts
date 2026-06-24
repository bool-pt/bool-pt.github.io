import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type UserConfig, mergeConfig } from 'vite';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(currentDir, '../../..');

const baseConfig: UserConfig = {
  build: {
    target: 'es2022',
  },
  server: {
    watch: {
      ignored: ['!**/packages/**'],
    },
    fs: {
      allow: [monorepoRoot],
    },
  },
};

export function createBaseConfig(overrides: UserConfig = {}): UserConfig {
  return mergeConfig(baseConfig, overrides);
}

export { baseConfig, baseConfig as baseViteConfig };
