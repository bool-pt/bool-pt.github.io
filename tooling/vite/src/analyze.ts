import { visualizer } from 'rollup-plugin-visualizer';
import type { PluginOption } from 'vite';

export function analyzePlugin(filename = 'stats.html'): PluginOption {
  return visualizer({
    filename,
    open: false,
    gzipSize: true,
    brotliSize: true,
    template: 'treemap',
  }) as PluginOption;
}
