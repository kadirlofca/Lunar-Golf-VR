
import { AbstractMesh, ArcFollowCamera, CannonJSPlugin, Color3, Color4, DirectionalLight, EnvironmentHelper, FollowCamera, HemisphericLight, IShadowLight, MeshBuilder, Nullable, PhysicsImpostor, PhysicsViewer, RenderTargetTexture, Scene, SceneLoader, ShadowGenerator, Sound, StandardMaterial, Texture, UniversalCamera, Vector3 } from "@babylonjs/core";
import { colorPixelShader } from "@babylonjs/core/Shaders/color.fragment";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { GUI3DManager } from "@babylonjs/gui/3D/gui3DManager";
import { Button3D } from "@babylonjs/gui/3D/controls/button3D"
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock"
import Ball from "./ball";
import Club from "./club";
import Target from "./target";
import Hole from "./hole";
import Sounds from './sound';

export default class Dev_Scene {
    private scene: Scene;
    private points: number;
    private bestPoints: number;
    private bestPointsArray: Array<number>;
    private bestDistance: number;
    private bestDistanceArray: Array<number>;
    private newRecord: boolean;
    private targets: Array<Target>;
    public permenantElements: Array<any>
    private currentScene: number;
    private created: Boolean;
    private ground: AbstractMesh | null;
    private light: HemisphericLight | null;
    private holes: Array<Hole>;
    private sounds: Sounds;
    private ballRenderTarget: RenderTargetTexture | null;

    constructor(scene: Scene, sounds: Sounds) {
        this.scene = scene;
        this.points = 0;
        this.bestPoints = 0;
        this.bestPointsArray = [0, 500, 500, 350, 350];
        this.bestDistance = 500;
        this.bestDistanceArray = [0, 750, 1000, 350, 5000];
        this.newRecord = false;
        this.targets = [];
        this.permenantElements = [];
        this.currentScene = 0;
        this.created = false;
        this.ground = null;
        this.light = null;
        this.holes = [];
        this.sounds = sounds;
        this.ballRenderTarget = null;
    }

