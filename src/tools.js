import * as THREE from "../node_modules/three/build/three.module.js";

import {
    CartesianAxes, StatePointer
} from "./composite_shapes.js";

import {
    GlobalContext
} from "./context.js";

import {
    BlochSphereState
} from "./bloch_sphere_state.js";
import {Float} from "./float.js";
import {float} from "three/nodes";

var buttondanmi = false;

var ToolboxEventsNamespace = {  
    thetaAngleOnInputChangeEvent: function() {
        let angle = parseInt($("#polar-angle").val());
        $("#polar-angle-value").html(`${angle}<span>&#176;</span>`);

        GlobalContext.blochSphere.reset(angle, BlochSphereState.getInstance().phi);
        GlobalContext.blochSphere.setParallelState(angle);
        // GlobalContext.blochSphere.resetPtheta(angle);
    },

    phiAngleOnInputChangeEvent: function() {
        let angle = parseInt($("#azimuth-angle").val());
        $("#azimuth-angle-value").html(`${angle}<span>&#176;</span>`);

        GlobalContext.blochSphere.reset(BlochSphereState.getInstance().theta, angle);
        // GlobalContext.blochSphere.resetPphi(angle);
    },

    GateOnClickEvent: function(polar, azimuth) {
        $("#polar-angle-value").html(`${polar}<span>&#176;</span>`);
        $("#azimuth-angle-value").html(`${azimuth}<span>&#176;</span>`);
        $("#polar-angle").val(polar);
        $("#azimuth-angle").val(azimuth);

        GlobalContext.blochSphere.setBlochSphereState(polar, azimuth);

        // GlobalContext.blochSphere.reset(polar, azimuth);
        // GlobalContext.blochSphere.resetPtheta(theta);
        // GlobalContext.blochSphere.resetPphi(phi);   
    },

    RotateOnClickEvent: function (axis, angle) {
        $(":button").prop('disabled', true);

        let ax = axis === "x" ? CartesianAxes.XAxis : axis === "y" ? CartesianAxes.YAxis : CartesianAxes.ZAxis;

        if (angle == null)
            angle = parseInt($("#" + axis + "-rot-input").val());

        let direction = angle >= 0 ? -1 : 1;

        let intervalTime = 10;
        let totalTime = angle * direction * intervalTime;

        // FIXME: SEKMEYİ ALT+TAB YAPINCA İŞLEM DEVAM ETMİYOR

        let timer = setInterval(function() {
            let currentAngleTheta = parseInt(BlochSphereState.getInstance().theta);
            let currentAnglePhi = Math.abs(parseInt(BlochSphereState.getInstance().phi));

            GlobalContext.blochSphere.updateBlochSphereState(ax, THREE.MathUtils.degToRad(direction));

            $("#polar-angle-value").html(`${currentAngleTheta}<span>&#176;</span>`);
            $("#azimuth-angle-value").html(`${currentAnglePhi}<span>&#176;</span>`);
            $("#polar-angle").val(currentAngleTheta);
            $("#azimuth-angle").val(currentAnglePhi);

            // GlobalContext.blochSphere.resetPtheta(BlochSphereState.getInstance().z);
            // GlobalContext.blochSphere.resetPtheta(BlochSphereState.getInstance().theta);
            // GlobalContext.blochSphere.resetPphi(BlochSphereState.getInstance().phi);

        }, intervalTime);

        setTimeout(function() {
            clearInterval(timer);
            $(":button").prop('disabled', false);

            let currentAngleTheta = parseInt(BlochSphereState.getInstance().theta);
            let currentAnglePhi = Math.abs(parseInt(BlochSphereState.getInstance().phi));
            $("#polar-angle-value").html(`${currentAngleTheta}<span>&#176;</span>`);
            $("#azimuth-angle-value").html(`${currentAnglePhi}<span>&#176;</span>`);
            $("#polar-angle").val(currentAngleTheta);
            $("#azimuth-angle").val(currentAnglePhi);
        }, Math.abs(totalTime));
    },

    valuesOnChange: function() {
        const state = BlochSphereState.getInstance();

        // $("#polar-angle-value").html(`${parseInt(state.theta)}<span>&#176;</span>`);
        // $("#polar-angle").val(parseInt(state.theta));

        // $("#azimuth-angle-value").html(`${state.phi}<span>&#176;</span>`);
        // $("#azimuth-angle").val(state.phi);
   
        //Updates added
        $("#bloch-sphere-state-theta").text(state.theta);
        $("#bloch-sphere-state-phi").text(state.phi);

        $("#bloch-sphere-state-alpha").text(state.alpha);
        $("#bloch-sphere-state-beta").text(state.beta);

        $("#bloch-sphere-state-0").text(state.prob0);
        $("#bloch-sphere-state-1").text(state.prob1);

        $("#bloch-sphere-state-x").text(state.x);
        $("#bloch-sphere-state-y").text(state.y);
        $("#bloch-sphere-state-z").text(state.z);
    },

    startToolboxEventListeners: function() {
        $("#polar-angle").on("input change", function () {
            ToolboxEventsNamespace.thetaAngleOnInputChangeEvent();
        });

        $("#azimuth-angle").on("input change", function () {
            ToolboxEventsNamespace.phiAngleOnInputChangeEvent();
        });

        $("#positive-z").click(function () {
            ToolboxEventsNamespace.GateOnClickEvent(0, 90);
        });

        $("#negative-z").click(function () {
            ToolboxEventsNamespace.GateOnClickEvent(180, 90);
        });

        $("#positive-x").click(function () {
            ToolboxEventsNamespace.GateOnClickEvent(90, 0);
        });

        $("#negative-x").click(function () {
            ToolboxEventsNamespace.GateOnClickEvent(90, 180);
        });

        $("#positive-y").click(function () {
            ToolboxEventsNamespace.GateOnClickEvent(90, 90);
        });

        $("#negative-y").click(function () {
            ToolboxEventsNamespace.GateOnClickEvent(90, 270);
        });

        $("#gate-px").click(function () {
            ToolboxEventsNamespace.RotateOnClickEvent("x", 180);
        });

        $("#gate-py").click(function () {
            ToolboxEventsNamespace.RotateOnClickEvent("y", 180);
        });

        $("#gate-pz").click(function () {
            ToolboxEventsNamespace.RotateOnClickEvent("z", 180);
        });

        $("#x-rot-submit").click(function () {
            ToolboxEventsNamespace.RotateOnClickEvent("x");
        });

        $("#y-rot-submit").click(function () {
            ToolboxEventsNamespace.RotateOnClickEvent("y");
        });

        $("#z-rot-submit").click(function () {
            ToolboxEventsNamespace.RotateOnClickEvent("z");
        });
    },
}

export {
    ToolboxEventsNamespace
};