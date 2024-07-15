import * as THREE from '../libs/three/three.module.js';

import {
    GlobalContext
} from "../context.js";

import {
    ToolboxEventsNamespace
} from "./toolbox.js";

import { 
    NavbarEventsNamespace 
} from "./navbar.js";


var BlochSphereEventsNamespace = {
    updateBlochSphereState: function() {
        // get bloch sphere state
        let blochSphereState = GlobalContext.blochSphere.blochSphereState;
    
        // update theta & phi
        $("#bloch-sphere-state-theta").html(blochSphereState.theta.toString());
        $("#bloch-sphere-state-phi").html(blochSphereState.phi.toString());

        // update alpha & beta
        $("#bloch-sphere-state-alpha").html(blochSphereState.alpha.toString());
        $("#bloch-sphere-state-beta").html(blochSphereState.beta.toString());

        // update alpha^2 & beta^2
        $("#bloch-sphere-state-alpha2").html(blochSphereState.alpha2.toString());
        $("#bloch-sphere-state-beta2").html(blochSphereState.beta2.toString());

        // update x, y & z
        $("#bloch-sphere-state-x").html(blochSphereState.x.toString());
        $("#bloch-sphere-state-y").html(blochSphereState.y.toString());
        $("#bloch-sphere-state-z").html(blochSphereState.z.toString());
    },
    
    blochSphereOperation: function() {
        if (GlobalContext.blochSphereOperation.inProgress) {
            if (GlobalContext.blochSphereOperation.rotation === 0) {
                // set inProgress flag to false
                GlobalContext.blochSphereOperation.inProgress = false;
    
                // get blochSphere state
                // let blochSphereState = GlobalContext.blochSphere.blochSphereState;
    
                // save theta & phi
                // GlobalContext.blochSphereStateProperties.theta = blochSphereState.theta;
                // GlobalContext.blochSphereStateProperties.phi = blochSphereState.phi;

                // disable quantum gates
                ToolboxEventsNamespace.enableQuantumGates();

                // save workspace
                // NavbarEventsNamespace.saveWorkspace();
            }
            else {
                if (GlobalContext.blochSphereOperation.rotation > 0) {
                    // apply delta quantum operation
                    GlobalContext.blochSphereOperation.rotation -= 1;
                    GlobalContext.blochSphere.updateBlochSphereState(GlobalContext.blochSphereOperation.rotationAxis, THREE.MathUtils.degToRad(1));
                }
                else {
                    // apply delta quantum operation
                    GlobalContext.blochSphereOperation.rotation += 1;
                    GlobalContext.blochSphere.updateBlochSphereState(GlobalContext.blochSphereOperation.rotationAxis, THREE.MathUtils.degToRad(-1));
                }
    
                // update bloch sphere state
                BlochSphereEventsNamespace.updateBlochSphereState();
            }
        }
    },
    
    startBlochSphereOperation: function(gate) {
        // disable quantum gates
        ToolboxEventsNamespace.disableQuantumGates();
    
        // set inProgress flag to true
        GlobalContext.blochSphereOperation.inProgress = true;
    
        // set rotationAxis and rotation
        GlobalContext.blochSphereOperation.rotationAxis = gate.rotationAxis;
        GlobalContext.blochSphereOperation.rotation = gate.rotation
    }
}


export {
    BlochSphereEventsNamespace
}
