import { defineConfig } from 'vite'
import { resolve } from 'path'
import fs from 'fs'

export default defineConfig({
  root: '.',
  // Serve static assets from the shared root data folder instead of frontend/public
  publicDir: resolve(__dirname, '../data'),
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
    // Expose the root data folder during dev so fetch('/data/...') works
    fs: { allow: [resolve(__dirname, '..')] }
  },
  plugins: [
    {
      name: 'serve-root-data',
      configureServer(server) {
        server.middlewares.use('/data', (req, res, next) => {
          const urlPath = decodeURIComponent(req.url.split('?')[0] || '/');
          const filePath = resolve(__dirname, '../data', `.${urlPath}`);

          // Block path traversal
          if (!filePath.startsWith(resolve(__dirname, '../data'))) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
          }

          fs.readFile(filePath, (err, data) => {
            if (err) return next();

            const ext = filePath.split('.').pop();
            const type = ext === 'csv' ? 'text/csv' : 'text/plain';
            res.setHeader('Content-Type', type);
            res.end(data);
          });
        });
      },
      // Copy the data folder into the build output so production fetches still work
      closeBundle() {
        const source = resolve(__dirname, '../data');
        const dest = resolve(__dirname, 'dist/data');
        fs.mkdirSync(dest, { recursive: true });
        fs.cpSync(source, dest, { recursive: true });
      }
    }
  ]
})
