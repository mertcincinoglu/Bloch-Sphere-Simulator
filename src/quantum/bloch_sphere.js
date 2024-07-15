import * as THREE from '../libs/three/three.module.js';

import {
    BaseGroup
} from "../geometry/bases.js";

import {
    Sphere
} from "../geometry/basic_shapes.js";

import {
    CartesianAxes, StatePointer
} from "../geometry/composite_shapes.js";

import {
    BlochSphereState
} from "./bloch_sphere_state.js";


class BlochSphere extends BaseGroup {
    constructor(radius, properties) {
        if (!properties) properties = {};

        if (!properties.theta) properties.theta = "0.0000";
        if (!properties.phi) properties.phi = "90.0000";

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
        this.updateBlochSphereState(CartesianAxes.YAxis, THREE.MathUtils.degToRad(properties.theta));
        this.updateBlochSphereState(CartesianAxes.ZAxis, THREE.MathUtils.degToRad(properties.phi));

        // Adding Parallel
        this.tgeometry = new THREE.TorusGeometry( 0, 1, 16, 64 );
        this.tmaterial = new THREE.MeshBasicMaterial( { color: 0xFFFF00 } );
        this.parallel = new THREE.Mesh( this.tgeometry, this.tmaterial );

        this.add(this.parallel);

        this.parallel.position.copy(new THREE.Vector3(0, radius, 0));
        this.parallel.rotateX(THREE.MathUtils.degToRad(90));

        // Adding Meridian
        let geometrym = new THREE.TorusGeometry( radius, 1, 16, 64 ).translate(0,0,0);
        let materialm = new THREE.MeshBasicMaterial( { color: 0xcea2fd } );
        this.meridian = new THREE.Mesh( geometrym, materialm );

        this.add( this.meridian );
    }

    updateBlochSphereState(axis, angle) {
        this.statePointer.rotate(axis, new THREE.Vector3(), angle);

        // Update BlochSphereState
        this.blochSphereState.update(this.statePointer.theta(), this.statePointer.phi());
    }

    resetBlochSphereState(polar, azimuth) {
        this.remove(this.statePointer);
        this.remove(this.parallel);
        this.remove(this.meridian);

        // get canvas
        let canvas = document.getElementById("bloch-sphere");
        let canvasWidth = canvas.offsetWidth;
        let canvasHeight = canvas.offsetHeight;

        // set diameter to 80% of canvas size
        let diameter = (Math.min(canvasWidth, canvasHeight) / 100) * 80;

        let radius = diameter / 2;

        this.statePointer = new StatePointer(radius, 3, {
            color: new THREE.Color(0xFFFFFF),
            position: new THREE.Vector3(0, radius / 2, 0)
        });

        // Add StatePointer to BaseGroup
        this.add(this.statePointer);

        // Set StatePointer
        this.updateBlochSphereState(CartesianAxes.YAxis, THREE.MathUtils.degToRad(polar));
        this.updateBlochSphereState(CartesianAxes.ZAxis, THREE.MathUtils.degToRad(azimuth));


        // Hesapla: Başlangıçta 90 derecede başlayıp, ardından 0 dereceye inip tekrar -90 dereceye inip tekrar 90 dereceye dönmesi
        let adjustedTheta = ((polar - 90 ) % 360);

        let x = Math.abs(Math.sin(THREE.MathUtils.degToRad(adjustedTheta)) * radius);
        let scaledRadius = radius * Math.abs(Math.cos(THREE.MathUtils.degToRad(adjustedTheta)));
        let direction = 1;
        if (0 <= polar % 360 && polar % 360 <= 90)
            direction = 1;
        else if (90 <= polar % 360 && polar % 360 <= 180)
            direction = -1;
        else if (180 <= polar % 360 && polar % 360 <= 270)
            direction = -1;
        else if (270 <= polar % 360 && polar % 360 <= 360)
            direction = 1;

        this.tgeometry = new THREE.TorusGeometry( scaledRadius, 1, 16, 64 );
        this.tmaterial = new THREE.MeshBasicMaterial( { color: 0xFFFF00 } );
        this.parallel = new THREE.Mesh( this.tgeometry, this.tmaterial );

        this.add(this.parallel);

        this.parallel.rotateX(THREE.MathUtils.degToRad(90));
        this.parallel.position.copy(new THREE.Vector3(0, x * direction, 0));

        // Adding Meridian
        let geometrym = new THREE.TorusGeometry( radius, 1, 16, 64 ).translate(0,0,0).rotateY(THREE.MathUtils.degToRad(90));
        let materialm = new THREE.MeshBasicMaterial( { color: 0xcea2fd } );
        this.meridian = new THREE.Mesh( geometrym, materialm );
        this.add( this.meridian );
        this.meridian.rotateY(THREE.MathUtils.degToRad(azimuth));
    }
}

export {
    BlochSphere
};
