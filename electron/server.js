const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const dev = process.env.NODE_ENV !== 'production';
const PORT = 8888;

const app = next({ dev, dir: projectRoot });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  }).listen(PORT, () => {
    console.log(`> Server ready on http://localhost:${PORT}`);
    if (process.send) process.send('ready');
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
