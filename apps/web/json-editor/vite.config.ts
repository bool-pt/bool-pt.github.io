import { analyzePlugin } from '@bool/vite-config/analyze';
import { createReactAppConfig } from '@bool/vite-config/react-app';

const analyze = process.env.ANALYZE === 'true';

export default createReactAppConfig({
  server: { port: 5174 },
  build: {
    rollupOptions: {
      plugins: analyze ? [analyzePlugin()] : [],
    },
  },
});
