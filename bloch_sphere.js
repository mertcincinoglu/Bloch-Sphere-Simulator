import * as THREE from "./node_modules/three/build/three.module.js";

import {
    BaseGroup
} from "./bases.js";

import {
    Sphere
} from "./basic_shapes.js";

import {
    CartesianAxes, Parallel, StatePointer
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
import { MathUtils } from "three";


class BlochSphere extends BaseGroup {
    constructor(radius, properties) {
        if (!properties) properties = {};

        if (!properties.theta) properties.theta = 0;
        if (!properties.phi) properties.phi = 0;

        if (!properties.color) properties.color = new THREE.Color(0xFFFFFF);
        if (!properties.opacity) properties.opacity = 0.8;

        if (!properties.axesLength) properties.axesLength = radius + (radius * 0.1);
        if (!properties.axesWidth) properties.axesWidth = 1;

        super(properties);

        // Create Sphere
        this.sphere = new Sphere(this.getSphereRadius(), {
            color: properties.color,
            opacity: properties.opacity,
            skeleton: true,
            skeletonColor: new THREE.Color(0x808080)
        });

        // Add Sphere to BaseGroup
        this.add(this.sphere);

        // Create CartesianAxes
        this.cartesianAxes = new CartesianAxes(this.getSphereRadius() + (this.getSphereRadius() * 0.15), properties.axesWidth);

        // Add CartesianAxes to BaseGroup
        this.add(this.cartesianAxes);

        // Create StatePointer
         this.statePointer = new StatePointer(this.getSphereRadius(), 3, {
            color: new THREE.Color(0xFFFFFF),
            position: new THREE.Vector3(0, this.getSphereRadius() / 2, 0)
        });

        // Add StatePointer to BaseGroup
        this.add(this.statePointer);

        // Create BlochSphereState
        this.blochSphereState = new BlochSphereState(this.statePointer.theta(), this.statePointer.phi());

        // // update blochsphere state
        this.updateBlochSphereState(CartesianAxes.YAxis, THREE.MathUtils.degToRad(0));
        this.updateBlochSphereState(CartesianAxes.ZAxis, THREE.MathUtils.degToRad(90));

        this.parallel = new Parallel(0, {
            color: new THREE.Color(0xFFFF00),
        });

        this.add(this.parallel);

        this.parallel.position.copy(new THREE.Vector3(0, this.getSphereRadius(), 0));
        this.parallel.rotateX(THREE.MathUtils.degToRad(90));

        // Adding Meridian
        let geometrym = new THREE.TorusGeometry( this.getSphereRadius(), 1, 16, 64 ).translate(0,0,0);
        let materialm = new THREE.MeshBasicMaterial( { color: 0xcea2fd } );
        this.meridian = new THREE.Mesh( geometrym, materialm );
        this.add( this.meridian );
    }

    updateBlochSphereState(axis, angle) {
        this.statePointer.rotate(axis, new THREE.Vector3(), angle);

        this.blochSphereState.update(this.statePointer.theta(), this.statePointer.phi());
        ToolboxEventsNamespace.valuesOnChange();
    }

    getSphereRadius(){
        // get canvas
        let canvas = document.getElementById("bloch-sphere");
        let canvasWidth = canvas.offsetWidth;
        let canvasHeight = canvas.offsetHeight;

        // set diameter to 80% of canvas size
        let diameter = (Math.min(canvasWidth, canvasHeight) / 100) * 80;

        return diameter / 2;
    }

    reset(polar, azimuth) {
        this.remove(this.statePointer);

        var radius = this.getSphereRadius();

        this.statePointer = new StatePointer(radius, 3, {
            color: new THREE.Color(0xFFFFFF),
            position: new THREE.Vector3(0, radius / 2, 0)
        });

        // Add StatePointer to BaseGroup
        this.add(this.statePointer);

        // Create BlochSphereState
        this.updateBlochSphereState(CartesianAxes.YAxis, THREE.MathUtils.degToRad(polar));
        this.updateBlochSphereState(CartesianAxes.ZAxis, THREE.MathUtils.degToRad(azimuth));
    }

    resetPtheta(theta) {
        this.remove(this.parallel);

        let radius = this.getSphereRadius();

        // Hesapla: Başlangıçta 90 derecede başlayıp, ardından 0 dereceye inip tekrar -90 dereceye inip tekrar 90 dereceye dönmesi
        let adjustedTheta = ((theta - 90 ) % 360);
    
        let x = Math.abs(Math.sin(MathUtils.degToRad(adjustedTheta)) * radius);
        let scaledRadius = radius * Math.abs(Math.cos(MathUtils.degToRad(adjustedTheta)));
        let direction = 1;
        if (0 <= theta % 360 && theta % 360 <= 90)
            direction = 1;
        else if (90 <= theta % 360 && theta % 360 <= 180)
            direction = -1;
        else if (180 <= theta % 360 && theta % 360 <= 270)
            direction = -1;
        else if (270 <= theta % 360 && theta % 360 <= 360)
            direction = 1;

        //this.parallel.scale.set(scaledRadius, scaledRadius, this.parallel.scale.z);
        this.createPtheta(x, scaledRadius, direction);
    }

    createPtheta(radius, scaledRadius, direction) {
        // let geometryp = new THREE.TorusGeometry(scaledRadius, 1, 16, 64).translate(0, 0, 0);
        let geometryp = new THREE.TorusGeometry(scaledRadius, 1, 16, 64);
        let materialp = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        this.parallel = new THREE.Mesh(geometryp, materialp);
        this.add(this.parallel);
        this.parallel.rotateX(MathUtils.degToRad(90));
        this.parallel.translateZ(-radius * direction);
    }

    resetPphi(phi) {
        this.remove(this.meridian);

        let radius = this.getSphereRadius();

        // Adding Meridian
        let geometrym = new THREE.TorusGeometry( radius, 1, 16, 64 ).translate(0,0,0).rotateY(MathUtils.degToRad(90));
        let materialm = new THREE.MeshBasicMaterial( { color: 0xcea2fd } );
        this.meridian = new THREE.Mesh( geometrym, materialm ); 
        this.add( this.meridian );
        this.meridian.rotateY(MathUtils.degToRad(phi));
    }
}

export {
    BlochSphere
};