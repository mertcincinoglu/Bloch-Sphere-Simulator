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
        let thetaAngle = 180;
        let phiAngle = 90;

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

    gatepx90OnClickEvent: async function () {
        $("#gate-px90").prop('disabled', true);

        let angle = 90;
        
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

        $("#gate-px90").prop('disabled', false);
    },

    gatepy90OnClickEvent: async function () {
        $("#gate-py90").prop('disabled', true);

        let angle = 90;
        
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

        $("#gate-py90").prop('disabled', false);
    },

    gatepz90OnClickEvent: async function () {
        $("#gate-pz90").prop('disabled', true);

        let angle = 90;
        
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

        $("#gate-pz90").prop('disabled', false);
    },

    gatepx90nOnClickEvent: async function () {
        $("#gate-px90n").prop('disabled', true);

        let angle = 90;
        
        for (let i = 0; i < angle; i++)
        {
            GlobalContext.blochSphere.updateBlochSphereState(CartesianAxes.XAxis, THREE.MathUtils.degToRad(-1));
            GlobalContext.blochSphereStateProperties.theta -= 1;
            GlobalContext.blochSphereStateProperties.phi -= 0;
            GlobalContext.blochSphere.resetPtheta(GlobalContext.blochSphereStateProperties.theta);
            GlobalContext.blochSphere.resetPphi(GlobalContext.blochSphereStateProperties.phi);
            this.valuesOnChange();
            
            await delay(20);
        }

        $("#gate-px90n").prop('disabled', false);
    },

    gatepy90nOnClickEvent: async function () {
        $("#gate-py90n").prop('disabled', true);

        let angle = 90;
        
        for (let i = 0; i < angle; i++)
        {
            GlobalContext.blochSphere.updateBlochSphereState(CartesianAxes.YAxis, THREE.MathUtils.degToRad(-1));
            GlobalContext.blochSphereStateProperties.theta -= 1;
            GlobalContext.blochSphereStateProperties.phi -= 0;
            GlobalContext.blochSphere.resetPtheta(GlobalContext.blochSphereStateProperties.theta);
            GlobalContext.blochSphere.resetPphi(GlobalContext.blochSphereStateProperties.phi);
            this.valuesOnChange();
            
            await delay(20);
        }

        $("#gate-py90n").prop('disabled', false);
    },

    gatepz90nOnClickEvent: async function () {
        $("#gate-pz90n").prop('disabled', true);

        let angle = 90;
        
        for (let i = 0; i < angle; i++)
        {
            GlobalContext.blochSphere.updateBlochSphereState(CartesianAxes.ZAxis, THREE.MathUtils.degToRad(-1));
            GlobalContext.blochSphereStateProperties.theta -= 0;
            GlobalContext.blochSphereStateProperties.phi -= 1;
            GlobalContext.blochSphere.resetPtheta(GlobalContext.blochSphereStateProperties.theta);
            GlobalContext.blochSphere.resetPphi(GlobalContext.blochSphereStateProperties.phi);
            this.valuesOnChange();
            
            await delay(20);
        }

        $("#gate-pz90n").prop('disabled', false);
    },

    gatepx45OnClickEvent: async function () {
        $("#gate-px45").prop('disabled', true);

        let angle = 45;
        
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

        $("#gate-px45").prop('disabled', false);
    },

    gatepy45OnClickEvent: async function () {
        $("#gate-py45").prop('disabled', true);

        let angle = 45;
        
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

        $("#gate-py45").prop('disabled', false);
    },

    gatepz45OnClickEvent: async function () {
        $("#gate-pz45").prop('disabled', true);

        let angle = 45;
        
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

        $("#gate-pz45").prop('disabled', false);
    },

    gatepx45nOnClickEvent: async function () {
        $("#gate-px45n").prop('disabled', true);

        let angle = 45;
        
        for (let i = 0; i < angle; i++)
        {
            GlobalContext.blochSphere.updateBlochSphereState(CartesianAxes.XAxis, THREE.MathUtils.degToRad(-1));
            GlobalContext.blochSphereStateProperties.theta -= 1;
            GlobalContext.blochSphereStateProperties.phi -= 0;
            GlobalContext.blochSphere.resetPtheta(GlobalContext.blochSphereStateProperties.theta);
            GlobalContext.blochSphere.resetPphi(GlobalContext.blochSphereStateProperties.phi);
            this.valuesOnChange();
            
            await delay(20);
        }

        $("#gate-px45n").prop('disabled', false);
    },

    gatepy45nOnClickEvent: async function () {
        $("#gate-py45n").prop('disabled', true);

        let angle = 45;
        
        for (let i = 0; i < angle; i++)
        {
            GlobalContext.blochSphere.updateBlochSphereState(CartesianAxes.YAxis, THREE.MathUtils.degToRad(-1));
            GlobalContext.blochSphereStateProperties.theta -= 1;
            GlobalContext.blochSphereStateProperties.phi -= 0;
            GlobalContext.blochSphere.resetPtheta(GlobalContext.blochSphereStateProperties.theta);
            GlobalContext.blochSphere.resetPphi(GlobalContext.blochSphereStateProperties.phi);
            this.valuesOnChange();
            
            await delay(20);
        }

        $("#gate-py45n").prop('disabled', false);
    },

    gatepz45nOnClickEvent: async function () {
        $("#gate-pz45n").prop('disabled', true);

        let angle = 45;
        
        for (let i = 0; i < angle; i++)
        {
            GlobalContext.blochSphere.updateBlochSphereState(CartesianAxes.ZAxis, THREE.MathUtils.degToRad(-1));
            GlobalContext.blochSphereStateProperties.theta -= 0;
            GlobalContext.blochSphereStateProperties.phi -= 1;
            GlobalContext.blochSphere.resetPtheta(GlobalContext.blochSphereStateProperties.theta);
            GlobalContext.blochSphere.resetPphi(GlobalContext.blochSphereStateProperties.phi);
            this.valuesOnChange();
            
            await delay(20);
        }

        $("#gate-pz45n").prop('disabled', false);
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

        $("#gate-px90").click(function () {
            ToolboxEventsNamespace.gatepx90OnClickEvent();
        });

        $("#gate-py90").click(function () {
            ToolboxEventsNamespace.gatepy90OnClickEvent();
        });

        $("#gate-pz90").click(function () {
            ToolboxEventsNamespace.gatepz90OnClickEvent();
        });

        $("#gate-px90n").click(function () {
            ToolboxEventsNamespace.gatepx90nOnClickEvent();
        });

        $("#gate-py90n").click(function () {
            ToolboxEventsNamespace.gatepy90nOnClickEvent();
        });

        $("#gate-pz90n").click(function () {
            ToolboxEventsNamespace.gatepz90nOnClickEvent();
        });

        $("#gate-px45").click(function () {
            ToolboxEventsNamespace.gatepx45OnClickEvent();
        });

        $("#gate-py45").click(function () {
            ToolboxEventsNamespace.gatepy45OnClickEvent();
        });

        $("#gate-pz45").click(function () {
            ToolboxEventsNamespace.gatepz45OnClickEvent();
        });

        $("#gate-px45n").click(function () {
            ToolboxEventsNamespace.gatepx45nOnClickEvent();
        });

        $("#gate-py45n").click(function () {
            ToolboxEventsNamespace.gatepy45nOnClickEvent();
        });

        $("#gate-pz45n").click(function () {
            ToolboxEventsNamespace.gatepz45nOnClickEvent();
        });
    },
}

export {
    ToolboxEventsNamespace
};