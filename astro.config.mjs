import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://studio.de',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  // Hinweis: KEINE Astro-Redirects für die Demos.
  // Astro würde sonst beim Build Meta-Refresh-Stubs nach
  // dist/demos/<demo>/index.html schreiben und damit die statischen
  // Demo-HTMLs aus public/ überschreiben (Endlosschleife auf Netlify).
  // Netlify serviert /demos/<demo>/ → index.html automatisch.
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  vite: {
    ssr: {
      noExternal: ['gsap', 'lenis', 'splitting'],
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