    //Create Scene
    public createScene(parentClub: Club, parentBall: Ball, parentEnvironment: Nullable<EnvironmentHelper>, num = 0) {
        //Vars
        let sceneNum = num;
        let club = parentClub;
        let ball = parentBall;
        let environment = parentEnvironment;
        this.currentScene = num;

        //Set Points
        this.bestPoints = this.bestPointsArray[num];
        this.bestDistance = this.bestDistanceArray[num];
        this.points = 0;

        //Items that are created in all
        if (this.created == false) {
            //Create ground
            this.ground = MeshBuilder.CreateGround("ground", {width: 7500, height: 7500}, this.scene);
            this.ground.physicsImpostor = new PhysicsImpostor(this.ground, PhysicsImpostor.BoxImpostor, {mass:0, friction: .5, restitution: 0.9}, this.scene)
            this.ground.receiveShadows = true;
            this.permenantElements.push(this.ground);

            // Playing area
            SceneLoader.ImportMesh("", "././assets/models/", "playing_area.glb", this.scene, (meshes) => {
                //Standard Ground Material
                let t_platform_emissive = new Texture("assets/textures/t_logo_emissive.png");
                let t_platform = new Texture("assets/textures/t_logo.png");
                let m_platform = new StandardMaterial("m_platform", this.scene);
                m_platform.diffuseTexture = t_platform;
                m_platform.emissiveTexture = t_platform_emissive;
                m_platform.diffuseColor = Color3.White();
                m_platform.specularColor = Color3.Black();

                meshes[1].scaling = new Vector3(1.6, 1, 1.6);
                meshes[1].material = m_platform;
                this.permenantElements.push(meshes[0]);
                this.permenantElements.push(meshes[1]);
                this.permenantElements.push(meshes[2]);
            });

            //Create Light
            this.light = new HemisphericLight("ambient", Vector3.Up(), this.scene);
            this.light.intensity = 1.0;
            this.light.diffuse = new Color3(.75, .75, .75);
            
            //GUI
            this.addGUI(club, ball, environment!);

            // Add small flags
            let t_flag = new Texture("assets/textures/t_smallflag.png");
            let m_smallflag = new StandardMaterial("m_smallflag", this.scene);
            m_smallflag.specularColor = Color3.Black();
            m_smallflag.emissiveTexture = t_flag;
            m_smallflag.diffuseTexture = t_flag;

            let small_flags = new TransformNode("small_flags", this.scene);
            for(let i = 0.5; i < 50; i++){            
                SceneLoader.ImportMesh("", "././assets/models/", "small_flag.glb", this.scene, (meshes) => {
                    meshes[1].position.x = i * 20;
                    meshes[1].position.z = 5;
                    meshes[1].material = m_smallflag;

                    meshes[0].parent = small_flags;
                    this.permenantElements.push(meshes[0]);
                    this.permenantElements.push(meshes[1]);
                });
            }

            // Sun
            let sun = MeshBuilder.CreateSphere("sun", {segments: 16, diameter: 500});
            sun.position = new Vector3(3000, 4000, 4000);
            let m_sun = new StandardMaterial("m_sun", this.scene);
            m_sun.emissiveColor = Color3.Yellow();
            m_sun.specularColor=Color3.Black();
            m_sun.diffuseColor=Color3.Black();
            sun.material = m_sun;

            //Set (so these aren't created again)
            this.created = true;
        }

        //Create attribute based on scene num
        switch (sceneNum) {
            //Dev Scene
            case 0:
                //Apply Gravity
                this.scene._physicsEngine?.setGravity(new Vector3(0, -9.81, 0));

                //Create a new texture based on a local file: grid.png
                let gridTexture = new Texture("assets/textures/grid.png");

                //Targets
                this.targets.push(new Target(this.scene, 20, new Vector3(-43, 20, -50), this.degreeToRadians(60), 100));
                this.targets.push(new Target(this.scene, 20, new Vector3(-80, 50, 75), this.degreeToRadians(300), 200));

                //Scale the grid texture to be 100x100 aka 1 grid per unit in Babylon becasue our ground is 100x100
                gridTexture.uScale = 100;
                gridTexture.vScale = 100;

                //Create a new Material, name it 'groundMaterial'. Add it to the scene.
                let groundMaterial = new StandardMaterial("groundMaterial", this.scene);

                //Set the visible texture of 'groundMaterial' to gridTexture
                groundMaterial.diffuseTexture = gridTexture;
                this.ground!.material = groundMaterial;
                break;

            //Moon Scene
            case 1:
                //Apply Gravity
                this.scene._physicsEngine?.setGravity(new Vector3(0, -1.62, 0));

                // Set Ground position
                // Why 100?
                // 2000x2000 plane, 10 UVs. 2000/10=200. 200/2=100.
                // Position (100, 0, 100) is the center of one of the repeated textures on the ground.
                this.ground!.position.x = 100;
                this.ground!.position.z = 100;

                // Get moon texture
                let t_moon = new Texture("assets/textures/t_moon.jpg");
                t_moon.uScale = 10;
                t_moon.vScale = 10;

                //Standard Ground Material
                let m_moon = new StandardMaterial("m_moon", this.scene);
                m_moon.diffuseTexture = t_moon;
                m_moon.specularColor = Color3.Black();
                this.ground!.material = m_moon;

                //Add Targets
                this.targets.push(new Target(this.scene, 8, new Vector3(-45, 15, -45), this.degreeToRadians(-15), 100));
                this.targets.push(new Target(this.scene, 8, new Vector3(-125, 20, 65), this.degreeToRadians(-30), 200));
                this.targets.push(new Target(this.scene, 8, new Vector3(-200, 30, 0), this.degreeToRadians(-5), 300));
            
                // Add a hole using default parameter values where available (size & color set to default values)
                this.holes.push(new Hole(this.scene, new Vector3(-50, 5, -20), new Vector3(0, 0, 0), 75, 20));
                this.holes.push(new Hole(this.scene, new Vector3(-150, 5, 35), new Vector3(0, 0, 0), 250, 25, new Color4(0, .6, 1, 0)));

                // Begin hole animations
                this.holes.forEach((hole) => {
                    hole.getMeshes().forEach((mesh) => {
                        this.scene.beginAnimation(mesh, 0, 90, true);
                    })
                });

                // Add background visuals.
                SceneLoader.ImportMesh("", "././assets/models/", "moon_crater.glb", this.scene, (meshes) => {
                    meshes[0].scaling = new Vector3(15, 15, 15);

                    // Get moon texture
                    let t_crater = new Texture("assets/textures/t_moon.jpg");
                    t_crater.uScale = 1;
                    t_crater.vScale = 1;

                    //Standard Ground Material
                    let m_crater = new StandardMaterial("m_moon", this.scene);
                    m_crater.diffuseTexture = t_crater;
                    m_crater.specularColor = Color3.Black();

                    meshes.forEach(mesh => {
                        mesh.material = m_crater;
                    });
                });

                //Dome
                var m_dome = new StandardMaterial("m_dome", this.scene);
                m_dome.diffuseColor = Color3.FromHSV(0, 0, 0.6);
                SceneLoader.ImportMesh("", "././assets/models/", "dome.glb", this.scene, (meshes) => {
                    meshes[0].scaling = new Vector3(300, 300, 300);
                    meshes[0].position.x = -200;
                    meshes[2].material = m_dome;
                });

            break;

            //Mars
            case 2:
                //Apply Gravity
                this.scene._physicsEngine?.setGravity(new Vector3(0, -3.721, 0));
                
                // Set Ground position
                this.ground!.position.x = 100;
                this.ground!.position.z = 100;

                // Get moon texture
                let t_mars = new Texture("assets/textures/t_mars.jpg");
                t_mars.uScale = 10;
                t_mars.vScale = 10;

                //Standard Ground Material
                let m_mars = new StandardMaterial("m_moon", this.scene);
                m_mars.diffuseTexture = t_mars;
                m_mars.specularColor = Color3.Black();
                this.ground!.material = m_mars;

                //Add Targets
                this.targets.push(new Target(this.scene, 6, new Vector3(-25, 15, 25), this.degreeToRadians(45), 100)); //Right 1
                this.targets.push(new Target(this.scene, 6, new Vector3(-25, 15, -25), this.degreeToRadians(-35), 100)); //Left 1
                this.targets.push(new Target(this.scene, 10, new Vector3(-100, 20, 45), this.degreeToRadians(-35), 200)); //Left 1
                this.targets.push(new Target(this.scene, 10, new Vector3(-100, 20, -45), this.degreeToRadians(45), 200)); //Left 1

                // Add a hole using default parameter values where available (size & color set to default values)
                this.holes.push(new Hole(this.scene, new Vector3(-100, 5, 0), new Vector3(0, 0, 0), 50, 30));

                // Begin hole animations
                this.holes.forEach((hole) => {
                    hole.getMeshes().forEach((mesh) => {
                        this.scene.beginAnimation(mesh, 0, 90, true);
                    })
                });

                // Add background visuals.
                SceneLoader.ImportMesh("", "././assets/models/", "moon_crater.glb", this.scene, (meshes) => {
                    meshes[0].scaling = new Vector3(15, 15, 15);

                    // Get moon texture
                    let t_crater = new Texture("assets/textures/t_mars.jpg");
                    t_crater.uScale = 1;
                    t_crater.vScale = 1;

                    //Standard Ground Material
                    let m_crater = new StandardMaterial("m_moon", this.scene);
                    m_crater.diffuseTexture = t_crater;
                    m_crater.specularColor = Color3.Black();

                    meshes.forEach(mesh => {
                        mesh.material = m_crater;
                    });
                });

                //Dome
                var m_dome = new StandardMaterial("m_dome", this.scene);
                m_dome.diffuseColor = Color3.FromHSV(0, 0, 0.6);
                SceneLoader.ImportMesh("", "././assets/models/", "dome.glb", this.scene, (meshes) => {
                    meshes[0].scaling = new Vector3(300, 300, 300);
                    meshes[0].position.x = -200;
                    meshes[2].material = m_dome;
                });


            break;

            //Jupiter
            case 3:
                //Apply Gravity
                this.scene._physicsEngine?.setGravity(new Vector3(0, -24.79, 0));
                
                // Set Ground position
                this.ground!.position.x = 100;
                this.ground!.position.z = 100;

                // Get moon texture
                let t_jupiter = new Texture("assets/textures/t_jupiter.jpg");
                t_jupiter.uScale = 10;
                t_jupiter.vScale = 10;

                //Standard Ground Material
                let m_jupiter = new StandardMaterial("m_moon", this.scene);
                m_jupiter.diffuseTexture = t_jupiter;
                m_jupiter.specularColor = Color3.Black();
                this.ground!.material = m_jupiter;

                //Add Targets
                this.targets.push(new Target(this.scene, 3, new Vector3(-10, 6, -15), this.degreeToRadians(-15), 25));
                this.targets.push(new Target(this.scene, 3, new Vector3(-10, 6, 15), this.degreeToRadians(-15), 25));
            
                // Add a hole using default parameter values where available (size & color set to default values)
                this.holes.push(new Hole(this.scene, new Vector3(-35, 5, -25), new Vector3(0, 0, 0), 50, 10));
                this.holes.push(new Hole(this.scene, new Vector3(-35, 5, 25), new Vector3(0, 0, 0), 50, 10));
                this.holes.push(new Hole(this.scene, new Vector3(-60, 5, -15), new Vector3(0, 0, 0), 100, 8, new Color4(0, .6, 1, 0)));
                this.holes.push(new Hole(this.scene, new Vector3(-60, 5, 15), new Vector3(0, 0, 0), 100, 8, new Color4(0, .6, 1, 0)));
                this.holes.push(new Hole(this.scene, new Vector3(-100, 5, 0), new Vector3(0, 0, 0), 200, 5, new Color4(.1, .1, 1, 0)));

                // Begin hole animations
                this.holes.forEach((hole) => {
                    hole.getMeshes().forEach((mesh) => {
                        this.scene.beginAnimation(mesh, 0, 90, true);
                    })
                });

                // Add background visuals.
                SceneLoader.ImportMesh("", "././assets/models/", "moon_crater.glb", this.scene, (meshes) => {
                    meshes[0].scaling = new Vector3(15, 15, 15);

                    // Get moon texture
                    let t_crater = new Texture("assets/textures/t_jupiter.jpg");
                    t_crater.uScale = 1;
                    t_crater.vScale = 1;

                    //Standard Ground Material
                    let m_crater = new StandardMaterial("m_moon", this.scene);
                    m_crater.diffuseTexture = t_crater;
                    m_crater.specularColor = Color3.Black();

                    meshes.forEach(mesh => {
                        mesh.material = m_crater;
                    });
                });

                //Dome
                var m_dome = new StandardMaterial("m_dome", this.scene);
                m_dome.diffuseColor = Color3.FromHSV(0, 0, 0.6);
                SceneLoader.ImportMesh("", "././assets/models/", "dome.glb", this.scene, (meshes) => {
                    meshes[0].scaling = new Vector3(250, 250, 250);
                    meshes[0].position.x = -200;

                    meshes[2].material = m_dome;
                });

            break;

            //Pluto
            case 4:
                //Apply Gravity
                this.scene._physicsEngine?.setGravity(new Vector3(0, -0.62, 0));
                
                // Set Ground position
                this.ground!.position.x = 100;
                this.ground!.position.z = 100;

                // Get moon texture
                let t_pluto = new Texture("assets/textures/t_pluto.jpg");
                t_pluto.uScale = 10;
                t_pluto.vScale = 10;

                //Standard Ground Material
                let m_pluto = new StandardMaterial("m_pluto", this.scene);
                m_pluto.diffuseTexture = t_pluto;
                m_pluto.specularColor = Color3.Black();
                this.ground!.material = m_pluto;

                //Add Targets
                this.targets.push(new Target(this.scene, 22, new Vector3(-125, 85, -250), this.degreeToRadians(-20), 50));
                this.targets.push(new Target(this.scene, 22, new Vector3(-125, 85, 250), this.degreeToRadians(-20), 50));
                this.targets.push(new Target(this.scene, 24, new Vector3(-300, 85, -150), this.degreeToRadians(-25), 100));
                this.targets.push(new Target(this.scene, 25, new Vector3(-300, 85, 150), this.degreeToRadians(-25), 100));
                this.targets.push(new Target(this.scene, 25, new Vector3(-500, 105, 0), this.degreeToRadians(-30), 250));
                
                // Add a hole using default parameter values where available (size & color set to default values)
                this.holes.push(new Hole(this.scene, new Vector3(-150, 5, 0), new Vector3(0, 0, 0), 10, 100));

                // Begin hole animations
                this.holes.forEach((hole) => {
                    hole.getMeshes().forEach((mesh) => {
                        this.scene.beginAnimation(mesh, 0, 90, true);
                    })
                });

                // Add background visuals.
                SceneLoader.ImportMesh("", "././assets/models/", "moon_crater.glb", this.scene, (meshes) => {
                    meshes[0].scaling = new Vector3(15, 15, 15);

                    // Get moon texture
                    let t_crater = new Texture("assets/textures/t_pluto.jpg");
                    t_crater.uScale = 1;
                    t_crater.vScale = 1;

                    //Standard Ground Material
                    let m_crater = new StandardMaterial("m_moon", this.scene);
                    m_crater.diffuseTexture = t_crater;
                    m_crater.specularColor = Color3.Black();

                    meshes.forEach(mesh => {
                        mesh.material = m_crater;
                    });
                });

                //Dome
                var m_dome = new StandardMaterial("m_dome", this.scene);
                m_dome.diffuseColor = Color3.FromHSV(0, 0, 0.6);
                SceneLoader.ImportMesh("", "././assets/models/", "dome.glb", this.scene, (meshes) => {
                    meshes[0].scaling = new Vector3(1000, 1000, 1000);
                    meshes[0].position.x = -200;
                    meshes[2].material = m_dome;
                });
            break;
        }
    }

