import { MathUtils } from "three";
import * as THREE from "../node_modules/three/build/three.module.js";

import {
    CartesianAxes, StatePointer
} from "./composite_shapes.js";

import {
    GlobalContext
} from "./context.js";

const delay = ms => new Promise(res => setTimeout(res, ms));

var ToolboxEventsNamespace = {  
    thetaAngleOnInputChangeEvent: function() {
        let thetaAngle = $("#theta-angle").val();
        let angle = parseInt(thetaAngle);
    
        // update html content
        $("#theta-angle-value").html(`${angle}<span>&#176;</span>`);
    
        // save tetha angle
        GlobalContext.blochSphereStateProperties.theta = angle;

        GlobalContext.blochSphere.reset(angle, GlobalContext.blochSphereStateProperties.phi);
        GlobalContext.blochSphere.resetPtheta(angle);
       
        this.valuesOnChange();
    },

    phiAngleOnInputChangeEvent: function() {
        let phiAngle = $("#phi-angle").val();
        let angle = parseInt(phiAngle);
    
        // update html content
        $("#phi-angle-value").html(`${angle}<span>&#176;</span>`);
    
        // save phi angle
        GlobalContext.blochSphereStateProperties.phi = angle;

        GlobalContext.blochSphere.reset(GlobalContext.blochSphereStateProperties.theta, angle);
        GlobalContext.blochSphere.resetPphi(angle);
        
        this.valuesOnChange();
    },

    positiveZOnClickEvent: function() {
        let thetaAngle = 0;
        let phiAngle = 0;

        GlobalContext.blochSphereStateProperties.theta = thetaAngle;
        GlobalContext.blochSphereStateProperties.phi = phiAngle;

        GlobalContext.blochSphere.reset(thetaAngle, phiAngle);
        GlobalContext.blochSphere.resetPtheta(thetaAngle);
        GlobalContext.blochSphere.resetPphi(phiAngle);

        this.valuesOnChange();
    },

    negativeZOnClickEvent: function() {
        let thetaAngle = 180;
        let phiAngle = 0;

        GlobalContext.blochSphereStateProperties.theta = thetaAngle;
        GlobalContext.blochSphereStateProperties.phi = phiAngle;

        GlobalContext.blochSphere.reset(thetaAngle, phiAngle);
        GlobalContext.blochSphere.resetPtheta(thetaAngle);
        GlobalContext.blochSphere.resetPphi(phiAngle);

        this.valuesOnChange();
    },

    positiveXOnClickEvent: function() {
        let thetaAngle = 90;
        let phiAngle = 0;

        GlobalContext.blochSphereStateProperties.theta = thetaAngle;
        GlobalContext.blochSphereStateProperties.phi = phiAngle;

        GlobalContext.blochSphere.reset(thetaAngle, phiAngle);
        GlobalContext.blochSphere.resetPtheta(thetaAngle);
        GlobalContext.blochSphere.resetPphi(phiAngle);

        this.valuesOnChange();
    },

    negativeXOnClickEvent: function() {
        let thetaAngle = 90;
        let phiAngle = 180;

        GlobalContext.blochSphereStateProperties.theta = thetaAngle;
        GlobalContext.blochSphereStateProperties.phi = phiAngle;

        GlobalContext.blochSphere.reset(thetaAngle, phiAngle);
        GlobalContext.blochSphere.resetPtheta(thetaAngle);
        GlobalContext.blochSphere.resetPphi(phiAngle);

        this.valuesOnChange();
    },

    positiveYOnClickEvent: function() {
        let thetaAngle = 90;
        let phiAngle = 90;

        GlobalContext.blochSphereStateProperties.theta = thetaAngle;
        GlobalContext.blochSphereStateProperties.phi = phiAngle;

        GlobalContext.blochSphere.reset(thetaAngle, phiAngle);
        GlobalContext.blochSphere.resetPtheta(thetaAngle);
        GlobalContext.blochSphere.resetPphi(phiAngle);

        this.valuesOnChange();
    },

    negativeYOnClickEvent: function() {
        let thetaAngle = 90;
        let phiAngle = 270;

        GlobalContext.blochSphereStateProperties.theta = thetaAngle;
        GlobalContext.blochSphereStateProperties.phi = phiAngle;

        GlobalContext.blochSphere.reset(thetaAngle, phiAngle);
        GlobalContext.blochSphere.resetPtheta(thetaAngle);
        GlobalContext.blochSphere.resetPphi(phiAngle);

        this.valuesOnChange();
    },

    gatepxOnClickEvent: async function () {
        $("#gate-px").prop('disabled', true);

        let angle = 180;
        
        for (let i = 0; i < angle; i++)
        {
            GlobalContext.blochSphere.updateBlochSphereState(CartesianAxes.XAxis, THREE.MathUtils.degToRad(1));
            GlobalContext.blochSphereStateProperties.theta += 1;
            GlobalContext.blochSphereStateProperties.phi += 0;
            GlobalContext.blochSphere.resetPtheta(GlobalContext.blochSphereStateProperties.theta);
            GlobalContext.blochSphere.resetPphi(GlobalContext.blochSphereStateProperties.phi);
            this.valuesOnChange();
            
            await delay(20);
        }

        $("#gate-px").prop('disabled', false);
    },

    gatepyOnClickEvent: async function () {
        $("#gate-py").prop('disabled', true);

        let angle = 180;
        
        for (let i = 0; i < angle; i++)
        {
            GlobalContext.blochSphere.updateBlochSphereState(CartesianAxes.YAxis, THREE.MathUtils.degToRad(1));
            GlobalContext.blochSphereStateProperties.theta += 1;
            GlobalContext.blochSphereStateProperties.phi += 0;
            GlobalContext.blochSphere.resetPtheta(GlobalContext.blochSphereStateProperties.theta);
            GlobalContext.blochSphere.resetPphi(GlobalContext.blochSphereStateProperties.phi);
            this.valuesOnChange();
            
            await delay(20);
        }

        $("#gate-py").prop('disabled', false);
    },

    gatepzOnClickEvent: async function () {
        $("#gate-pz").prop('disabled', true);

        let angle = 180;
        
        for (let i = 0; i < angle; i++)
        {
            GlobalContext.blochSphere.updateBlochSphereState(CartesianAxes.ZAxis, THREE.MathUtils.degToRad(1));
            GlobalContext.blochSphereStateProperties.theta += 0;
            GlobalContext.blochSphereStateProperties.phi += 1;
            GlobalContext.blochSphere.resetPtheta(GlobalContext.blochSphereStateProperties.theta);
            GlobalContext.blochSphere.resetPphi(GlobalContext.blochSphereStateProperties.phi);
            this.valuesOnChange();
            
            await delay(20);
        }

        $("#gate-pz").prop('disabled', false);
    },

    xRotOnClickEvent: async function () {
        $("#x-rot-submit").prop('disabled', true);

        let angle = $("#x-rot-input").val();
        let direction = angle >= 0 ? 1 : -1;

        for (let i = 0; i < Math.abs(angle); i++)
        {
            GlobalContext.blochSphere.updateBlochSphereState(CartesianAxes.XAxis, THREE.MathUtils.degToRad(direction));
            GlobalContext.blochSphereStateProperties.theta += direction;
            GlobalContext.blochSphereStateProperties.phi += 0;
            GlobalContext.blochSphere.resetPtheta(GlobalContext.blochSphereStateProperties.theta);
            GlobalContext.blochSphere.resetPphi(GlobalContext.blochSphereStateProperties.phi);
            this.valuesOnChange();
            
            await delay(20);
        }

        $("#x-rot-submit").prop('disabled', false);
    },

    yRotOnClickEvent: async function () {
        $("#y-rot-submit").prop('disabled', true);

        let angle = $("#y-rot-input").val();
        let direction = angle >= 0 ? 1 : -1;

        for (let i = 0; i < Math.abs(angle); i++)
        {
            GlobalContext.blochSphere.updateBlochSphereState(CartesianAxes.YAxis, THREE.MathUtils.degToRad(direction));
            GlobalContext.blochSphereStateProperties.theta += direction;
            GlobalContext.blochSphereStateProperties.phi += 0;
            GlobalContext.blochSphere.resetPtheta(GlobalContext.blochSphereStateProperties.theta);
            GlobalContext.blochSphere.resetPphi(GlobalContext.blochSphereStateProperties.phi);
            this.valuesOnChange();
            
            await delay(20);
        }

        $("#y-rot-submit").prop('disabled', false);
    },

    zRotOnClickEvent: async function () {
        $("#z-rot-submit").prop('disabled', true);

        let angle = $("#z-rot-input").val();
        let direction = angle >= 0 ? 1 : -1;

        for (let i = 0; i < Math.abs(angle); i++)
        {
            GlobalContext.blochSphere.updateBlochSphereState(CartesianAxes.ZAxis, THREE.MathUtils.degToRad(direction));
            GlobalContext.blochSphereStateProperties.theta += 0;
            GlobalContext.blochSphereStateProperties.phi += direction;
            GlobalContext.blochSphere.resetPtheta(GlobalContext.blochSphereStateProperties.theta);
            GlobalContext.blochSphere.resetPphi(GlobalContext.blochSphereStateProperties.phi);
            this.valuesOnChange();
            
            await delay(20);
        }

        $("#z-rot-submit").prop('disabled', false);
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

        $("#gate-px").click(function () {
            ToolboxEventsNamespace.gatepxOnClickEvent();
        });

        $("#gate-py").click(function () {
            ToolboxEventsNamespace.gatepyOnClickEvent();
        });

        $("#gate-pz").click(function () {
            ToolboxEventsNamespace.gatepzOnClickEvent();
        });

        $("#x-rot-submit").click(function () {
            ToolboxEventsNamespace.xRotOnClickEvent();
        });

        $("#y-rot-submit").click(function () {
            ToolboxEventsNamespace.yRotOnClickEvent();
        });

        $("#z-rot-submit").click(function () {
            ToolboxEventsNamespace.zRotOnClickEvent();
        });
    },
}

export {
    ToolboxEventsNamespace
};