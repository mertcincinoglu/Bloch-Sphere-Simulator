import {
    GlobalContext
} from "../context.js";

import {
    Complex
} from "../math/complex.js";

import {
    QuantumGate
} from "../quantum/quantum_gate.js";

import {
    BlochSphereEventsNamespace
} from "./bloch_sphere.js";

import {
    NavbarEventsNamespace
} from "./navbar.js";

import * as THREE from "../libs/three/three.module.js";
import {Vector3} from "../libs/three/three.module.js";


var ToolboxEventsNamespace = {
    enableQuantumGates: function() {
        $("button[id$='Gate']").attr("disabled", false);
    },
    
    disableQuantumGates: function() {
        $("button[id$='Gate']").attr("disabled", true);
    },
    
    createCustomQuantumGate: function(customQuantumGate) {
        let count = Object.keys(GlobalContext.customGatesProperties).length + 1;
        let id = "c" + count + "-customGate";
    
        GlobalContext.customGatesProperties[id] = customQuantumGate;
    
        let customQuantumGateHtml = `
            <button type="button" id="${id}" class="quantum-gate col-xl-3 col-lg-12 btn btn-primary btn-custom mr-1 mt-1"
                data-toggle="tooltip" data-html="true" title="${customQuantumGate.properties.title}">
                <span>C<sub>${count}</sub></span>
            </button>
        `;
    
        $(customQuantumGateHtml).insertBefore("#custom-gate-add");
    },
    
    createCustomQuantumGateUsingRotations: function(x, y, z, rotation) {
        let customQuantumGate = QuantumGate.createQuantumGateUsingRotations(x, y, z, rotation);
        ToolboxEventsNamespace.createCustomQuantumGate(customQuantumGate);
    },
    
    createCustomQuantumGateUsingMatrix: function(a11, a12, a21, a22) {
        let customQuantumGate = QuantumGate.createQuantumGateUsingMatrix(a11, a12, a21, a22);
        ToolboxEventsNamespace.createCustomQuantumGate(customQuantumGate);
    },
    
    resetCustomQuantumGateModels: function() {
        // reset custom gate using rotations
        $("#using-rotations-custom-gate-x").val("");
        $("#using-rotations-custom-gate-y").val("");
        $("#using-rotations-custom-gate-z").val("");
        $("#using-rotations-custom-gate-rotation").val("");
        $("#using-rotations-custom-gates-form").removeClass("was-validated");
    
        // reset custom gate using matrix
        $("#using-matrix-custom-gate-a11-real").val("");
        $("#using-matrix-custom-gate-a11-img").val("");
        $("#using-matrix-custom-gate-a12-real").val("");
        $("#using-matrix-custom-gate-a12-img").val("");
        $("#using-matrix-custom-gate-a21-real").val("");
        $("#using-matrix-custom-gate-a21-img").val("");
        $("#using-matrix-custom-gate-a22-real").val("");
        $("#using-matrix-custom-gate-a22-img").val("");
        $("#using-matrix-custom-gates-form").removeClass("was-validated");
    },

    builtInGateButtonOnClickEvent: function(buildInGateButtonId) {
        // BlochSphereEventsNamespace.startBlochSphereOperation(GlobalContext.builtInGatesProperties[buildInGateButtonId]);

        let gate = GlobalContext.builtInGatesProperties[buildInGateButtonId];

        let angle = gate.rotation;
        let rAxis = gate.axis;

        //BlochSphereEventsNamespace.startBlochSphereOperation(new QuantumGate(rAxis.x, rAxis.y, rAxis.z, angle));

        let oldPolarAngle_deg = GlobalContext.lambdaGatesProperties.polarAngle;
        let oldAzimuthAngle_deg = GlobalContext.lambdaGatesProperties.azimuthAngle;

        // Mevcut polar ve azimuth açılarını radian cinsine çevir
        let oldPolarAngle_rad = THREE.MathUtils.degToRad(oldPolarAngle_deg);
        let oldAzimuthAngle_rad = THREE.MathUtils.degToRad(oldAzimuthAngle_deg);
        let polarAngle_rad = THREE.MathUtils.degToRad(angle);

        // TODO: X, Y ve Z ddeğerlerini zaten biliyoruz hesaplamaya gerek yok!!!
        // Başlangıçtaki Kartezyen koordinatlar
        let x = Math.sin(oldPolarAngle_rad) * Math.cos(oldAzimuthAngle_rad);
        let y = Math.sin(oldPolarAngle_rad) * Math.sin(oldAzimuthAngle_rad);
        let z = Math.cos(oldPolarAngle_rad);

        let Rx = [
            [1, 0, 0],
            [0, Math.cos(polarAngle_rad), -Math.sin(polarAngle_rad)],
            [0, Math.sin(polarAngle_rad), Math.cos(polarAngle_rad)]
        ];

        let Ry = [
            [Math.cos(polarAngle_rad), 0, Math.sin(polarAngle_rad)],
            [0, 1, 0],
            [-Math.sin(polarAngle_rad), 0, Math.cos(polarAngle_rad)]
        ];

        let Rz = [
            [Math.cos(polarAngle_rad), -Math.sin(polarAngle_rad), 0],
            [Math.sin(polarAngle_rad), Math.cos(polarAngle_rad), 0],
            [0, 0, 1]
        ];

        let rax = rAxis.x === 1 ? Rx : rAxis.y === 1 ? Ry : Rz;

        let originalCoords = [x, y, z];

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
        let newPolarAngle_rad = Math.acos(z_new / r);
        let newAzimuthAngle_rad = Math.atan2(y_new, x_new);

        // Yeni açılar (derece cinsinden)
        let newPolarAngle_deg = (Math.round(THREE.MathUtils.radToDeg(newPolarAngle_rad)) + 360) % 360;
        let newAzimuthAngle_deg = (Math.round(THREE.MathUtils.radToDeg(newAzimuthAngle_rad)) + 360) % 360;

        GlobalContext.blochSphereStateProperties.theta = newPolarAngle_deg;
        GlobalContext.lambdaGatesProperties.polarAngle = newPolarAngle_deg;
        GlobalContext.blochSphereStateProperties.phi = newAzimuthAngle_deg;
        GlobalContext.lambdaGatesProperties.azimuthAngle = newAzimuthAngle_deg;

        $("#polar-angle-content").html(`${newPolarAngle_deg}<span>&#176;</span>`);
        $("#polar-angle").val(newPolarAngle_deg);
        $("#azimuth-angle-content").html(`${newAzimuthAngle_deg}<span>&#176;</span>`);
        $("#azimuth-angle").val(newAzimuthAngle_deg);

        GlobalContext.blochSphere.resetBlochSphereState(newPolarAngle_deg, newAzimuthAngle_deg);

        BlochSphereEventsNamespace.updateBlochSphereState();
    },

    basisStateButtonOnClickEvent: function(basisStateButtonId) {
        let polar = GlobalContext.basisStatesProperties[basisStateButtonId].x;
        let azimuth = GlobalContext.basisStatesProperties[basisStateButtonId].y;

        GlobalContext.blochSphereStateProperties.theta = polar;
        GlobalContext.lambdaGatesProperties.polarAngle = polar;
        GlobalContext.blochSphereStateProperties.phi = azimuth;
        GlobalContext.lambdaGatesProperties.azimuthAngle = azimuth;

        $("#polar-angle-content").html(`${polar}<span>&#176;</span>`);
        $("#polar-angle").val(polar);
        $("#azimuth-angle-content").html(`${azimuth}<span>&#176;</span>`);
        $("#azimuth-angle").val(azimuth);

        GlobalContext.blochSphere.resetBlochSphereState(polar, azimuth);

        BlochSphereEventsNamespace.updateBlochSphereState();
    },

    axisBasedRotationButtonOnClickEvent: function(axis) {
        let angle = parseInt($("#" + axis + "-value").val());

        let rAxis = axis === "x-axis-rotation" ? new Vector3(1, 0, 0) : axis === "y-axis-rotation" ? new Vector3(0, 1, 0) : new Vector3(0, 0, 1);

        //BlochSphereEventsNamespace.startBlochSphereOperation(new QuantumGate(rAxis.x, rAxis.y, rAxis.z, angle));

        let oldPolarAngle_deg = GlobalContext.lambdaGatesProperties.polarAngle;
        let oldAzimuthAngle_deg = GlobalContext.lambdaGatesProperties.azimuthAngle;

        // Mevcut polar ve azimuth açılarını radian cinsine çevir
        let oldPolarAngle_rad = THREE.MathUtils.degToRad(oldPolarAngle_deg);
        let oldAzimuthAngle_rad = THREE.MathUtils.degToRad(oldAzimuthAngle_deg);
        let polarAngle_rad = THREE.MathUtils.degToRad(angle);

        // TODO: X, Y ve Z ddeğerlerini zaten biliyoruz hesaplamaya gerek yok!!!
        // Başlangıçtaki Kartezyen koordinatlar
        let x = Math.sin(oldPolarAngle_rad) * Math.cos(oldAzimuthAngle_rad);
        let y = Math.sin(oldPolarAngle_rad) * Math.sin(oldAzimuthAngle_rad);
        let z = Math.cos(oldPolarAngle_rad);

        let Rx = [
            [1, 0, 0],
            [0, Math.cos(polarAngle_rad), -Math.sin(polarAngle_rad)],
            [0, Math.sin(polarAngle_rad), Math.cos(polarAngle_rad)]
        ];

        let Ry = [
            [Math.cos(polarAngle_rad), 0, Math.sin(polarAngle_rad)],
            [0, 1, 0],
            [-Math.sin(polarAngle_rad), 0, Math.cos(polarAngle_rad)]
        ];

        let Rz = [
            [Math.cos(polarAngle_rad), -Math.sin(polarAngle_rad), 0],
            [Math.sin(polarAngle_rad), Math.cos(polarAngle_rad), 0],
            [0, 0, 1]
        ];

        let rax = axis === "x-axis-rotation" ? Rx : axis === "y-axis-rotation" ? Ry : Rz;

        let originalCoords = [x, y, z];

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
        let newPolarAngle_rad = Math.acos(z_new / r);
        let newAzimuthAngle_rad = Math.atan2(y_new, x_new);

        // Yeni açılar (derece cinsinden)
        let newPolarAngle_deg = (Math.round(THREE.MathUtils.radToDeg(newPolarAngle_rad)) + 360) % 360;
        let newAzimuthAngle_deg = (Math.round(THREE.MathUtils.radToDeg(newAzimuthAngle_rad)) + 360) % 360;

        GlobalContext.blochSphereStateProperties.theta = newPolarAngle_deg;
        GlobalContext.lambdaGatesProperties.polarAngle = newPolarAngle_deg;
        GlobalContext.blochSphereStateProperties.phi = newAzimuthAngle_deg;
        GlobalContext.lambdaGatesProperties.azimuthAngle = newAzimuthAngle_deg;

        $("#polar-angle-content").html(`${newPolarAngle_deg}<span>&#176;</span>`);
        $("#polar-angle").val(newPolarAngle_deg);
        $("#azimuth-angle-content").html(`${newAzimuthAngle_deg}<span>&#176;</span>`);
        $("#azimuth-angle").val(newAzimuthAngle_deg);

        GlobalContext.blochSphere.resetBlochSphereState(newPolarAngle_deg, newAzimuthAngle_deg);

        BlochSphereEventsNamespace.updateBlochSphereState();
    },
    
    customGateCreateButtonOnClickEvent: function() {
        if ($("#using-rotations-tab").hasClass("active")) {
            if (!($("#using-rotations-custom-gates-form")[0].checkValidity())) {
                $("#using-rotations-custom-gates-form").addClass("was-validated");
            }
            else {
                // get custom gate properties
                let x = $("#using-rotations-custom-gate-x").val();
                let y = $("#using-rotations-custom-gate-y").val();
                let z = $("#using-rotations-custom-gate-z").val();
                let rotation = $("#using-rotations-custom-gate-rotation").val();
    
                // create custom gate
                ToolboxEventsNamespace.createCustomQuantumGateUsingRotations(x, y, z, rotation);
    
                // reset custom quantum gate model 
                ToolboxEventsNamespace.resetCustomQuantumGateModels();
    
                // save workspace
                // NavbarEventsNamespace.saveWorkspace();
            }
        }
        else {
            if (!($("#using-matrix-custom-gates-form")[0].checkValidity())) {
                $("#using-matrix-custom-gates-form").addClass("was-validated");
            }
            else {
                // get custom gate properties
                let a11 = new Complex($("#using-matrix-custom-gate-a11-real").val(), $("#using-matrix-custom-gate-a11-img").val());
                let a12 = new Complex($("#using-matrix-custom-gate-a12-real").val(), $("#using-matrix-custom-gate-a12-img").val());
                let a21 = new Complex($("#using-matrix-custom-gate-a21-real").val(), $("#using-matrix-custom-gate-a21-img").val());
                let a22 = new Complex($("#using-matrix-custom-gate-a22-real").val(), $("#using-matrix-custom-gate-a22-img").val());
    
                // create custom gate
                ToolboxEventsNamespace.createCustomQuantumGateUsingMatrix(a11, a12, a21, a22);
    
                // reset custom quantum gate model 
                ToolboxEventsNamespace.resetCustomQuantumGateModels();
    
                // save workspace
                // NavbarEventsNamespace.saveWorkspace();
            }
        }
    },
    
    customGateOnClickEvent: function(customGateId) {
        BlochSphereEventsNamespace.startBlochSphereOperation(GlobalContext.customGatesProperties[customGateId]);
    },
    
    polarAngleOnInputChangeEvent: function() {
        let polarAngle = $("#polar-angle").val();
    
        // update html content
        $("#polar-angle-content").html(`${polarAngle}<span>&#176;</span>`);

        // save polar angle
        GlobalContext.lambdaGatesProperties.polarAngle = polarAngle;
        GlobalContext.blochSphereStateProperties.theta = polarAngle;

        GlobalContext.blochSphere.resetBlochSphereState(polarAngle, GlobalContext.lambdaGatesProperties.azimuthAngle);

        BlochSphereEventsNamespace.updateBlochSphereState();

        // save workspace
        // NavbarEventsNamespace.saveWorkspace();
    },
    
    azimuthAngleOnInputChangeEvent: function() {
        let azimuthAngle = $("#azimuth-angle").val();
    
        // update html content
        $("#azimuth-angle-content").html(`${azimuthAngle}<span>&#176;</span>`);
    
        // save azimuth angle
        GlobalContext.lambdaGatesProperties.azimuthAngle = azimuthAngle;
        GlobalContext.blochSphereStateProperties.phi = azimuthAngle;

        GlobalContext.blochSphere.resetBlochSphereState(GlobalContext.lambdaGatesProperties.polarAngle, azimuthAngle);

        BlochSphereEventsNamespace.updateBlochSphereState();

        // save workspace
        // NavbarEventsNamespace.saveWorkspace();
    },
    
    startToolboxEventListeners: function() {
        $("button[id$='builtInGate']").click(function () {
            ToolboxEventsNamespace.builtInGateButtonOnClickEvent($(this).attr("id"));
        });

        $("button[id$='state']").click(function () {
            ToolboxEventsNamespace.basisStateButtonOnClickEvent($(this).attr("id"));
        });

        $("button[id$='axis-rotation']").click(function () {
            ToolboxEventsNamespace.axisBasedRotationButtonOnClickEvent($(this).attr("id"));
        });
    
        $("#custom-gate-create").click(function () {
            ToolboxEventsNamespace.customGateCreateButtonOnClickEvent();
        });
    
        $("#custom-gates-section").on("click", ".quantum-gate", function () {
            ToolboxEventsNamespace.customGateOnClickEvent($(this).attr("id"));
        });
    
        $("#polar-angle").on("input change", function () {
            ToolboxEventsNamespace.polarAngleOnInputChangeEvent();
        });
    
        $("#azimuth-angle").on("input change", function () {
            ToolboxEventsNamespace.azimuthAngleOnInputChangeEvent();
        });
    
        $('#custom-gate-modal').on('hidden.bs.modal', function () {
            ToolboxEventsNamespace.resetCustomQuantumGateModels();
        });
    }
}


export {
    ToolboxEventsNamespace
}
