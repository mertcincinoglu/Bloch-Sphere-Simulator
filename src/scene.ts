// The Bloch sphere drawn the way the Stitch design draws it: a flat parchment disc with a double
// rim, dotted rings, coloured positive axes with arrowheads, dashed negative axes, the state
// arrow with its shadow on the equator. Orthographic camera, as in the design.
// Bloch coordinates (x toward the viewer, y right, z up) map to three.js as (x, y, z) -> (y, z, x).
import * as THREE from 'three';
import { toAngles } from './bloch';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

const toThree = (v: THREE.Vector3) => new THREE.Vector3(v.y, v.z, v.x);
const B = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const C = {
  paper: 0xfdfaf3, rim: 0x8a7269, rim2: 0xdec0b6, ring: 0xdec0b6,
  // the state arrow is ink, not the Z-axis teal, so it never reads as "the Z component"
  x: 0x9f3c0d, y: 0x785600, z: 0x006972, state: 0x1f1b17, trail: 0x9f3c0d, shadow: 0x57423a, pivot: 0x1f1b17,
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
  private arrowMat = new THREE.MeshBasicMaterial({ color: C.state, transparent: true });
  private tip = new THREE.Vector3(0, 0, 1);
  private arrowLine = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1, 12), this.arrowMat);
  private arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 20), this.arrowMat);
  private psi: CSS2DObject;
  private shadowA: THREE.Line;
  private shadowB: THREE.Line;
  private trail: THREE.Line;
  private observer = new ResizeObserver(() => this.resize());
  // lab-only drawing aids (hands-on audit 2026-10-09: QuVis guides, Qubit Evolution trail, IQM axis, Attila preview)
  private guides: boolean;
  private history: THREE.Vector3[] = [];
  private historyLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true }));
  private turnLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: C.x, dashSize: 0.04, gapSize: 0.03 }));
  private turnLabel: CSS2DObject;
  private previewLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: C.shadow, dashSize: 0.03, gapSize: 0.04, transparent: true, opacity: 0.6 }));
  private previewDot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), new THREE.MeshBasicMaterial({ color: C.x, transparent: true, opacity: 0.55, depthTest: false }));
  private latitude = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: C.y, dashSize: 0.02, gapSize: 0.03, transparent: true, opacity: 0.7 }));
  private meridian = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: C.z, dashSize: 0.02, gapSize: 0.03, transparent: true, opacity: 0.7 }));
  private thetaArc = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: C.x }));
  private phiArc = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: C.z }));
  private thetaLabel: CSS2DObject;
  private phiLabel: CSS2DObject;

  constructor(host: HTMLElement, opts: { guides?: boolean } = {}) {
    this.host = host;
    this.guides = opts.guides ?? false;
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
    // a finger moving up or down scrolls the page; sideways it turns the sphere
    this.labels.domElement.style.touchAction = 'pan-y';
    host.addEventListener('keydown', (e) => this.key(e));

    this.build();
    this.psi = this.label('|ψ⟩', B(0, 0, 0), hex(C.state));
    this.shadowA = this.dashedLine(C.shadow, 0.3);
    this.shadowB = this.dashedLine(C.shadow, 0.25);
    this.trail = this.dashedLine(C.trail, 1);
    this.turnLabel = this.label('', B(0, 0, 0), hex(C.x), 'turn');
    this.thetaLabel = this.label('θ', B(0, 0, 0), hex(C.x), 'guide');
    this.phiLabel = this.label('φ', B(0, 0, 0), hex(C.z), 'guide');
    this.previewDot.renderOrder = 2;
    this.scene.add(this.historyLine, this.turnLine, this.previewLine, this.previewDot, this.latitude, this.meridian, this.thetaArc, this.phiArc);
    this.showTurn(null);
    this.preview(null, null);
    for (const o of [this.latitude, this.meridian, this.thetaArc, this.phiArc, this.thetaLabel, this.phiLabel]) o.visible = false;

    this.observer.observe(host);
    this.resize();
    this.renderer.setAnimationLoop(() => {
      this.controls.update();
      this.billboard.quaternion.copy(this.camera.quaternion);
      // depth cue: an arrow pointing into the far hemisphere is drawn fainter
      const away = this.tip.dot(this.camera.position) < -0.05;
      this.arrowMat.opacity = away ? 0.45 : 1;
      (this.psi.element as HTMLElement).style.opacity = away ? '0.55' : '1';
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
    this.label(text, dir.clone().multiplyScalar(length + 0.14), '#57423a', 'neg'); // 10 px text needs the darker ink for contrast
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
    this.tip.copy(t);
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
      // |ψ⟩ sits beside the tip, off the axis line, so it never covers an axis label
      const side = new THREE.Vector3().crossVectors(dir, this.camera.position).normalize().multiplyScalar(0.12);
      this.psi.position.copy(dir.clone().multiplyScalar(len * 0.82).add(side));
    }
    // shadow on the equator, then up to the tip
    const foot = toThree(B(v.x, v.y, 0));
    this.setLine(this.shadowA, [new THREE.Vector3(), foot]);
    this.setLine(this.shadowB, [foot, t]);
    if (this.guides) this.drawGuides(v);
  }

  /** Latitude circle and meridian through the tip, and small θ and φ arcs at the centre (QuVis). */
  private drawGuides(v: THREE.Vector3) {
    const r = v.length();
    const on = r > 0.05;
    for (const o of [this.latitude, this.meridian, this.thetaArc, this.thetaLabel]) o.visible = on;
    if (!on) { this.phiArc.visible = this.phiLabel.visible = false; return; }
    const d = v.clone().normalize();
    const { theta, phi } = toAngles(d);
    const s = Math.sin(theta), z = Math.cos(theta);
    const N = 96;
    this.setLine(this.latitude, Array.from({ length: N + 1 }, (_, i) => toThree(B(s * Math.cos((i / N) * 2 * Math.PI), s * Math.sin((i / N) * 2 * Math.PI), z))));
    this.setLine(this.meridian, Array.from({ length: N + 1 }, (_, i) => {
      const a = (i / N) * 2 * Math.PI;
      return toThree(B(Math.sin(a) * Math.cos(phi), Math.sin(a) * Math.sin(phi), Math.cos(a)));
    }));
    const k = 0.32;
    this.setLine(this.thetaArc, Array.from({ length: 33 }, (_, i) => {
      const a = (i / 32) * theta;
      return toThree(B(k * Math.sin(a) * Math.cos(phi), k * Math.sin(a) * Math.sin(phi), k * Math.cos(a)));
    }));
    this.thetaLabel.position.copy(toThree(B(0.42 * Math.sin(theta / 2) * Math.cos(phi), 0.42 * Math.sin(theta / 2) * Math.sin(phi), 0.42 * Math.cos(theta / 2))));
    const hasPhi = s > 0.05 && phi > 0.02;
    this.phiArc.visible = this.phiLabel.visible = hasPhi;
    if (hasPhi) {
      this.setLine(this.phiArc, Array.from({ length: 33 }, (_, i) => toThree(B(k * Math.cos((i / 32) * phi), k * Math.sin((i / 32) * phi), 0))));
      this.phiLabel.position.copy(toThree(B(0.44 * Math.cos(phi / 2), 0.44 * Math.sin(phi / 2), 0)));
    }
  }

  /** Every position the arrow has passed, fading with age (Qubit Evolution, kherb). */
  addHistory(points: THREE.Vector3[]) {
    this.history.push(...points);
    if (this.history.length > 3000) this.history.splice(0, this.history.length - 3000);
    const n = this.history.length;
    const ink = new THREE.Color(C.trail), paper = new THREE.Color(C.paper);
    const colors = new Float32Array(n * 3);
    this.history.forEach((_, i) => {
      const c = paper.clone().lerp(ink, 0.15 + 0.85 * ((i + 1) / n) ** 1.5); // old = faint, new = strong
      colors.set([c.r, c.g, c.b], i * 3);
    });
    this.historyLine.geometry.dispose();
    this.historyLine.geometry = new THREE.BufferGeometry().setFromPoints(this.history.map(toThree));
    this.historyLine.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  clearHistory() {
    this.history = [];
    this.historyLine.geometry.dispose();
    this.historyLine.geometry = new THREE.BufferGeometry();
  }

  /** The axis a gate turns about, drawn while it turns, with its angle (IQM, justQ). */
  showTurn(axis: THREE.Vector3 | null, text = '') {
    this.turnLine.visible = this.turnLabel.visible = !!axis;
    if (!axis) return;
    const n = axis.clone().normalize();
    this.setLine(this.turnLine, [toThree(n.clone().multiplyScalar(-1.35)), toThree(n.clone().multiplyScalar(1.35))]);
    this.turnLabel.position.copy(toThree(n.clone().multiplyScalar(1.5)));
    (this.turnLabel.element as HTMLElement).textContent = text;
  }

  /** Before a gate is applied: its axis and where the arrow would land (Attila Kun, Andrzejewski). */
  preview(axis: THREE.Vector3 | null, target: THREE.Vector3 | null) {
    this.previewLine.visible = !!axis;
    this.previewDot.visible = !!target;
    if (axis) {
      const n = axis.clone().normalize();
      this.setLine(this.previewLine, [toThree(n.clone().multiplyScalar(-1.3)), toThree(n.clone().multiplyScalar(1.3))]);
    }
    if (target) this.previewDot.position.copy(toThree(target));
  }

  setTrail(points: THREE.Vector3[]) {
    this.setLine(this.trail, points.map(toThree));
  }

  private setLine(line: THREE.Line, pts: THREE.Vector3[]) {
    line.geometry.dispose();
    line.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    line.computeLineDistances();
  }

  /** Arrow keys turn the view: left/right around the vertical, up/down over the top. */
  private key(e: KeyboardEvent) {
    const step = Math.PI / 24;
    const pos = this.camera.position;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), e.key === 'ArrowLeft' ? -step : step);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const right = new THREE.Vector3().crossVectors(this.camera.up, pos).normalize();
      const next = pos.clone().applyAxisAngle(right, e.key === 'ArrowUp' ? -step : step);
      if (Math.abs(next.clone().normalize().y) < 0.97) pos.copy(next); // stop short of the poles
    } else return;
    e.preventDefault();
    this.camera.lookAt(0, 0, 0);
    this.controls.update();
  }

  /** Free the WebGL context; used when a story chapter is swapped out. */
  dispose() {
    this.renderer.setAnimationLoop(null);
    this.observer.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss(); // dispose() alone keeps the context alive until GC; browsers cap live contexts (~16)
    this.renderer.domElement.remove();
    this.labels.domElement.remove();
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
