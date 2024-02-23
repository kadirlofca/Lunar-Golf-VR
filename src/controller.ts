import { AbstractMesh, Logger, PhysicsImpostor, Quaternion, Scene, TransformNode, Vector3, WebXRControllerComponent, WebXRInputSource } from "@babylonjs/core";
import Ball from "./ball";
import Club from "./club";

export default class Controller {
    private scene: Scene;
    private leftController: WebXRInputSource | null;
    private rightController: WebXRInputSource | null;

    private rightGrabbedObject: AbstractMesh | null;
    private leftGrabbedObject: AbstractMesh | null;
    private grabbableObjects: Array<AbstractMesh>;

    private lockRotation: Quaternion | null;
    private lockPosition: Vector3 | null;

    private club: Club | null;
    private ball: Ball | null;

    constructor(scene: Scene, leftController: WebXRInputSource, rightController: WebXRInputSource, rightGrabbedObject: AbstractMesh, leftGrabbedObject: AbstractMesh, grabbableObjects: Array<AbstractMesh>, club: Club, ball: Ball) {
        this.scene = scene;
        this.leftController = leftController;
        this.rightController = rightController;
        this.rightGrabbedObject = rightGrabbedObject;
        this.leftGrabbedObject = leftGrabbedObject;
        this.grabbableObjects = grabbableObjects;

        this.club = club;
        this.ball = ball;

        this.lockRotation = null;
        this.lockPosition = null;
    }

    public processControllerInput() {
        this.onLeftSqueeze(this.leftController?.motionController?.getComponent("xr-standard-squeeze"));
        this.onLeftTrigger(this.leftController?.motionController?.getComponent("xr-standard-trigger"));
        this.onLeftThumbstick(this.leftController?.motionController?.getComponent("xr-standard-thumbstick"));

        this.onRightSqueeze(this.rightController?.motionController?.getComponent("xr-standard-squeeze"));
        this.onRightTrigger(this.rightController?.motionController?.getComponent("xr-standard-trigger"));
        this.onRightThumbstick(this.rightController?.motionController?.getComponent("xr-standard-thumbstick"));
        this.onRightA(this.rightController?.motionController?.getComponent("a-button"));
        this.onLeftX(this.leftController?.motionController?.getComponent("x-button"));

        //console.log(this.rightController?.grip!.rotationQuaternion);
    }

    private focusBall() {
        //Focus on ball
        let controller = null;
        if (this.leftGrabbedObject != null) controller = this.leftController;
        else if (this.rightGrabbedObject != null) controller = this.rightController;

        //Get set rotation
        if (this.lockPosition == null || this.lockRotation == null) {
            this.lockPosition = new Vector3(controller!.grip!.position.x, controller!.grip!.position.y, controller!.grip!.position.z);
            //this.lockRotation = new Vector3 (controller!.pointer!.forward!.x, controller!.pointer!.forward!.y, controller!.pointer!.forward!.z);
            this.lockRotation = new Quaternion(controller!.grip!.rotationQuaternion!.x, controller!.grip!.rotationQuaternion!.y, controller!.grip!.rotationQuaternion!.z, controller!.grip!.rotationQuaternion!.w);
            //this.lockRotation = new Vector3(controller!.grip!.absoluteRotationQuaternion!.toEulerAngles().x, controller!.grip!.absoluteRotationQuaternion!.toEulerAngles().y, controller!.grip!.absoluteRotationQuaternion!.toEulerAngles().z);
            this.club!.getMesh().setAbsolutePosition(new Vector3(controller!.grip!.position.x, controller!.grip!.position.y - .425, controller!.grip!.position.z));
        }

        if (controller != null) {
            //Lock on axis
            //This is good enough for now, it could use some more refinement but it works.
            this.club!.getMesh().setAbsolutePosition(new Vector3(this.club!.getMesh().absolutePosition.x, this.club!.getMesh().absolutePosition.y, this.lockPosition.z));
        }
    }

    //Squeeze
    private onRightSqueeze(component?: WebXRControllerComponent) {
        if (component?.changes.pressed) {
            if (component?.pressed) {
                for (var i = 0; i < this.grabbableObjects.length && !this.rightGrabbedObject; i++) {
                    if (this.rightController!.grip!.intersectsMesh(this.grabbableObjects[i], true)) {
                        //Update if left
                        if (this.grabbableObjects[i] == this.leftGrabbedObject) this.leftGrabbedObject = null;

                        //Set Right
                        this.rightGrabbedObject = this.grabbableObjects[i];
                        this.rightGrabbedObject.physicsImpostor!.mass = 0;
                        this.rightGrabbedObject!.setParent(this.rightController!.grip!);
                    }
                }
            }
            else {
                if (this.rightGrabbedObject) {
                    this.rightGrabbedObject.setParent(null);
                    this.rightGrabbedObject.physicsImpostor?.dispose();
                    this.rightGrabbedObject.physicsImpostor = new PhysicsImpostor(this.rightGrabbedObject!, PhysicsImpostor.BoxImpostor, { mass: 5 }, this.scene);
                    this.rightGrabbedObject = null;
                }
            }
        }
    }

