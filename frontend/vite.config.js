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
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        fighter: resolve(__dirname, 'fighter.html')
      }
    }
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

          const sendFile = (path) => {
            fs.readFile(path, (err, data) => {
              if (err) return next();
              const ext = path.split('.').pop();
              const type = ext === 'csv' ? 'text/csv' : 'text/plain';
              res.setHeader('Content-Type', type);
              res.end(data);
            });
          };

          // If elo_history.csv is missing locally, fall back to any backup copy
          const fallbacks = ['elo_history.csv', 'elo_history_copy.csv', 'elo_history_copy1.csv'];
          if (filePath.endsWith('elo_history.csv')) {
            const existing = fallbacks
              .map(name => resolve(__dirname, '../data', name))
              .find(p => fs.existsSync(p));
            if (existing) {
              return sendFile(existing);
            }
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

        // If elo_history.csv is absent, fall back to the latest backup so Vercel gets a file
        const primary = resolve(dest, 'elo_history.csv');
        if (!fs.existsSync(primary)) {
          const backup = ['elo_history_copy.csv', 'elo_history_copy1.csv']
            .map(name => resolve(source, name))
            .find(p => fs.existsSync(p));
          if (backup) {
            fs.copyFileSync(backup, primary);
          }
        }
      }
    }
  ]
})
