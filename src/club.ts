import {
    AbstractMesh, MeshBuilder, PhysicsImpostor, Vector3, WebXRControllerComponent,
    Scene, SceneLoader, Color4,
} from "@babylonjs/core";
import Dev_Scene from "./scene";

import Sounds from './sound';

//Create Club
export default class Club {
    private grab_collider: AbstractMesh;
    //private physics_collider: AbstractMesh;
    private scene: Scene;
    private clubOrigin: Vector3;

    private club_scale: number;

    constructor(scene: Scene, devScene: Dev_Scene) {
        //Set vars
        this.scene = scene;
        this.clubOrigin = new Vector3(-.5, 1.1, 0); // Originally -.5, .5, 0
        this.club_scale = 1;

        // Create Club Mesh
        const collider_visible = true; // DEBUG: Can show the club's collider if needed.
        const collider_transparency = 0;

        // AbstractMesh.visbility takes a number, so let's control whether it's visible or not with
        // `collider_visible` above
        const is_grab_collider_visible = collider_visible ? collider_transparency : 0;
        const grab_color = new Color4(1, 0.1, 0, 1); // Color format: rgba
        const grab_colors = [
            grab_color, grab_color, // Front & Back
            grab_color, grab_color, // Sides
            grab_color, grab_color, // Top & Bottom
        ];

        /*const is_physics_collider_visible = collider_visible ? collider_transparency : 0;
        const physics_color = new Color4(1, 0, 0, 1); // Color Format: rgba
        const physics_colors = [
            physics_color, physics_color, // Front & Back
            physics_color, physics_color, // Sides
            physics_color, physics_color, // Top & Bottom
        ];*/

        /*
        Create the grab collider as the root of the club mesh. I explain why in the comment above
        the club model import.
        */
        this.grab_collider = MeshBuilder.CreateBox(
            "club_collider_grab",
            {
                width: .5, // Original .22
                height: 1.1,
                depth: .3, // Original .1; .3 fixes it ball flying back mostly
                faceColors: grab_colors,
            },
            this.scene
        );
        this.grab_collider.visibility = is_grab_collider_visible; // DEBUG: Can show the collider if needed.
        this.grab_collider.scaling = new Vector3(this.club_scale, this.club_scale, this.club_scale);

        /*this.physics_collider = MeshBuilder.CreateBox(
            "club_collider_physics",
            {
                width: .25,
                height: .14,
                depth: .1,
                faceColors: physics_colors,
            },
            this.scene
        );
        this.physics_collider.setParent(this.grab_collider);
        this.physics_collider.visibility = is_physics_collider_visible;
        this.physics_collider.position = this.clubOrigin.add(new Vector3(0.43, -1.55, 0));
        this.physics_collider.scaling = new Vector3(this.club_scale, this.club_scale, this.club_scale);*/

        /*
        As of right now I can't figure out how to get meshes[1] (the club model) to persist outside
        of the `ImportMesh()` function. Setting something like `this.mesh = meshes[1]` doesn't work
        and ends up with a nullptr.
        
        Instead the solution I came up with is to have `club_model` (aka meshes[1]) to be the child
        of `this.grab_collider` which is created above. That way at the very least the `club_model`
        is still accessable through a parent->child relationship.
        */
        SceneLoader.ImportMesh("", "../assets/models/", "golf_club.glb", this.scene, (meshes) => {
            const model_parent = meshes[0];
            const club_model = meshes[1];

            model_parent.name = "model_parent";
            club_model.name = "club_model";
            club_model.setParent(this.grab_collider);
            club_model.visibility = 1;

            // Allign the club_model to the center of the grab_collider
            club_model.position = this.clubOrigin.add(new Vector3(0.55, -1.13, 0));
            const model_scale: number = this.club_scale * 0.15; // Originally 1.5
            club_model.scaling = new Vector3(model_scale, model_scale, model_scale);

            // The club is originally upside-down for some reason. This fixes that issue
            club_model.rotationQuaternion!.z = this.degreeToRadians(0);

            //Add to permanent items
            devScene.permenantElements.push(model_parent);
            devScene.permenantElements.push(club_model);
            devScene.permenantElements.push(this.grab_collider);
        });

        // Reset club position and add it's PhysicsImpostor
        this.grab_collider.position = this.clubOrigin;
        this.grab_collider.physicsImpostor = new PhysicsImpostor(
            this.grab_collider,
            PhysicsImpostor.BoxImpostor,
            { mass: 1.2 },
            this.scene
        );

        /*this.physics_collider.physicsImpostor = new PhysicsImpostor(
            this.physics_collider,
            PhysicsImpostor.BoxImpostor,
            { mass: 5 },
            this.scene
        );*/
    }

    //Get Mesh
    public getMesh(): AbstractMesh {
        return this.grab_collider;
    }

    //Reset Club
    public resetPosition()
    {
        this.grab_collider.rotationQuaternion!.x = 0;
        this.grab_collider.rotationQuaternion!.y = 0;
        this.grab_collider.rotationQuaternion!.z = 0;
        this.grab_collider.position = this.clubOrigin;
        this.grab_collider.physicsImpostor!.setLinearVelocity(Vector3.Zero());
        this.grab_collider.physicsImpostor!.setAngularVelocity(Vector3.Zero());
        this.grab_collider.setParent(null);
    }

    private degreeToRadians(value: number) {
        return value * (Math.PI / 180);
    }
}
