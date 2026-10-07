// Copies the build into the portfolio site, which serves it at /projects/bloch-sphere-simulator.
// Async cp: Node 25's cpSync crashes on the non-ASCII folder name (300-🏰 Projects).
import { cp, rm } from 'node:fs/promises';

const target = '../../portfolio/site/public/projects/bloch-sphere-simulator';
await rm(target, { recursive: true, force: true });
await cp('dist', target, { recursive: true });
console.log(`copied dist -> ${target}`);
