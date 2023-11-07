import * as THREE from "../node_modules/three/build/three.module.js";

import {
    GlobalContext
} from "./context.js";


var ToolboxEventsNamespace = {    
    tethaAngleOnInputChangeEvent: function() {
        let tethaAngle = $("#tetha-angle").val();
    
        // update html content
        $("#tetha-angle-value").html(`${tethaAngle}<span>&#176;</span>`);
    
        // save tetha angle
        GlobalContext.lambdaGatesProperties.tethaAngle = tethaAngle;
    },

    phiAngleOnInputChangeEvent: function() {
        let phiAngle = $("#phi-angle").val();
    
        // update html content
        $("#phi-angle-value").html(`${phiAngle}<span>&#176;</span>`);
    
        // save phi angle
        GlobalContext.lambdaGatesProperties.phiAngle = phiAngle;
    },

    upOnClickEvent: function() {
        console.log("up");
    },

    downOnClickEvent: function() {
        console.log("down");
    },

    startToolboxEventListeners: function() {
        $("#tetha-angle").on("input change", function () {
            ToolboxEventsNamespace.tethaAngleOnInputChangeEvent();
        });

        $("#phi-angle").on("input change", function () {
            ToolboxEventsNamespace.phiAngleOnInputChangeEvent();
        });

        $("#up").click(function () {
            ToolboxEventsNamespace.upOnClickEvent();
        });

        $("#down").click(function () {
            ToolboxEventsNamespace.downOnClickEvent();
        });
    },
}

export {
    ToolboxEventsNamespace
};