import { defineConfig } from 'vite';

// The build is served from /projects/bloch-sphere-simulator on mertcincinoglu.com (no trailing slash),
// so asset paths must be absolute.
export default defineConfig({
  base: '/projects/bloch-sphere-simulator/',
});
