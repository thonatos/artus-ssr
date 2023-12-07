import fs from 'node:fs/promises';
import c2k from 'koa-connect';
import serve from 'koa-static';
import compression from 'koa-compress';
import Koa from 'koa';
import Router from '@koa/router';

import { createServer } from 'vite';

// Constants
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 5173;
const base = process.env.BASE || '/';

// Cached production assets
const templateHtml = isProduction
  ? await fs.readFile('./dist/client/index.html', 'utf-8')
  : '';
const ssrManifest = isProduction
  ? await fs.readFile('./dist/client/.vite/ssr-manifest.json', 'utf-8')
  : undefined;

const app = new Koa();
const router = new Router();

// Add Vite or respective production middlewares
let vite;
if (!isProduction) {
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base,
  });
  app.use(c2k(vite.middlewares));
} else {
  app.use(compression());
  app.use(serve('./public'));
  app.use(
    serve('./dist/client', {
      index: false,
      extensions: ['.js', '.css'],
    })
  );
}

router.get('/', async (ctx) => {
  try {
    const url = ctx.originalUrl.replace(base, '');

    let template;
    let render;
    if (!isProduction) {
      // Always read fresh template in development
      template = await fs.readFile('./index.html', 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule('/src/entry-server.ts')).render;
    } else {
      template = templateHtml;
      render = (await import('./dist/server/entry-server.js')).render;
    }

    const rendered = await render(url, ssrManifest, {
      msg: 'vite & vue',
    });

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? '')
      .replace(`<!--app-html-->`, rendered.html ?? '');

    ctx.type = 'text/html; charset=utf-8';
    ctx.state = 200;
    ctx.body = html;
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    ctx.state = 500;
    ctx.body = e.stack;
  }
});

// Serve HTML
app.use(router.routes());

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
