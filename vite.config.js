import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

// Junta as seções: <!-- @include sections/hero.html --> (recursivo, relativo a src/)
const include = (html, base) =>
  html.replace(/<!--\s*@include\s+(\S+)\s*-->/g, (_, file) => {
    const path = resolve(base, file);
    return include(readFileSync(path, 'utf8'), dirname(path));
  });

// Links reais do negócio. TROCAR aqui se o pedido online mudar de endereço.
const SITE = {
  ORDER: 'https://online.skytab.com/2e8ba4e4d45c67aa16118f69b3cb8850',
  MAP_EMBED: 'https://www.google.com/maps?q=Marao+Burgers,+61+Hollis+St,+Framingham,+MA+01702&z=16&hl=en&output=embed',
  MAPS: 'https://www.google.com/maps/search/?api=1&query=Marao+Burgers+61+Hollis+St+Framingham+MA+01702',
  INSTAGRAM: 'https://www.instagram.com/maraoburgers/',
  EMAIL: 'maraoburgerf@gmail.com',
};
const fill = (html) => html.replace(/\{\{(\w+)\}\}/g, (m, k) => SITE[k] ?? m);

export default defineConfig({
  plugins: [
    {
      name: 'html-include',
      transformIndexHtml: { order: 'pre', handler: (html) => fill(include(html, resolve(import.meta.dirname, 'src'))) },
      handleHotUpdate({ file, server }) {
        if (file.endsWith('.html')) server.ws.send({ type: 'full-reload' });
      },
    },
  ],
  server: { port: 4174 },
});
