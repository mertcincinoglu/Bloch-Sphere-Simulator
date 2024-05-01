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

        // this.createSP(radius, 0, 90);

        // this.createPphi(radius, 0);
        // this.createPtheta(radius, 0, 0);

        // Create StatePointer
         this.statePointer = new StatePointer(radius, 3, {
            color: new THREE.Color(0xFFFFFF),
            position: new THREE.Vector3(0, radius / 2, 0)
        });

        // Add StatePointer to BaseGroup
        this.add(this.statePointer);

        // Create BlochSphereState
        this.blochSphereState = new BlochSphereState(this.statePointer.theta(), this.statePointer.phi());

        // // update blochsphere state
        this.updateBlochSphereState(CartesianAxes.YAxis, THREE.MathUtils.degToRad(0));
        this.updateBlochSphereState(CartesianAxes.ZAxis, THREE.MathUtils.degToRad(0));
    }

    updateBlochSphereState(axis, angle) {
        this.statePointer.rotate(axis, new THREE.Vector3(), angle);

        this.updateStates();
    }

    setBlochSphereState(polar, azimuth) {
        this.statePointer.set(polar, azimuth);

        this.updateStates();
    }

    updateStates() {
        this.blochSphereState.update(this.statePointer.theta(), this.statePointer.phi());

        GlobalContext.blochSphereStateProperties.theta = this.statePointer.theta();
        GlobalContext.blochSphereStateProperties.phi = this.statePointer.phi();

        ToolboxEventsNamespace.valuesOnChange();
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

        let theta = thetaAngle;
        let phi = phiAngle;

        this.createSP(radius, theta, phi);
    }
    
    createSP(radius, theta, phi) {
        // Create StatePointer
        this.statePointer = new StatePointer(radius, 3, {
            color: new THREE.Color(0xFFFFFF),
            position: new THREE.Vector3(0, radius / 2, 0)
        });

        // Add StatePointer to BaseGroup
        this.add(this.statePointer);

        // Create BlochSphereState
        this.blochSphereState = new BlochSphereState(this.statePointer.theta(), this.statePointer.phi());

        // update blochsphere state
        this.updateBlochSphereState(CartesianAxes.XAxis, THREE.MathUtils.degToRad(theta));
        this.updateBlochSphereState(CartesianAxes.ZAxis, THREE.MathUtils.degToRad(phi));
    }

    resetPtheta(theta) {
        this.remove(this.parallel);
    
        // get canvas
        let canvas = document.getElementById("bloch-sphere");
        let canvasWidth = canvas.offsetWidth;
        let canvasHeight = canvas.offsetHeight;
    
        // set diameter to 80% of canvas size
        let diameter = (Math.min(canvasWidth, canvasHeight) / 100) * 80;
        let radius = diameter / 2;
    
        // Hesapla: Başlangıçta 90 derecede başlayıp, ardından 0 dereceye inip tekrar -90 dereceye inip tekrar 90 dereceye dönmesi
        let adjustedTheta = theta - 90;
    
        let x = Math.pow(BlochSphereState.getInstance().x, 2);
        let y = Math.pow(BlochSphereState.getInstance().y, 2);
        let z = Math.pow(BlochSphereState.getInstance().z, 2);
        let rad = Math.sqrt(x + y + z);
        
        x /= rad;
        y /= rad;
        z /= rad;

        let normalVector = new THREE.Vector3(x, y, z);

        let horizontalPlaneNormal = new THREE.Vector3(0, 0, 1); // Assuming the z-axis is up
        let projectionVector = normalVector.projectOnPlane(horizontalPlaneNormal);

        let scaledRadius = radius * projectionVector.length();


        let direction = 1;
        if (0 <= theta & theta <= 90)
            direction = -1;
        else if (90 <= theta & theta <= 180)
            direction = -1;
        else if (180 <= theta & theta <= 270)
            direction = 1;
        else if (270 <= theta & theta <= 360)
            direction = 1;

        // console.log(verticalOffset);

        let r = Math.abs(Math.sin(MathUtils.degToRad(adjustedTheta)) * scaledRadius);
        this.createPtheta(r, scaledRadius, direction, -radius);
    }

    // resetPtheta(theta) {
    //     this.remove(this.parallel);
    
    //     // get canvas
    //     let canvas = document.getElementById("bloch-sphere");
    //     let canvasWidth = canvas.offsetWidth;
    //     let canvasHeight = canvas.offsetHeight;
    
    //     // set diameter to 80% of canvas size
    //     let diameter = (Math.min(canvasWidth, canvasHeight) / 100) * 80;
    
    //     let radius = diameter / 2;
    
    //     // Hesapla: Başlangıçta 90 derecede başlayıp, ardından 0 dereceye inip tekrar -90 dereceye inip tekrar 90 dereceye dönmesi
    //     let adjustedTheta = ((theta - 90 ) % 360);
    
    //     let x = Math.abs(Math.sin(MathUtils.degToRad(adjustedTheta)) * radius);
    //     let scaledRadius = radius * Math.abs(Math.cos(MathUtils.degToRad(adjustedTheta)));
    //     let direction = 1;
    //     if (0 <= theta % 360 & theta % 360 <= 90)
    //         direction = 1;
    //     else if (90 <= theta % 360 & theta % 360 <= 180)
    //         direction = -1;
    //     else if (180 <= theta % 360 & theta % 360 <= 270)
    //         direction = -1;
    //     else if (270 <= theta % 360 & theta % 360 <= 360)
    //         direction = 1;
    
    //     this.createPtheta(x, scaledRadius, direction);
    // }
    
    createPtheta(radius, scaledRadius, direction) {
        // let geometryp = new THREE.TorusGeometry(scaledRadius, 1, 16, 64).translate(0, 0, 0);
        let geometryp = new THREE.TorusGeometry(50, 1, 16, 64);
        let materialp = new THREE.MeshBasicMaterial({ color: 0xcea2fd });
        this.parallel = new THREE.Mesh(geometryp, materialp);
        this.add(this.parallel);
        this.parallel.rotateX(MathUtils.degToRad(90));
        this.parallel.translateZ(-radius * direction);
        // this.parallel.translateZ(-radius * direction);
    }

    resetPphi(phi) {
        this.remove(this.meridian);

        // get canvas
        let canvas = document.getElementById("bloch-sphere");
        let canvasWidth = canvas.offsetWidth;
        let canvasHeight = canvas.offsetHeight;

        // set diameter to 80% of canvas size
        let diameter = (Math.min(canvasWidth, canvasHeight) / 100) * 80;
        let radius = diameter / 2;

        this.createPphi(radius, phi);
    }

    createPphi(radius, phi) {
        // Adding Meridian
        let geometrym = new THREE.TorusGeometry( radius, 1, 16, 64 ).translate(0,0,0); 
        let materialm = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
        this.meridian = new THREE.Mesh( geometrym, materialm ); 
        this.add( this.meridian );
        this.meridian.rotateY(MathUtils.degToRad(90));
        this.meridian.rotateY(MathUtils.degToRad(phi));
    }
}

export {
    BlochSphere
};