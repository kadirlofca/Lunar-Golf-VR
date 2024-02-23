/* CSC-495 Virtual Reality Lecture 2, Fall 2022
 * Author: Regis Kopper
 *
 * Based on
 * CSC 5619 Lecture 2, Fall 2020
 * Author: Evan Suma Rosenberg
 * 
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */

import {
    AbstractMesh, AssetsManager, CannonJSPlugin, Color3, DirectionalLight, float,
    HemisphericLight, HingeJoint, Logger, Matrix, ParticleSystem, PhysicsImpostor, PhysicsViewer,
    ShadowGenerator, Sound, SphereParticleEmitter, StandardMaterial, Texture, UniversalCamera, Vector3, WebXRCamera,
    WebXRControllerComponent, WebXRFeatureName, WebXRInputSource
} from "@babylonjs/core";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder"
import { SceneLoader } from "@babylonjs/core";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as Cannon from "cannon";

import "@babylonjs/core/Loading/Plugins/babylonFileLoader";
import "@babylonjs/loaders/OBJ/objFileLoader";

//Import from files
import Controller from '../src/controller';
import Dev_Scene from '../src/scene';
import Ball from '../src/ball';
import Club from '../src/club';
import Sounds from './sound';
//import { clubGrabbox } from "../src/club";
//import { grab } from "../src/club";

class Game {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;

    private xrCamera: WebXRCamera | null;
    private leftController: WebXRInputSource | null;
    private rightController: WebXRInputSource | null;

    private rightGrabbedObject: AbstractMesh | null;
    private leftGrabbedObject: AbstractMesh | null;
    private grabbableObjects: Array<AbstractMesh>;

    private club: Club | null;
    private ball: Ball | null;

    private sounds: Sounds;

    private controller: Controller | null;
    private dev_scene: Dev_Scene;

    private pointParticle: ParticleSystem;

    //private permanentElements: Array<any>;

    constructor() {
        // Get the canvas element 
        this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

        // Generate the BABYLON 3D engine
        this.engine = new Engine(this.canvas, true);

        // Creates a basic Babylon Scene object
        this.scene = new Scene(this.engine);

        this.xrCamera = null;
        this.leftController = null;
        this.rightController = null;

        this.rightGrabbedObject = null;
        this.leftGrabbedObject = null;
        this.grabbableObjects = [];

        this.club = null;
        this.ball = null;

        this.controller = null;
        this.sounds = new Sounds(this.scene);
        this.dev_scene = new Dev_Scene(this.scene, this.sounds);
        this.sounds.playSilence();

        //Point particle
        this.pointParticle = new ParticleSystem("pointParticles", 500, this.scene);
        this.pointParticle.particleTexture = new Texture("assets/textures/flare.png");
        this.pointParticle.targetStopDuration = 4;
        this.pointParticle.particleEmitterType = new SphereParticleEmitter(0.1, 0, .9);
        this.pointParticle.minSize = 1;
        this.pointParticle.maxSize = 2;
        this.pointParticle.minLifeTime = 0.8;
        this.pointParticle.maxLifeTime = 1.5;
        this.pointParticle.minEmitPower = 4;
        this.pointParticle.maxEmitPower = 7;
        this.pointParticle.updateSpeed = 0.1;
    }

    start(): void {
        // Create the scene and then execute this function afterwards
        this.createScene().then(() => {

            // Register a render loop to repeatedly render the scene
            this.engine.runRenderLoop(() => {
                this.update();
                this.scene.render();
            });

            // Watch for browser/canvas resize events
            window.addEventListener("resize", () => {
                this.engine.resize();
            });
        });
    }

