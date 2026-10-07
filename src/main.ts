// Setup check only: proves three.js, jQuery and KaTeX bundle and run. Replaced by the real simulator.
import $ from 'jquery';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#scene')!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(3, 2, 3);
const controls = new OrbitControls(camera, canvas);

scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshBasicMaterial({ wireframe: true, color: 0x888888 })));
scene.add(new THREE.AxesHelper(1.4));

function resize() {
  const { clientWidth: w, clientHeight: h } = canvas;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

$('#status').text(`three.js r${THREE.REVISION} · jQuery ${$.fn.jquery}`);
katex.render(String.raw`|\psi\rangle = \cos\tfrac{\theta}{2}|0\rangle + e^{i\varphi}\sin\tfrac{\theta}{2}|1\rangle`, $('#formula')[0], { displayMode: true });
