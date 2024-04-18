import * as THREE from "../node_modules/three/build/three.module.js";

import {
    Float
} from "./float.js";

import {
    Complex
} from "./complex.js";
import { GlobalContext } from "./context.js";

let _instance = null;

class BlochSphereState {
    constructor(theta, phi) {
        if (_instance)
            return;
            
        _instance = this;
        this.update(theta, phi);
    }

    static getInstance() {
        if (_instance)
            return _instance;
    }

    load() {
        // TODO: Theta ve phi yi buraya ekle 
        // this.theta = GlobalContext.
        // GlobalContext.blochSphereStateProperties.theta = this.statePointer.theta();
        // GlobalContext.blochSphereStateProperties.phi = this.statePointer.phi();

        this.alpha = Float.round(Math.cos(THREE.MathUtils.degToRad(this.theta) / 2));
        this.beta = new Complex(
            Float.round(Math.cos(THREE.MathUtils.degToRad(this.phi)) * Math.sin(THREE.MathUtils.degToRad(this.theta) / 2)),
            Float.round(Math.sin(THREE.MathUtils.degToRad(this.phi)) * Math.sin(THREE.MathUtils.degToRad(this.theta) / 2))
        );

        this.x = Float.round(Math.sin(THREE.MathUtils.degToRad(this.theta)) * Math.cos(THREE.MathUtils.degToRad(this.phi)));
        this.y = Float.round(Math.sin(THREE.MathUtils.degToRad(this.theta)) * Math.sin(THREE.MathUtils.degToRad(this.phi)));
        this.z = Float.round(Math.cos(THREE.MathUtils.degToRad(this.theta)));

        this.prob0 = Float.round(Math.pow(this.alpha, 2));
        this.prob1 = Float.round(1 - this.alpha);
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