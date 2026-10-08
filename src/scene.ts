// The Bloch sphere drawn the way the Stitch design draws it: a flat parchment disc with a double
// rim, dotted rings, coloured positive axes with arrowheads, dashed negative axes, the state
// arrow with its shadow on the equator. Orthographic camera, as in the design.
// Bloch coordinates (x toward the viewer, y right, z up) map to three.js as (x, y, z) -> (y, z, x).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

const toThree = (v: THREE.Vector3) => new THREE.Vector3(v.y, v.z, v.x);
const B = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const C = {
  paper: 0xfdfaf3, rim: 0x8a7269, rim2: 0xdec0b6, ring: 0xdec0b6,
  x: 0x9f3c0d, y: 0x785600, z: 0x006972, state: 0x006972, trail: 0x9f3c0d, shadow: 0x57423a, pivot: 0x1f1b17,
};
const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

export class BlochScene {
  private host: HTMLElement;
  private renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  private labels = new CSS2DRenderer();
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  private controls: OrbitControls;
  private billboard = new THREE.Group(); // disc and rims always face the camera, like a drawn outline
  private arrowMat = new THREE.MeshBasicMaterial({ color: C.state });
  private arrowLine = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1, 12), this.arrowMat);
  private arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 20), this.arrowMat);
  private psi: CSS2DObject;
  private shadowA: THREE.Line;
  private shadowB: THREE.Line;
  private trail: THREE.Line;

  constructor(host: HTMLElement) {
    this.host = host;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    host.append(this.renderer.domElement);
    this.labels.domElement.className = 'labels';
    host.append(this.labels.domElement);

    // starting view: looking down about 20°, turned so the X and Y axes both read clearly
    this.camera.position.copy(toThree(B(Math.cos(0.9), Math.sin(0.9), 0.38).normalize().multiplyScalar(10)));
    this.camera.lookAt(0, 0, 0);
    this.controls = new OrbitControls(this.camera, this.labels.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.autoRotateSpeed = 1.2;
    this.controls.saveState();

    this.build();
    this.psi = this.label('|ψ⟩', B(0, 0, 0), hex(C.state));
    this.shadowA = this.dashedLine(C.shadow, 0.3);
    this.shadowB = this.dashedLine(C.shadow, 0.25);
    this.trail = this.dashedLine(C.trail, 1);

    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    this.renderer.setAnimationLoop(() => {
      this.controls.update();
      this.billboard.quaternion.copy(this.camera.quaternion);
      this.renderer.render(this.scene, this.camera);
      this.labels.render(this.scene, this.camera);
    });
  }

  private dashedLine(color: number, opacity: number) {
    const line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color, dashSize: 0.035, gapSize: 0.035, transparent: opacity < 1, opacity }));
    this.scene.add(line);
    return line;
  }

  private label(text: string, at: THREE.Vector3, color: string, cls = '') {
    const el = document.createElement('span');
    el.className = `axis-label ${cls}`;
    el.style.color = color;
    el.textContent = text;
    const obj = new CSS2DObject(el);
    obj.position.copy(toThree(at));
    this.scene.add(obj);
    return obj;
  }

  private line(points: THREE.Vector3[], color: number, dashed: boolean, parent: THREE.Object3D = this.scene) {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.025, gapSize: 0.04 }) : new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geo, mat);
    if (dashed) line.computeLineDistances();
    parent.add(line);
  }

  private circle(r: number, plane: (a: number) => THREE.Vector3) {
    return Array.from({ length: 129 }, (_, i) => plane((i / 128) * Math.PI * 2).multiplyScalar(r));
  }

  private axis(dir: THREE.Vector3, length: number, color: number, text: string) {
    const tip = toThree(dir.clone().multiplyScalar(length));
    this.line([new THREE.Vector3(), tip], color, false);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 16), new THREE.MeshBasicMaterial({ color }));
    head.position.copy(tip);
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tip.clone().normalize());
    this.scene.add(head);
    this.label(text, dir.clone().multiplyScalar(length + 0.16), hex(color));
  }

  private negAxis(dir: THREE.Vector3, length: number, text: string) {
    this.line([new THREE.Vector3(), toThree(dir.clone().multiplyScalar(length))], C.ring, true);
    this.label(text, dir.clone().multiplyScalar(length + 0.14), hex(C.rim), 'neg');
  }

  private build() {
    // silhouette: parchment disc, rim and a thin second rim, drawn first and never hiding anything
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 96), new THREE.MeshBasicMaterial({ color: C.paper, depthWrite: false, depthTest: false }));
    disc.renderOrder = -1;
    this.billboard.add(disc);
    this.line(this.circle(1, (a) => new THREE.Vector3(Math.cos(a), Math.sin(a), 0)), C.rim, false, this.billboard);
    this.line(this.circle(1.035, (a) => new THREE.Vector3(Math.cos(a), Math.sin(a), 0)), C.rim2, false, this.billboard);
    this.scene.add(this.billboard);

    // dotted equator and two meridians (Bloch xy, xz and yz planes)
    this.line(this.circle(1, (a) => toThree(B(Math.cos(a), Math.sin(a), 0))), C.ring, true);
    this.line(this.circle(1, (a) => toThree(B(Math.cos(a), 0, Math.sin(a)))), C.ring, true);
    this.line(this.circle(1, (a) => toThree(B(0, Math.cos(a), Math.sin(a)))), C.ring, true);

    this.axis(B(1, 0, 0), 1.25, C.x, '+X (|+⟩)');
    this.axis(B(0, 1, 0), 1.25, C.y, '+Y (|i⟩)');
    this.axis(B(0, 0, 1), 1.28, C.z, '+Z (|0⟩)');
    this.negAxis(B(-1, 0, 0), 1.1, '−X (|−⟩)');
    this.negAxis(B(0, -1, 0), 1.1, '−Y (|−i⟩)');
    this.negAxis(B(0, 0, -1), 1.15, '−Z (|1⟩)');

    this.scene.add(this.arrowLine, this.arrowHead);
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), new THREE.MeshBasicMaterial({ color: C.pivot })));
  }

  setVector(v: THREE.Vector3) {
    const t = toThree(v);
    const len = t.length();
    const visible = len > 0.02;
    this.arrowLine.visible = this.arrowHead.visible = this.psi.visible = visible;
    if (visible) {
      const dir = t.clone().normalize();
      const shaft = Math.max(len - 0.12, 0.001);
      this.arrowLine.scale.set(1, shaft, 1);
      this.arrowLine.position.copy(dir.clone().multiplyScalar(shaft / 2));
      this.arrowLine.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      this.arrowHead.position.copy(dir.clone().multiplyScalar(len - 0.07));
      this.arrowHead.quaternion.copy(this.arrowLine.quaternion);
      this.psi.position.copy(dir.clone().multiplyScalar(len + 0.16));
    }
    // shadow on the equator, then up to the tip
    const foot = toThree(B(v.x, v.y, 0));
    this.setLine(this.shadowA, [new THREE.Vector3(), foot]);
    this.setLine(this.shadowB, [foot, t]);
  }

  setTrail(points: THREE.Vector3[]) {
    this.setLine(this.trail, points.map(toThree));
  }

  private setLine(line: THREE.Line, pts: THREE.Vector3[]) {
    line.geometry.dispose();
    line.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    line.computeLineDistances();
  }

  setAutoRotate(on: boolean) {
    this.controls.autoRotate = on;
  }

  resetView() {
    this.controls.reset();
  }

  private resize() {
    const { clientWidth: w, clientHeight: h } = this.host;
    if (!w || !h) return;
    // sphere radius = 36% of the shorter side, as in the design
    const k = Math.min(w, h) * 0.36;
    Object.assign(this.camera, { left: -w / (2 * k), right: w / (2 * k), top: h / (2 * k), bottom: -h / (2 * k) });
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labels.setSize(w, h);
  }
}
