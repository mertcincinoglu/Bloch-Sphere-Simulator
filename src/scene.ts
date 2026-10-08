// The 3D Bloch sphere. Bloch coordinates (x toward the viewer, y right, z up) map to
// three.js as (x, y, z) -> (y, z, x), a pure rotation, so handedness is kept.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

const toThree = (v: THREE.Vector3) => new THREE.Vector3(v.y, v.z, v.x);

export class BlochScene {
  private renderer: THREE.WebGLRenderer;
  private labels = new CSS2DRenderer();
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  private controls: OrbitControls;
  private lineMats: THREE.LineBasicMaterial[] = [];
  private axisMats: THREE.LineBasicMaterial[] = [];
  private shell = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.07, depthWrite: false });
  private arrowMat = new THREE.MeshBasicMaterial();
  private arrowLine = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 12), this.arrowMat);
  private arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 20), this.arrowMat);
  private trailMat = new THREE.LineDashedMaterial({ dashSize: 0.05, gapSize: 0.035 });
  private trail = new THREE.Line(new THREE.BufferGeometry(), this.trailMat);

  private host: HTMLElement;

  constructor(host: HTMLElement) {
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    host.append(this.renderer.domElement);
    this.labels.domElement.className = 'labels';
    host.append(this.labels.domElement);

    this.camera.position.set(2.6, 2.0, 5.3); // far enough that the axis labels stay inside the canvas
    this.controls = new OrbitControls(this.camera, this.labels.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 4.5;
    this.controls.maxDistance = 8;

    this.buildSphere();
    this.scene.add(this.arrowLine, this.arrowHead, this.trail);

    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    this.renderer.setAnimationLoop(() => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.labels.render(this.scene, this.camera);
    });
  }

  private circle(normal: THREE.Vector3) {
    const pts = Array.from({ length: 129 }, (_, i) => {
      const a = (i / 128) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
    });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial());
    line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    this.lineMats.push(line.material as THREE.LineBasicMaterial);
    return line;
  }

  private label(text: string, at: THREE.Vector3) {
    const el = document.createElement('span');
    el.className = 'axis-label';
    el.textContent = text;
    const obj = new CSS2DObject(el);
    obj.position.copy(toThree(at));
    return obj;
  }

  private buildSphere() {
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), this.shell));
    // equator and two meridians, in Bloch terms: the xy, xz and yz planes
    this.scene.add(this.circle(toThree(new THREE.Vector3(0, 0, 1))), this.circle(toThree(new THREE.Vector3(0, 1, 0))), this.circle(toThree(new THREE.Vector3(1, 0, 0))));
    for (const axis of [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)]) {
      const mat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55 });
      this.axisMats.push(mat);
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([toThree(axis.clone().multiplyScalar(-1.25)), toThree(axis.clone().multiplyScalar(1.25))]), mat));
    }
    const L = 1.42;
    this.scene.add(
      this.label('|0⟩', new THREE.Vector3(0, 0, L)), this.label('|1⟩', new THREE.Vector3(0, 0, -L)),
      this.label('|+⟩', new THREE.Vector3(L, 0, 0)), this.label('|−⟩', new THREE.Vector3(-L, 0, 0)),
      this.label('|+i⟩', new THREE.Vector3(0, L, 0)), this.label('|−i⟩', new THREE.Vector3(0, -L, 0)),
    );
  }

  /** Read colours from the page's CSS variables, so each theme draws its own sphere. */
  setColors() {
    const css = getComputedStyle(document.documentElement);
    const c = (name: string) => new THREE.Color(css.getPropertyValue(name).trim());
    for (const m of this.lineMats) m.color = c('--sphere');
    for (const m of this.axisMats) m.color = c('--axis');
    this.shell.color = c('--shell');
    this.arrowMat.color = c('--arrow');
    this.trailMat.color = c('--trail');
  }

  setVector(v: THREE.Vector3) {
    const t = toThree(v);
    const len = Math.max(t.length(), 1e-6);
    const dir = t.clone().normalize();
    const shaft = Math.max(len - 0.14, 0.001);
    this.arrowLine.scale.set(1, shaft, 1);
    this.arrowLine.position.copy(dir.clone().multiplyScalar(shaft / 2));
    this.arrowLine.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    this.arrowHead.position.copy(dir.clone().multiplyScalar(len - 0.08));
    this.arrowHead.quaternion.copy(this.arrowLine.quaternion);
  }

  setTrail(points: THREE.Vector3[]) {
    this.trail.geometry.dispose();
    this.trail.geometry = new THREE.BufferGeometry().setFromPoints(points.map(toThree));
    this.trail.computeLineDistances();
  }

  private resize() {
    const { clientWidth: w, clientHeight: h } = this.host;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.labels.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
