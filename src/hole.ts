import { AbstractMesh, Animation, Color4, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import Ball from "./ball";

export default class Hole {
    public cooldown: Boolean;

    private marker_color: Color4;
    private mesh_collider: AbstractMesh;
    private meshes: Array<AbstractMesh>;
    private points: number;
    private scene: Scene;

    /*
    The hole constructor has some default parameters you can optionally set. Leave the last 2
    parameters of the constructor blank if you want to use the default values.
    */
    constructor(scene: Scene, position: Vector3, rotation: Vector3,
        points: number = 100, size: number = 10, color: Color4 = new Color4(0, 1, 1, .1)) {

        this.scene = scene;
        this.points = points;
        this.marker_color = color;
        this.meshes = [];
        this.cooldown = true;

        // Create the collider
        this.mesh_collider = MeshBuilder.CreateBox(
            "hole_collider",
            {
                height: 2, // We don't want the player to enter the hole's collider in air, only on the ground
                width: size,
                depth: size,
            },
            this.scene
        );
        this.mesh_collider.visibility = 0;
        this.mesh_collider.position = new Vector3(position.x, 0, position.z);
        this.mesh_collider.rotation = new Vector3(0, 0, 0);
        this.mesh_collider.checkCollisions = true;
        //Set cooldown (so you don't get a bunch of points right at the beginning)
        this.scene.executeWhenReady(() => {
            this.setCooldown(100);
        });      

        // Lot's of repeated code in this one, put in it's own method for organization
        this.createMarkers(new Vector3(position.x, size/2, position.z), this.mesh_collider.rotation, size);
        this.createWireframe(new Vector3(position.x, size/2, position.z), this.mesh_collider.rotation, size);
    }

    public getMeshCollider() : AbstractMesh
    {
        return this.mesh_collider;
    }

    public getMeshes(): Array<AbstractMesh> { return this.meshes; }

    public getPoints(): number { return this.points; }

    public setCooldown(timeout = 1000) {
        setTimeout(() => {
            this.cooldown = false;
            console.log("hole reset");
        }, timeout);
    }

    /********** PRIVATE METHODS **********/

    // This is the red frame around the hole, showing where the ball needs to be on the ground.
    private createWireframe(position: Vector3, rotation: Vector3, size: number = 10): void {
        const wireframe_color = new Color4(1, 0, 0, 0.8);
        const wireframe_colors = [
            wireframe_color, wireframe_color, // Front & Back
            wireframe_color, wireframe_color, // Sides
            wireframe_color, wireframe_color, // Top & Bottom
        ];

        // FRONT =============================
        this.meshes.push(MeshBuilder.CreateBox(
            'hole_wireframe_front',
            {
                width: size / 10,
                height: size / 10,
                depth: size * 0.9,
                faceColors: wireframe_colors,
            },
            this.scene
        ));
        const wireframe_front = this.meshes[4];

        wireframe_front.position = new Vector3(
            position.x + (size / 2),
            position.y - (size / 2),
            position.z
        );
        wireframe_front.rotation = rotation;

        // LEFT ==============================
        this.meshes.push(MeshBuilder.CreateBox(
            'hole_wireframe_left',
            {
                width: size * 1.1,
                height: size / 10,
                depth: size / 10,
                faceColors: wireframe_colors
            },
            this.scene
        ));
        const wireframe_left = this.meshes[5];

        wireframe_left.position = new Vector3(
            position.x,
            position.y - (size / 2),
            position.z - (size / 2),
        );
        wireframe_left.rotation = rotation;

        // BACK ==============================
        this.meshes.push(MeshBuilder.CreateBox(
            'hole_wireframe_back',
            {
                width: size / 10,
                height: size / 10,
                depth: size * 0.9,
                faceColors: wireframe_colors,
            },
            this.scene
        ));
        const wireframe_back = this.meshes[6];

        wireframe_back.position = new Vector3(
            position.x - (size / 2),
            position.y - (size / 2),
            position.z
        );
        wireframe_back.rotation = rotation;

        // RIGHT =============================
        this.meshes.push(MeshBuilder.CreateBox(
            'hole_wireframe_right',
            {
                width: size * 1.1,
                height: size / 10,
                depth: size / 10,
                faceColors: wireframe_colors,
            },
            this.scene
        ));
        const wireframe_right = this.meshes[7];

        wireframe_right.position = new Vector3(
            position.x,
            position.y - (size / 2),
            position.z + (size / 2),
        );
        wireframe_right.rotation = rotation;

        // Wireframe Animation ===============
        // Let's make the wireframe blink in and out of existence: visibility = 1 -> 0 -> 1
        const anim_framerate = 30;
        const anim_wireframe = new Animation(
            'anim_wireframe',
            'visibility',
            anim_framerate,
            Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE,
        );

        const key_frames_anim_wireframe = [];
        key_frames_anim_wireframe.push({
            frame: 0,
            value: 1,
        });

        key_frames_anim_wireframe.push({
            frame: 1.5 * anim_framerate,
            value: 0.1,
        });

        key_frames_anim_wireframe.push({
            frame: 3 * anim_framerate,
            value: 1,
        });

        anim_wireframe.setKeys(key_frames_anim_wireframe);
        // Add animations for each wireframe mesh
        for (let i = 4; i < 8; i++) {
            this.meshes[i].animations.push(anim_wireframe);
        }

    }

    // These are the markers that float in the air. Letting the player know where the hole is from afar.
    private createMarkers(position: Vector3, rotation: Vector3, size: number = 10): void {
        const marker_colors = [
            this.marker_color, this.marker_color, // Front & Back
            this.marker_color, this.marker_color, // Sides
            this.marker_color, this.marker_color, // Top & Bottom
        ]

        // This mesh is what will be visible and animated

        // GROUND MARKER =====================
        this.meshes.push(MeshBuilder.CreateBox(
            "marker01",
            {
                width: size,
                height: size / 5,
                depth: size,
                faceColors: marker_colors,
            },
            this.scene
        ))
        const ground_marker = this.meshes[0];

        ground_marker.visibility = 0.7;
        ground_marker.position = new Vector3(position.x, position.y / 5, position.z);
        ground_marker.rotation = rotation;
        ground_marker.checkCollisions = false;

        // MIDDLE MARKER =====================
        this.meshes.push(MeshBuilder.CreateBox(
            "marker02",
            {
                width: size,
                height: size / 5,
                depth: size,
                faceColors: marker_colors,
            },
            this.scene
        ));
        const middle_marker = this.meshes[1];

        middle_marker.visibility = 0.7;
        middle_marker.position = new Vector3(position.x, position.y * 2, position.z);
        middle_marker.rotation = rotation;
        middle_marker.checkCollisions = false;
        middle_marker.setParent(this.meshes[0]);

        // TOP MARKER ========================
        this.meshes.push(MeshBuilder.CreateBox(
            "marker03",
            {
                width: size,
                height: size / 5,
                depth: size,
                faceColors: marker_colors,
            },
            this.scene
        ));
        const top_marker = this.meshes[2];

        top_marker.visibility = 0.7;
        top_marker.position = new Vector3(position.x, position.y * 3.8, position.z);
        top_marker.rotation = rotation;
        top_marker.checkCollisions = false;
        top_marker.setParent(this.meshes[0]);

        // UNDERGROUND MARKER ================
        this.meshes.push(MeshBuilder.CreateBox(
            "marker03",
            {
                width: size,
                height: size / 5,
                depth: size,
                faceColors: marker_colors,
            },
            this.scene
        ));
        const underground_marker = this.meshes[3];

        underground_marker.visibility = 0.7;
        underground_marker.position = new Vector3(position.x, position.y * -1.6, position.z);
        underground_marker.rotation = rotation;
        underground_marker.checkCollisions = false;
        underground_marker.setParent(this.meshes[0]);

        // Give the mesh position animations
        const anim_framerate = 30;

        const anim_marker_position = new Animation(
            'anim_marker_position',
            'position.y',
            anim_framerate,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CYCLE,
        );

        const key_frames_marker_position = [];
        key_frames_marker_position.push({ // Start at the ground
            frame: 0,
            value: position.y / 5,
        });

        key_frames_marker_position.push({ // Half-way point between ground and max-height (1.5 * collider_height)
            frame: 1.5 * anim_framerate,
            value: position.y,
        });

        key_frames_marker_position.push({ // Go past collider height by 1.5 times
            frame: 3 * anim_framerate,
            value: position.y * 2,
        });

        anim_marker_position.setKeys(key_frames_marker_position);
        this.meshes[0].animations.push(anim_marker_position);

        // 3rd marker dissapearing animation
        // This makes the very top marker fade out as it goes up. This anim is non-linearly fading out
        const anim_marker_dissapear = new Animation(
            'anim_marker_dissapear',
            'visibility',
            anim_framerate,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CYCLE,
        );

        const key_frames_marker_dissapear = [];
        key_frames_marker_dissapear.push({
            frame: 0,
            value: 0.7,
        });

        key_frames_marker_dissapear.push({
            frame: 1.5 * anim_framerate,
            value: 0.4,
        });

        key_frames_marker_dissapear.push({
            frame: 3 * anim_framerate,
            value: 0,
        });

        anim_marker_dissapear.setKeys(key_frames_marker_dissapear);
        top_marker.animations.push(anim_marker_dissapear);

    }
}