import { MathUtils } from "three";
import * as THREE from "../node_modules/three/build/three.module.js";

import {
    GlobalContext
} from "./context.js";


var ToolboxEventsNamespace = {  
    thetaAngleOnInputChangeEvent: function() {
        let thetaAngle = $("#theta-angle").val();
    
        // update html content
        $("#theta-angle-value").html(`${thetaAngle}<span>&#176;</span>`);
    
        // save tetha angle
        GlobalContext.blochSphereStateProperties.theta = thetaAngle;

        GlobalContext.blochSphere.reset(thetaAngle, GlobalContext.blochSphereStateProperties.phi);
        GlobalContext.blochSphere.resetPtheta(thetaAngle);
       
        this.valuesOnChange();
    },

    phiAngleOnInputChangeEvent: function() {
        let phiAngle = $("#phi-angle").val();
    
        // update html content
        $("#phi-angle-value").html(`${phiAngle}<span>&#176;</span>`);
    
        // save phi angle
        GlobalContext.blochSphereStateProperties.phi = phiAngle;

        GlobalContext.blochSphere.reset(GlobalContext.blochSphereStateProperties.theta, phiAngle);
        GlobalContext.blochSphere.resetPphi(phiAngle);
        
        this.valuesOnChange();
    },

    positiveZOnClickEvent: function() {
        let thetaAngle = 0;
        let phiAngle = 0;

        GlobalContext.blochSphereStateProperties.theta = thetaAngle;
        GlobalContext.blochSphereStateProperties.phi = phiAngle;

        GlobalContext.blochSphere.reset(thetaAngle, phiAngle);

        this.valuesOnChange();
    },

    negativeZOnClickEvent: function() {
        let thetaAngle = 180;
        let phiAngle = 0;

        GlobalContext.blochSphereStateProperties.theta = thetaAngle;
        GlobalContext.blochSphereStateProperties.phi = phiAngle;

        GlobalContext.blochSphere.reset(thetaAngle, phiAngle);

        this.valuesOnChange();
    },

    positiveXOnClickEvent: function() {
        let thetaAngle = 90;
        let phiAngle = 0;

        GlobalContext.blochSphereStateProperties.theta = thetaAngle;
        GlobalContext.blochSphereStateProperties.phi = phiAngle;

        GlobalContext.blochSphere.reset(thetaAngle, phiAngle);

        this.valuesOnChange();
    },

    negativeXOnClickEvent: function() {
        let thetaAngle = 270;
        let phiAngle = 0;

        GlobalContext.blochSphereStateProperties.theta = thetaAngle;
        GlobalContext.blochSphereStateProperties.phi = phiAngle;

        GlobalContext.blochSphere.reset(thetaAngle, phiAngle);

        this.valuesOnChange();
    },

    positiveYOnClickEvent: function() {
        let thetaAngle = 90;
        let phiAngle = 90;

        GlobalContext.blochSphereStateProperties.theta = thetaAngle;
        GlobalContext.blochSphereStateProperties.phi = phiAngle;

        GlobalContext.blochSphere.reset(thetaAngle, phiAngle);

        this.valuesOnChange();
    },

    negativeYOnClickEvent: function() {
        let thetaAngle = 270;
        let phiAngle = 90;

        GlobalContext.blochSphereStateProperties.theta = thetaAngle;
        GlobalContext.blochSphereStateProperties.phi = phiAngle;

        GlobalContext.blochSphere.reset(thetaAngle, phiAngle);

        this.valuesOnChange();
    },

    valuesOnChange: function() {
        let thetaAngle = GlobalContext.blochSphereStateProperties.theta;
        $("#theta-angle-value").html(`${thetaAngle}<span>&#176;</span>`);
        $("#theta-angle").val(thetaAngle);

        let phiAngle = GlobalContext.blochSphereStateProperties.phi;
        $("#phi-angle-value").html(`${phiAngle}<span>&#176;</span>`);
        $("#phi-angle").val(phiAngle);
   
        this.updateBlochSphereStateExpressions();
    },

    updateBlochSphereStateExpressions: function () {
        let theta = GlobalContext.blochSphereStateProperties.theta;
        let phi = GlobalContext.blochSphereStateProperties.phi;

        //Updates added
        $("#bloch-sphere-state-theta").text(theta);
        $("#bloch-sphere-state-phi").text(phi);

        let alpha = Math.abs(Math.cos(MathUtils.degToRad(theta) / 2));
        $("#bloch-sphere-state-alpha").text(alpha.toFixed(4));

        let real = Math.sin(MathUtils.degToRad(theta) / 2) * Math.cos(MathUtils.degToRad(phi));
        let imaginary = Math.abs(Math.sin(MathUtils.degToRad(theta) / 2) * Math.sin(MathUtils.degToRad(phi)));
        $("#bloch-sphere-state-beta").text(`${real.toFixed(4)} + i * ${imaginary.toFixed(4)}`);

        $("#bloch-sphere-state-0").text(Math.pow(alpha, 2).toFixed(4));

        let squaredReal = real * real - imaginary * imaginary;
        let squaredImaginary = Math.abs(2 * real * imaginary);
        $("#bloch-sphere-state-1").text(`${squaredReal.toFixed(4)} + i * ${squaredImaginary.toFixed(4)}`);
    },

    startToolboxEventListeners: function() {
        $("#theta-angle").on("input change", function () {
            ToolboxEventsNamespace.thetaAngleOnInputChangeEvent();
        });

        $("#phi-angle").on("input change", function () {
            ToolboxEventsNamespace.phiAngleOnInputChangeEvent();
        });

        $("#positive-z").click(function () {
            ToolboxEventsNamespace.positiveZOnClickEvent();
        });

        $("#negative-z").click(function () {
            ToolboxEventsNamespace.negativeZOnClickEvent();
        });

        $("#positive-x").click(function () {
            ToolboxEventsNamespace.positiveXOnClickEvent();
        });

        $("#negative-x").click(function () {
            ToolboxEventsNamespace.negativeXOnClickEvent();
        });

        $("#positive-y").click(function () {
            ToolboxEventsNamespace.positiveYOnClickEvent();
        });

        $("#negative-y").click(function () {
            ToolboxEventsNamespace.negativeYOnClickEvent();
        });
    },
}

export {
    ToolboxEventsNamespace
};