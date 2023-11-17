import * as THREE from "../node_modules/three/build/three.module.js";

import {
    BaseGroup
} from "./bases.js";

import {
    Sphere
} from "./basic_shapes.js";

import {
    CartesianAxes, StatePointer
} from "./composite_shapes.js";

import {
    BlochSphereState
} from "./bloch_sphere_state.js";

import {
    ToolboxEventsNamespace 
} from "./tools.js";

import {
    GlobalContext 
} from "./context.js";


class BlochSphere extends BaseGroup {
    constructor(radius, properties) {
        if (!properties) properties = {};

        if (!properties.theta) properties.theta = "0.0000";
        if (!properties.phi) properties.phi = "0.0000";

        if (!properties.color) properties.color = new THREE.Color(0xFFFFFF);
        if (!properties.opacity) properties.opacity = 0.8;

        if (!properties.axesLength) properties.axesLength = radius + (radius * 0.1);
        if (!properties.axesWidth) properties.axesWidth = 1;

        super(properties);

        // Create Sphere
        this.sphere = new Sphere(radius, {
            color: properties.color,
            opacity: properties.opacity,
            skeleton: true,
            skeletonColor: new THREE.Color(0x808080)
        });

        // Add Sphere to BaseGroup
        this.add(this.sphere);

        // Create CartesianAxes
        this.cartesianAxes = new CartesianAxes(properties.axesLength, properties.axesWidth);

        // Add CartesianAxes to BaseGroup
        this.add(this.cartesianAxes);

        this.createSP(radius, properties.theta, properties.phi, 60, 30);

        /*
        // Adding Meridian
        const geometry = new THREE.TorusGeometry( radius - 40, 1, 16, 64 ).translate(0,0,200); 
        const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
        this.torus = new THREE.Mesh( geometry, material ); 
        this.add( this.torus );
        */
    }

    updateBlochSphereState(axis, angle) {
        this.statePointer.rotate(axis, new THREE.Vector3(), angle);
        
        // Update BlochSphereState
        this.blochSphereState.update(this.statePointer.theta(), this.statePointer.phi());
    }

    reset(thetaAngle, phiAngle) {
        this.remove(this.statePointer);

        // get canvas
        let canvas = document.getElementById("bloch-sphere");
        let canvasWidth = canvas.offsetWidth;
        let canvasHeight = canvas.offsetHeight;

        // set diameter to 80% of canvas size
        let diameter = (Math.min(canvasWidth, canvasHeight) / 100) * 80;
        let radius = diameter / 2;

        let thetaStart = 0;
        let phiStart = 0;
        let theta = thetaAngle;
        let phi = phiAngle;

        this.createSP(radius, thetaStart, phiStart, theta, phi);
    }
    
    createSP(radius, thetaStart, phiStart, theta, phi) {
        // Create StatePointer
        this.statePointer = new StatePointer(radius, 3, {
            color: new THREE.Color(0xFFFFFF),
            position: new THREE.Vector3(0, radius / 2, 0)
        });

        // Add StatePointer to BaseGroup
        this.add(this.statePointer);

        // Create BlochSphereState
        this.blochSphereState = new BlochSphereState(this.statePointer.theta(), this.statePointer.phi());

        // Set StatePointer
        this.updateBlochSphereState(CartesianAxes.YAxis, THREE.MathUtils.degToRad(thetaStart));
        this.updateBlochSphereState(CartesianAxes.ZAxis, THREE.MathUtils.degToRad(phiStart));

        // update blochsphere state
        this.updateBlochSphereState(CartesianAxes.YAxis, THREE.MathUtils.degToRad(theta)); // 0 - 180 derece arası değerler
        this.updateBlochSphereState(CartesianAxes.ZAxis, THREE.MathUtils.degToRad(phi)); // 0 - 360 derece arası değerler
    }
}

export {
    BlochSphere
};