import * as THREE from "./node_modules/three/build/three.module.js";

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
        {
            this.update(theta, phi);
            return;
        }
            
        _instance = this;
    }

    static getInstance() {
        if (_instance)
            return _instance;
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

        this.prob0 = Float.round(this.alpha**2);
        this.prob1 = Float.round(1 - this.prob0);
        //  TODO: PROB1 için a+ib a^2 + b^2 yap
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