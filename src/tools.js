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

var ToolboxEventsNamespace = {
    thetaAngleOnInputChangeEvent: function() {
        let angle = parseInt($("#polar-angle").val());
        $("#polar-angle-value").html(`${angle}<span>&#176;</span>`);
        GlobalContext.blochSphereStateProperties.polar = angle;
        GlobalContext.blochSphere.reset(angle, GlobalContext.blochSphereStateProperties.azimuth);
        GlobalContext.blochSphere.resetPtheta(angle);
    },

    phiAngleOnInputChangeEvent: function() {
        let angle = parseInt($("#azimuth-angle").val());
        $("#azimuth-angle-value").html(`${angle}<span>&#176;</span>`);
        GlobalContext.blochSphereStateProperties.azimuth = angle;
        GlobalContext.blochSphere.reset(GlobalContext.blochSphereStateProperties.polar, angle);
        GlobalContext.blochSphere.resetPphi(angle);
    },

    GateOnClickEvent: function(polar, azimuth) {
        $("#polar-angle-value").html(`${polar}<span>&#176;</span>`);
        $("#azimuth-angle-value").html(`${azimuth}<span>&#176;</span>`);
        $("#polar-angle").val(polar);
        $("#azimuth-angle").val(azimuth);

        GlobalContext.blochSphereStateProperties.polar = polar;
        GlobalContext.blochSphereStateProperties.azimuth = azimuth;
        GlobalContext.blochSphere.reset(polar, azimuth);

        GlobalContext.blochSphere.resetPtheta(polar);
        GlobalContext.blochSphere.resetPphi(azimuth);
    },

    RotateOnClickEvent: function(axis, angle) {
        if (angle == null)
            angle = parseInt($("#" + axis + "-rot-input").val());

        // Mevcut polar ve azimuth açılarını radian cinsine çevir
        let theta_rad = THREE.MathUtils.degToRad(GlobalContext.blochSphereStateProperties.polar);
        let phi_rad = THREE.MathUtils.degToRad(GlobalContext.blochSphereStateProperties.azimuth);
        let alpha_rad = THREE.MathUtils.degToRad(Math.abs(angle));

        // Başlangıçtaki Kartezyen koordinatlar
        let x = Math.sin(theta_rad) * Math.cos(phi_rad);
        let y = Math.sin(theta_rad) * Math.sin(phi_rad);
        let z = Math.cos(theta_rad);

        // Yeni polar ve azimuth açılarını hesaplamak için dönüşüm matrisleri
        let Rx = [
            [1, 0, 0],
            [0, Math.cos(alpha_rad), -Math.sin(alpha_rad)],
            [0, Math.sin(alpha_rad), Math.cos(alpha_rad)]
        ];

        let Ry = [
            [Math.cos(alpha_rad), 0, Math.sin(alpha_rad)],
            [0, 1, 0],
            [-Math.sin(alpha_rad), 0, Math.cos(alpha_rad)]
        ];

        let Rz = [
            [Math.cos(alpha_rad), -Math.sin(alpha_rad), 0],
            [Math.sin(alpha_rad), Math.cos(alpha_rad), 0],
            [0, 0, 1]
        ];

        // Doğru dönüşüm matrisini seç
        let rax = axis === "x" ? Rx : axis === "y" ? Ry : Rz;

        // Orijinal koordinat vektörü
        let originalCoords = [x, y, z];

        // Matris çarpımı fonksiyonu
        function multiplyMatrixAndPoint(matrix, point) {
            let result = [0, 0, 0];
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    result[i] += matrix[i][j] * point[j];
                }
            }
            return result;
        }

        // Yeni koordinatları hesapla
        let [x_new, y_new, z_new] = multiplyMatrixAndPoint(rax, originalCoords);

        let r = Math.sqrt(x_new**2 + y_new**2 + z_new**2);
        let theta_new_rad = Math.acos(z_new / r);
        let phi_new_rad = Math.atan2(y_new, x_new);

        // Yeni açılar (derece cinsinden)
        let theta_new_deg = (Math.round(THREE.MathUtils.radToDeg(theta_new_rad)) + 360) % 360;
        let phi_new_deg = (Math.round(THREE.MathUtils.radToDeg(phi_new_rad)) + 360) % 360;

        // Güncellenmiş açılar
        GlobalContext.blochSphereStateProperties.polar = theta_new_deg;
        GlobalContext.blochSphereStateProperties.azimuth = phi_new_deg;

        $("#polar-angle-value").html(`${theta_new_deg}<span>&#176;</span>`);
        $("#azimuth-angle-value").html(`${phi_new_deg}<span>&#176;</span>`);
        $("#polar-angle").val(theta_new_deg);
        $("#azimuth-angle").val(phi_new_deg);

        GlobalContext.blochSphere.resetPtheta(theta_new_deg);
        GlobalContext.blochSphere.resetPphi(phi_new_deg);

        //console.log("Yeni polar açı (theta): " + theta_new_deg + " derece");
        //console.log("Yeni azimuth açı (phi): " + phi_new_deg + " derece");

        GlobalContext.blochSphere.reset(theta_new_deg, phi_new_deg);
    },

    valuesOnChange: function() {
        const state = BlochSphereState.getInstance();

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
            ToolboxEventsNamespace.GateOnClickEvent(0, 0);
        });

        $("#negative-z").click(function () {
            ToolboxEventsNamespace.GateOnClickEvent(180, 0);
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