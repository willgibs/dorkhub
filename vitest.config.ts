import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Next's bundler resolves `server-only` to its no-op `empty.js` via the
      // `react-server` export condition; vitest doesn't set that condition,
      // so without this alias any `import 'server-only'` throws at import
      // time. Point at the package's own stub — same file Next would use.
      'server-only': path.resolve(__dirname, './node_modules/server-only/empty.js'),
    },
  },
});
