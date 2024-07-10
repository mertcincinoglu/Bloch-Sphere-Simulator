import * as THREE from "./node_modules/three/build/three.module.js";

import {
    OrbitControls
} from "./node_modules/three/examples/jsm/controls/OrbitControls.js";

import {
    CSS2DRenderer
} from "./node_modules/three/examples/jsm/renderers/CSS2DRenderer.js";

import {
    BlochSphere
} from "./bloch_sphere.js";

import {
    ToolboxEventsNamespace
} from "./tools.js";


var GlobalContext = {
    canvas: null,

    scene: null, camera: null, light: null,
    renderer: null, labelRenderer: null, controls: null,

    blochSphere: null,

    blochSphereStateProperties: {
        polar: 0,
        azimuth: 90
    },

    init: function () {
        // get canvas
        let canvas = document.getElementById("bloch-sphere");
        let canvasWidth = canvas.offsetWidth;
        let canvasHeight = canvas.offsetHeight;

        // set diameter to 80% of canvas size
        let diameter = (Math.min(canvasWidth, canvasHeight) / 100) * 80;

        // init scene
        GlobalContext.scene = new THREE.Scene();

        // init camera
        GlobalContext.camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 0.1, diameter * 2);

        // set camera position
        GlobalContext.camera.position.set(diameter, diameter, diameter);
        GlobalContext.camera.lookAt(new THREE.Vector3(0, 0, 0));

        // add camera to scene
        GlobalContext.scene.add(GlobalContext.camera);
        
        // init light and add to scene
        GlobalContext.light = new THREE.DirectionalLight(0xFFFFFF);
        GlobalContext.camera.add(GlobalContext.light);

        // init renderer
        GlobalContext.renderer = new THREE.WebGLRenderer();
        GlobalContext.renderer.setSize(canvasWidth, canvasHeight);
        GlobalContext.renderer.setPixelRatio(window.devicePixelRatio);

        // init label renderer
        GlobalContext.labelRenderer = new CSS2DRenderer();
        GlobalContext.labelRenderer.setSize(canvasWidth, canvasHeight);
        GlobalContext.labelRenderer.domElement.style.position = 'absolute';
		GlobalContext.labelRenderer.domElement.style.top = 0;

        // append renderer to canvas
        canvas.appendChild(GlobalContext.renderer.domElement);
        canvas.appendChild(GlobalContext.labelRenderer.domElement);

        // init orbit controls
        GlobalContext.controls = new OrbitControls(GlobalContext.camera, GlobalContext.labelRenderer.domElement);
        GlobalContext.controls.minDistance = diameter / 4;
        GlobalContext.controls.maxDistance = diameter * 2;

        GlobalContext.blochSphere = new BlochSphere(diameter / 2, {
            theta: GlobalContext.blochSphereStateProperties.theta,
            phi: GlobalContext.blochSphereStateProperties.phi,
            color: new THREE.Color(0x808080),
            axesLength: (diameter / 2) + ((diameter / 2) * 0.2),
            axesWidth: 2
        });

        GlobalContext.scene.add(GlobalContext.blochSphere);

        // start all events listeners
        GlobalContext.startAllEventListeners();
    },

    onload: function () {
        GlobalContext.init();
        GlobalContext.animate();
    },

    onresize: function () {
        // get canves
        let canvas = document.getElementById("bloch-sphere");
        let canvasWidth = canvas.offsetWidth;
        let canvasHeight = canvas.offsetHeight;

        // update camera
        GlobalContext.camera.aspect = canvasWidth / canvasHeight;
        GlobalContext.camera.updateProjectionMatrix();

        // update renderer and label renderer
        GlobalContext.renderer.setSize(canvasWidth, canvasHeight);
        GlobalContext.labelRenderer.setSize(canvasWidth, canvasHeight);
    },

    startAllEventListeners: function () {
        ToolboxEventsNamespace.startToolboxEventListeners();
    },

    animate: function () {
        requestAnimationFrame(GlobalContext.animate);

        // rendering
        GlobalContext.renderer.render(GlobalContext.scene, GlobalContext.camera);
        GlobalContext.labelRenderer.render(GlobalContext.scene, GlobalContext.camera);
    }
}

export {
    GlobalContext
};