    private addGUI(parentClub: Club, parentBall: Ball, parentEnvironment: EnvironmentHelper) {
        //Vars
        let club = parentClub;
        let ball = parentBall;
        let environment = parentEnvironment;

        //Gui Manager
        let guimanager = new GUI3DManager(this.scene);

        /*Controls (behind player)*/
        let controllerDiagram = MeshBuilder.CreatePlane("controllerDiagram", {width: 2, height: 1.25, size: 1}, this.scene);
        let controllerDiagramMaterial = new StandardMaterial("controllerDiagramMaterial", this.scene);
        let controllerDiagramTexture = new Texture("assets/textures/controls.png", this.scene);
        controllerDiagramMaterial.diffuseTexture = controllerDiagramTexture;
        controllerDiagramMaterial.emissiveTexture = controllerDiagramTexture;
        controllerDiagram.material = controllerDiagramMaterial;
        controllerDiagram.position = new Vector3(3, 1.5, -0.5);
        controllerDiagram.rotation.y = this.degreeToRadians(90);

        //Light (for ball shadow so you can actually perceive depth)
        let dirLight = new DirectionalLight("dirLight", new Vector3(0, -90, 0), this.scene);
        dirLight.position = new Vector3(ball.getMesh().position.x, ball.getMesh().position.y+5, ball.getMesh().position.z)
        dirLight.intensity = .25;

        //Shadows
        let shadows = new ShadowGenerator(1024, dirLight);
        shadows.addShadowCaster(ball.getMesh());

        /*Ball Camera*/
        let ballCamera = new FollowCamera("ballCamera", new Vector3(-2, 2, -2), this.scene, ball.getMesh());
        ballCamera.fov = this.degreeToRadians(45);
        ballCamera.radius = 5;
        ballCamera.heightOffset = 10;
        ballCamera.rotationOffset = 0;
        ballCamera.cameraAcceleration = .005;
        ballCamera.maxCameraSpeed = 10;
        this.permenantElements.push(ballCamera);

        this.ballRenderTarget = new RenderTargetTexture("ballRenderTarget", 1024, this.scene, true);
        this.ballRenderTarget.activeCamera = ballCamera;
        this.scene.customRenderTargets.push(this.ballRenderTarget);
        this.ballRenderTarget.onAfterRender = () => {
            ballCamera.position.x = ball.getMesh().position.x + 6;
            ballCamera.position.y = ball.getMesh().position.y + 1;
            ballCamera.position.z = ball.getMesh().position.z - (Math.sign(ball.getMesh().position.z) * (Math.abs(ball.getMesh().position.z/15)));
            dirLight.position = new Vector3(ball.getMesh().position.x, ball.getMesh().position.y+5, ball.getMesh().position.z)
        };

        let ballCameraPlane = MeshBuilder.CreatePlane("ballCameraPlane", {width: 1, height: 1}, this.scene);
        ballCameraPlane.position = new Vector3(-.5, 0.5, -2.05);
        ballCameraPlane.rotation.y = this.degreeToRadians(180);
        ballCameraPlane.addRotation(0.5,0.1,0);        
        var rttMaterial = new StandardMaterial("RTT material", this.scene);
        rttMaterial.emissiveTexture = this.ballRenderTarget;
        rttMaterial.diffuseTexture = this.ballRenderTarget;
        this.permenantElements.push(ballCameraPlane);

        //Push all meshes so things actually get rendered (can adjust if performance gets bad)
        //In a timeout to make sure everything gets created before it's rendered.
        this.scene.executeWhenReady(() => {
            console.log("ran");
            this.scene.meshes.forEach(mesh => {
                if (mesh.name != ballCameraPlane!.name)
                {
                    this.ballRenderTarget!.renderList!.push(mesh);
                }
            });
        });
        ballCameraPlane.material = rttMaterial;

        /*Distance Button*/
        let distanceButton = new Button3D("distanceButton");
        guimanager.addControl(distanceButton);
        let distanceButtonText = new TextBlock("distanceButtonText", `Distance: ${ball.getDistance()} M\nBest: ${this.bestDistance} M`);
        distanceButton.content = distanceButtonText;
        distanceButton.content.color = "white";
        distanceButton.content.fontSize = 24;
        distanceButton.position = new Vector3(-.5, 0.5, 2);
        distanceButton.mesh?.addRotation(0.5,-0.1,0);

        /*Points Button*/
        let pointButton = new Button3D("pointButton");
        guimanager.addControl(pointButton);
        let pointButtonText = new TextBlock("pointButtonText", `Points: ${this.points}\nBest: ${this.bestPoints}`);
        pointButton.content = pointButtonText;
        pointButton.content.color = "white";
        pointButton.content.fontSize = 24;
        pointButton.position = new Vector3(.75, 0.5, 2);
        pointButton.mesh?.addRotation(0.5,0.1,0);


        /*Level Select*/
        let levelName = ["Dev", "Moon", "Mars", "Jupiter", "Pluto"];
        let levelGrav = ["9.81", "1.62", "3.721", "24.79", "0.62"];
        let levelButton = new Button3D("pointButton");
        guimanager.addControl(levelButton);
        let levelButtonText = new TextBlock("levelButtonText", `Planet\n\n${levelName[this.currentScene]}\nGravity: ${levelGrav[this.currentScene]}`);
        levelButton.content = levelButtonText;
        levelButton.content.color = "white";
        levelButton.content.fontSize = 24;
        levelButton.position = new Vector3(.75, 0.5, -2);
        levelButton.mesh!.rotation.y = this.degreeToRadians(180);
        levelButton.mesh?.addRotation(0.5,-0.2,0);

        //Button Material
        let buttonColor = new Color3(.284, .73, .831);
        var buttonMaterial = <StandardMaterial>distanceButton.mesh!.material;
        buttonMaterial.diffuseColor = buttonColor;
        distanceButton.mesh!.material! = buttonMaterial;
        var buttonMaterial = <StandardMaterial>pointButton.mesh!.material;
        buttonMaterial.diffuseColor = buttonColor;
        pointButton.mesh!.material! = buttonMaterial;
        var buttonMaterial = <StandardMaterial>levelButton.mesh!.material;
        buttonMaterial.diffuseColor = buttonColor;
        levelButton.mesh!.material! = buttonMaterial;

        //On Click
        //Distance (reset ball)
        distanceButton.onPointerDownObservable.add(() => {
            ball.resetPosition();
        });

        //Points (reset points)
        pointButton.onPointerDownObservable.add(() => {
            this.resetPoints();
        });

        //Scene
        levelButton.onPointerDownObservable.add(() => {
            //Temporary num switch until I add better UI//
            if (this.light!.intensity >= .75)
            {
                let newScene = this.currentScene + 1;
                if (newScene > 4) newScene = 1;
                this.setNewScene(club, ball, environment, newScene);
            }
        });

        //Update Values
        distanceButton.content.onBeforeDrawObservable.add(() => {
            distanceButtonText.text = `Distance: ${ball.getDistance()} M\nBest: ${this.bestDistanceArray[this.currentScene]} M`;
            distanceButton.content = distanceButtonText;
        });

        var currentPoint = this.points;
        pointButton.content.onBeforeDrawObservable.add(() => {
            pointButtonText.text = `Points: ${this.points}\nBest: ${this.bestPointsArray[this.currentScene]}`;
            pointButton.content = pointButtonText;
        });

        levelButton.content.onBeforeDrawObservable.add(() => {
            levelButtonText.text = `Planet\n\n${levelName[this.currentScene]}\nGravity: ${levelGrav[this.currentScene]}`;
            levelButton.content = levelButtonText;
        });
    }

