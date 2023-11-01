import * as THREE from "../node_modules/three/build/three.module.js";

import {
    Float
} from "./float.js";

import {
    Complex
} from "./complex.js";


class BlochSphereState {
    constructor(theta, phi) {
        this.update(theta, phi);
    }

    load() {
        this.alpha = Float.round(Math.cos(THREE.MathUtils.degToRad(this.theta) / 2));
        this.beta = new Complex(
            Float.round(Math.cos(THREE.MathUtils.degToRad(this.phi)) * Math.sin(THREE.MathUtils.degToRad(this.theta) / 2)),
            Float.round(Math.sin(THREE.MathUtils.degToRad(this.phi)) * Math.sin(THREE.MathUtils.degToRad(this.theta) / 2))
        );

        this.x = Float.round(Math.sin(THREE.MathUtils.degToRad(this.theta)) * Math.cos(THREE.MathUtils.degToRad(this.phi)));
        this.y = Float.round(Math.sin(THREE.MathUtils.degToRad(this.theta)) * Math.sin(THREE.MathUtils.degToRad(this.phi)));
        this.z = Float.round(Math.cos(THREE.MathUtils.degToRad(this.theta)));
    }

    update(theta, phi) {
        this.theta = Float.round(theta);
        this.phi = Float.round(phi);
        this.load();
    }
}

export {
    BlochSphereState
}