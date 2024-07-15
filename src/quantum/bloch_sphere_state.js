import * as THREE from '../libs/three/three.module.js';

import {
    Float
} from "../math/float.js";

import {
    Complex
} from "../math/complex.js";


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

        this.alpha2 = Float.round(Math.pow(this.alpha, 2));
        this.beta2 = Float.round(
            Math.pow(Math.cos(THREE.MathUtils.degToRad(this.phi)) * Math.sin(THREE.MathUtils.degToRad(this.theta) / 2), 2)
            + Math.pow(Math.sin(THREE.MathUtils.degToRad(this.phi)) * Math.sin(THREE.MathUtils.degToRad(this.theta) / 2), 2));

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