    public resetScene() {
        //Reset targets
        this.targets.forEach(target => {
            target.getMesh().dispose();
        });
        this.targets = [];

        //Reset Holes
        this.holes.forEach(hole => {
            hole.getMeshes().forEach(mesh => {
                mesh.dispose();
            });
        });
        this.holes = [];

        //Destroy Meshes
        this.scene.meshes.forEach(mesh => {             
            if (!this.permenantElements.includes(mesh))
            {
                mesh.dispose();
            }
        });    
        
        //Reset Points
        this.resetPoints();
    }

    public setNewScene(parentClub: Club, parentBall: Ball, parentEnvironment: Nullable<EnvironmentHelper>, num: number) {
        //Set Fade
        // Code to fade to black and back.
        var frame = 0;
        var startingColor = this.scene.clearColor.clone();
        var t;
        var action = this.scene.onBeforeRenderObservable.add(() => {
                frame += 1;
                t = .5 + Math.cos(frame / 20) / 2;
                this.light!.intensity = 0.75 * t;
                this.scene.getLightByName("dirLight")!.intensity = 0;
                Color4.LerpToRef(new Color4(1, 1, 1, 1), startingColor, t, this.scene.clearColor);
        });

        //Set wait
        setTimeout(() => {
            //Reset
            this.resetScene();
            this.createScene(parentClub, parentBall, parentEnvironment, num);
            parentBall.resetPosition();
            parentClub.resetPosition();

            //Set Render Target
            this.ballRenderTarget!.renderList = [];
            this.scene.meshes.forEach(mesh => {
                if (mesh.name != this.scene.getMeshByName("ballCameraPlane")?.name)
                {
                    this.ballRenderTarget!.renderList!.push(mesh);
                }
            });

            //Stop Fade
            setTimeout(() => {
                this.scene.onBeforeRenderObservable.remove(action);
                this.light!.intensity = .75;
                this.scene.getLightByName("dirLight")!.intensity = .25;
            }, 1000);
        }, 950);
    }

    public updateBest(ball: Ball)
    {
        //Update High Score
        if (this.points > this.bestPoints)
        {
            this.bestPoints = this.points;
            this.bestPointsArray[this.currentScene] = this.bestPoints;
            this.newRecord = true;
        } 

        //Update Best Distance
        if (ball.getDistance() > this.bestDistance)
        {
            this.bestDistance = ball.getDistance();
            this.bestDistanceArray[this.currentScene] = this.bestDistance;
            this.newRecord = true;
        } 

        //Claps (for when you have a good run, get best distance, or get high score)
        if ((ball.getPreviousPoints() < this.points || this.newRecord) && Math.abs(ball.getMesh().physicsImpostor!.getLinearVelocity()!.x) < .25)
        {
            this.sounds.playGoftClap();
            ball.setPreviousPoints(this.points);
            this.newRecord = false;
        }
    }

    private degreeToRadians(value: number)
    {
        return value * (Math.PI/180);
    }

    public getPoints(): Number {
        return this.points;
    }

    public addPoints(value: number) {
        this.points += value;
    }

    public resetPoints() {
        this.points = 0;
    }

    public getTargets(): Array<Target> {
        return this.targets;
    }

    public getHoles() : Array<Hole> {
        return this.holes;
    }
}