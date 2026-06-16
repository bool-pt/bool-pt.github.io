import { defineConfig, mergeConfig } from 'vitest/config';
import domConfig from './dom.ts';

export default mergeConfig(
  domConfig,
  defineConfig({
    test: {},
  })
);
