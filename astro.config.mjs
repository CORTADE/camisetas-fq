import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://camisetas-fq.netlify.app',
  trailingSlash: 'never',
  build: { format: 'file' },
});
