import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

import templateHtml from '../dist/client/index.html';
import ssrManifest from '../dist/client/.vite/ssr-manifest.json';
import { render } from '../dist/server/entry-server.js';

import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const { pathname } = new URL(request.url);

    // ssr entry
    if (pathname === '/') {
      const rendered = await render(pathname, ssrManifest, {
        msg: 'vite ssr with vue',
      });

      const template = templateHtml;
      const html = template
        .replace(`<!--app-head-->`, rendered.head ?? '')
        .replace(`<!--app-html-->`, rendered.html ?? '');

      return new Response(html, {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      });
    }

    // client assets
    try {
      // Add logic to decide whether to serve an asset or run your original Worker code
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        }
      );
    } catch (e) {
      return new Response('Not Found.', {
        status: 404,
      });
    }
  },
};
