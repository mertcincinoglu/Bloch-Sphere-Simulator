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
    },

    phiAngleOnInputChangeEvent: function() {
        let phiAngle = $("#phi-angle").val();
    
        // update html content
        $("#phi-angle-value").html(`${phiAngle}<span>&#176;</span>`);
    
        // save phi angle
        GlobalContext.blochSphereStateProperties.phi = phiAngle;

        GlobalContext.blochSphere.reset(GlobalContext.blochSphereStateProperties.theta, phiAngle);
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