    private async createScene() {
        // This creates and positions a first-person camera (non-mesh)
        var camera = new UniversalCamera("camera1", new Vector3(0, 1.6, -0.5), this.scene);
        camera.rotation = new Vector3(0, 270 * (Math.PI / 180), 0);
        camera.fov = 90 * Math.PI / 180;

        // This attaches the camera to the canvas
        camera.attachControl(this.canvas, true);

        // Creates the XR experience helper
        const xrHelper = await this.scene.createDefaultXRExperienceAsync({});

        // Assigns the web XR camera to a member variable
        this.xrCamera = xrHelper.baseExperience.camera;

        // Creates a default skybox
        const environment = this.scene.createDefaultEnvironment({
            createGround: true,
            groundSize: 2000,
            skyboxSize: 8000,
            skyboxColor: new Color3(0, 0, 0)
        });

        //Add Gravity (can be set again in individual scenes)
        this.scene.enablePhysics(new Vector3(0, -9.81, 0), new CannonJSPlugin(true, undefined, Cannon));
        this.scene.getPhysicsEngine()?.setSubTimeStep(1);

        // Create an invisible ground for physics collisions and teleportation
        xrHelper.teleportation.addFloorMesh(environment!.ground!);
        environment!.ground!.isVisible = false;
        environment!.ground!.position = new Vector3(0, 0, 0);
        environment!.ground!.setParent(null);

        //Set environement vars as permenant
        this.dev_scene.permenantElements.push(environment!.ground!);
        this.dev_scene.permenantElements.push(environment!.skybox!);
        this.dev_scene.permenantElements.push(environment!.skybox!.parent);
        this.dev_scene.permenantElements.push(xrHelper.teleportation.teleportationTargetMesh);
        this.dev_scene.permenantElements = this.dev_scene.permenantElements.concat(xrHelper.teleportation.teleportationTargetMesh!.getChildren(undefined, false))

        xrHelper.input.onControllerAddedObservable.add(async (inputSource) => {
            if (inputSource.uniqueId.endsWith("left")) {
                //Set
                this.leftController = inputSource;

                //Set in Permanent
                setTimeout(() => {
                    this.dev_scene.permenantElements.push(this.leftController!.grip!)
                    this.dev_scene.permenantElements.push(this.leftController!.pointer!)
                    this.dev_scene.permenantElements = this.dev_scene.permenantElements.concat(this.leftController!.grip!.getChildren(undefined, false))
                    this.dev_scene.permenantElements = this.dev_scene.permenantElements.concat(this.leftController!.pointer!.getChildren(undefined, false))
                    console.log(this.dev_scene.permenantElements = this.dev_scene.permenantElements.concat(this.leftController!.grip!.getChildren(undefined, false)));
                }, 500);

                //Create controller
                if (this.rightController != null) this.controller = new Controller(this.scene, this.leftController!, this.rightController!, this.rightGrabbedObject!, this.leftGrabbedObject!, this.grabbableObjects, this.club!, this.ball!);
            }
            else {
                this.rightController = inputSource;

                //Set as permanent
                setTimeout(() => {
                    this.dev_scene.permenantElements.push(this.rightController!.grip!)
                    this.dev_scene.permenantElements.push(this.rightController!.pointer!)
                    this.dev_scene.permenantElements = this.dev_scene.permenantElements.concat(this.rightController!.grip!.getChildren(undefined, false))
                    this.dev_scene.permenantElements = this.dev_scene.permenantElements.concat(this.rightController!.pointer!.getChildren(undefined, false))
                }, 500);

                //Create controller
                if (this.leftController != null) this.controller = new Controller(this.scene, this.leftController!, this.rightController!, this.rightGrabbedObject!, this.leftGrabbedObject!, this.grabbableObjects, this.club!, this.ball!);
            }
        });



        //Create Ball and Club (needs to be in every scene)
        //Create "club"
        this.club = new Club(this.scene, this.dev_scene);
        this.grabbableObjects.push(this.club.getMesh());
        //this.dev_scene.permenantElements.push(this.club.getMesh());

        //Create "ball"
        this.ball = new Ball(this.scene, this.sounds, this.club);
        this.dev_scene.permenantElements.push(this.ball.getMesh());

        //Create Scene
        this.dev_scene.createScene(this.club, this.ball, environment!, 1);

        //Debug
        this.scene.debugLayer.show();
    }

    private update(): void {
        //Controller Input
        this.controller?.processControllerInput();

        //Get Ball Distance
        this.ball?.calcDistance();

        //Apply ball friction
        this.ball?.applyFriction();

        //Check targets + Holes
        this.dev_scene.getTargets().forEach(target => {
            var targetMesh = target.getMesh().getChildMeshes()[0];
            if (targetMesh != undefined)
            {
                if (targetMesh.intersectsMesh(this.ball!.getMesh(), true))
                {
                    if (target.cooldown == false)
                    {
                        //Set Points
                        this.dev_scene.addPoints(target.getPoints())
                        this.sounds.playTargetHit();
                        target.setCooldown();

                        //Play particle
                        this.pointParticle.emitter = new Vector3(this.ball!.getMesh().position.x, this.ball!.getMesh().position.y, this.ball!.getMesh().position.z);
                        this.pointParticle.color1 = Color3.Random().toColor4();
                        this.pointParticle.color2 = Color3.Random().toColor4();
                        this.pointParticle.start();
                    }
                }
            }

        });

        this.dev_scene.getHoles().forEach(hole => {
            if (hole.getMeshCollider().intersectsMesh(this.ball!.getMesh(), true))
            {
                if (Math.abs(this.ball!.getMesh().physicsImpostor!.getLinearVelocity()!.x) < .25 && hole.cooldown == false)
                {
                    //Set Points
                    this.dev_scene.addPoints(hole.getPoints())
                    this.sounds.playTargetHit();
                    hole.cooldown = true;

                    //Play particle
                    this.pointParticle.emitter = new Vector3(this.ball!.getMesh().position.x, this.ball!.getMesh().position.y, this.ball!.getMesh().position.z);
                    this.pointParticle.color1 = Color3.Random().toColor4();
                    this.pointParticle.color2 = Color3.Random().toColor4();
                    this.pointParticle.start();
                }
            }
            else
            {
                //Reset
                if (hole.cooldown == true)
                {
                    //Set Reset
                    hole.setCooldown();
                }
            }
        });

        //Claps (for good run)
        this.dev_scene.updateBest(this.ball!);
    }
}
/******* End of the Game class ******/

// start the game
var game = new Game();
game.start();