    private onLeftSqueeze(component?: WebXRControllerComponent) {
        if (component?.changes.pressed) {
            if (component?.pressed) {
                for (var i = 0; i < this.grabbableObjects.length && !this.leftGrabbedObject; i++) {
                    if (this.leftController!.grip!.intersectsMesh(this.grabbableObjects[i], true)) {
                        //Update if right
                        if (this.grabbableObjects[i] == this.rightGrabbedObject) this.rightGrabbedObject = null;

                        //Set Left
                        this.leftGrabbedObject = this.grabbableObjects[i];
                        this.leftGrabbedObject.physicsImpostor!.mass = 0;
                        this.leftGrabbedObject!.setParent(this.leftController!.grip!);
                    }
                }
            }
            else {
                if (this.leftGrabbedObject) {
                    this.leftGrabbedObject.setParent(null);
                    this.leftGrabbedObject.physicsImpostor?.dispose();
                    this.leftGrabbedObject.physicsImpostor = new PhysicsImpostor(this.leftGrabbedObject!, PhysicsImpostor.BoxImpostor, { mass: 5 }, this.scene);
                    this.leftGrabbedObject = null;
                }
            }
        }
    }

    private onLeftThumbstick(component?: WebXRControllerComponent) {
        if (component?.changes.pressed) {
            if (component?.pressed) {
                Logger.Log("left thumbstick pressed");
            }
            else {
                Logger.Log("left thumbstick released");
            }
        }

        if (component?.changes.axes) {
            Logger.Log("left thumbstick axes: (" + component.axes.x + "," + component.axes.y + ")");
        }
    }

    private onLeftTrigger(component?: WebXRControllerComponent) {
        if (component?.pressed) {
            if (this.leftGrabbedObject != null) {
                this.focusBall();
            }
        }

        if (component?.changes.pressed) {
            if (component?.pressed) {
                Logger.Log("left trigger pressed")
            }
            else {
                Logger.Log("left trigger released");
                if (this.leftGrabbedObject != null) {
                    this.leftGrabbedObject.setAbsolutePosition(new Vector3(this.leftController!.grip!.position.x, this.leftController!.grip!.position.y - .425, this.leftController!.grip!.position.z));
                }
                this.lockPosition = null;
                this.lockRotation = null;

            }
        }
    }

    private onRightTrigger(component?: WebXRControllerComponent) {
        if (component?.pressed) {
            if (this.rightGrabbedObject != null) {
                this.focusBall();
            }
        }

        if (component?.changes.pressed) {
            if (component?.pressed) {
                Logger.Log("right trigger pressed")
            }
            else {
                Logger.Log("right trigger released");
                if (this.rightGrabbedObject != null) {
                    this.rightGrabbedObject.setAbsolutePosition(new Vector3(this.rightController!.grip!.position.x, this.rightController!.grip!.position.y - .425, this.rightController!.grip!.position.z));
                }
                this.lockPosition = null;
                this.lockRotation = null;
            }
        }
    }

    private onRightA(component?: WebXRControllerComponent) {
        if (component?.changes.pressed) {
            if (component?.pressed) {
                Logger.Log("right A pressed");

                //Reset Position of Ball
                this.ball!.resetPosition();

            }
            else {
                Logger.Log("right A released");
            }
        }
    }

    private onLeftX(component?: WebXRControllerComponent)
    {  
        if(component?.changes.pressed)
        {
            if(component?.pressed)
            {
                this.club!.resetPosition();
                Logger.Log("Left X pressed");
            }
            else
            {
                Logger.Log("Left X released");
            }
        }
    }

    private onRightThumbstick(component?: WebXRControllerComponent) {
        if (component?.changes.pressed) {
            if (component?.pressed) {
                Logger.Log("right thumbstick pressed");
            }
            else {
                Logger.Log("right thumbstick released");
            }
        }

        if (component?.changes.axes) {
            Logger.Log("right thumbstick axes: (" + component.axes.x + "," + component.axes.y + ")");
        }
    }
}
