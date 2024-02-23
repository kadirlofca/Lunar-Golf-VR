import { AbstractMesh, Color3, Color4, MeshBuilder, PhysicsImpostor, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import Club from "./club";
import Sounds from "./sound";

export default class Ball {
    private ballOrigin: Vector3;
    private mesh: AbstractMesh;
    private distance: number;
    private scene: Scene;
    private previousPoints: number;
    private soundCooldown: boolean;

    constructor(scene: Scene, sounds: Sounds, club: Club)
    {
        //Set variables
        this.ballOrigin = new Vector3(-1, .2, 0);
        this.scene = scene;
        this.distance = 0;
        this.previousPoints = 0;
        this.soundCooldown = false;

        //Create Ball
        this.mesh = MeshBuilder.CreateSphere("ball", { diameter: .20 }, this.scene);
        this.mesh.position = this.ballOrigin;
        // Could add restitution to make it bouncy
        // Reference:
        // https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine#impostors
        this.mesh.physicsImpostor = new PhysicsImpostor(this.mesh, PhysicsImpostor.SphereImpostor, { mass: 5 }, this.scene);
        //this.mesh.physicsImpostor.physicsBody.linearDamping = 0.2; //This effects how far it flies

        const marker_color = new Color4(1, 0, 0, 1);
        const marker_colors = [
            marker_color, marker_color,
            marker_color, marker_color,
            marker_color, marker_color,
        ]
        const marker = MeshBuilder.CreateBox(
            "ball_marker",
            {
                height: 200,
                width: 10,
                depth: 10,
                faceColors: marker_colors,
            }
        );
        marker.visibility = 0.0;
        marker.setParent(this.mesh);

        //Ball Material
        let m_ball = new StandardMaterial("m_ball", this.scene);
        m_ball.diffuseColor = Color3.Green();
        this.mesh.material = m_ball;

        /*
        this.mesh.physicsImpostor.onCollideEvent = (other) => {
            if (this.soundCooldown == false)
            {
                this.soundCooldown = true;
                sounds.playGolfHit();
                setTimeout(() => {
                    this.soundCooldown = false;
                }, 1000);
            }
        }
        */
    }

    //Reset Position
    public resetPosition() {
        //Reset
        this.mesh.position = this.ballOrigin;
        this.soundCooldown = false;
        this.mesh.physicsImpostor!.setLinearVelocity(Vector3.Zero());
        this.mesh.physicsImpostor!.setAngularVelocity(Vector3.Zero());
    }

    //Set new origin (so you can move it depending on where you need it for the scene)
    public setBallOrigin(newOrigin: Vector3) {
        this.ballOrigin = newOrigin;
        this.resetPosition();
    }

    //Set Previous Points (for clapping)
    public setPreviousPoints(points: number)
    {
        this.previousPoints = points;
    }

    //Get Previous Points
    public getPreviousPoints() : number
    {
        return this.previousPoints;
    }

    //Calc Distance
    public calcDistance() {
        this.distance = Math.abs(Math.floor(this.mesh.position.x+.5 - this.ballOrigin.x));
        //console.log(this.distance);
    }

    public getDistance() : number
    {
        return this.distance;
    }

    //Get Mesh
    public getMesh(): AbstractMesh {
        return this.mesh;
    }

    //Get origin
    public getBallOrigin(): Vector3 {
        return this.ballOrigin;
    }

    //Apply Friction (in Babylon, spheres don't get friction applied because they don't have enough surface area, so we apply it manually)
    public applyFriction() {
        if (this.mesh.position.y < 0.125) {
            this.mesh.physicsImpostor!.setAngularVelocity(this.mesh.physicsImpostor!.getAngularVelocity()!.scale(.93));
        }
    }
}

// export line here