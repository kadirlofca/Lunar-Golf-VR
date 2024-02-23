import { Quaternion, SceneLoader, AbstractMesh, MeshBuilder, Scene, Vector3, TransformNode, Mesh, Texture, StandardMaterial, Color3 } from "@babylonjs/core";

//Create Target
export default class Target {
    private scene: Scene;
    private mesh: TransformNode;
    private points: number;
    public cooldown: Boolean;

    constructor(scene: Scene, size: number, position: Vector3, pitch: number, points: number) {
        //Set vars
        this.scene = scene;
        this.points = points;
        this.cooldown = true;
        this.mesh = new TransformNode("target", this.scene);

        // Get texture
        let t_target = new Texture("assets/textures/t_target.png");
        let t_target_emissive = new Texture("assets/textures/t_target_emissive.png");

        //Standard Material
        let m_target = new StandardMaterial("m_target", this.scene);
        m_target.diffuseTexture = t_target;
        m_target.emissiveTexture = t_target_emissive;
        m_target.specularColor = Color3.Black();
        m_target.diffuseColor = Color3.FromHSV(0, 0, 1);

        //Set
        // this.mesh = MeshBuilder.CreateCylinder("target", {height: .5, diameter: size}, this.scene);
        SceneLoader.ImportMesh("", "././assets/models/", "target.glb", this.scene, (meshes) => {
            meshes[1].parent = this.mesh;
            meshes[2].parent = this.mesh;
            meshes[0].dispose();

            meshes[1].material = m_target;
            meshes[2].material = m_target;

            this.mesh.scaling = new Vector3(size, size, size);
            this.mesh.position = position;

            // Make target look towards player.
            this.mesh.lookAt(Vector3.Zero());
            this.mesh.rotation.x = 0;
            this.mesh.rotation.y += 1.5708;

            meshes[1].rotationQuaternion = Quaternion.FromEulerAngles(0, 0, pitch);
        });

        //Set cooldown (so you don't get a bunch of points right at the beginning)
        this.scene.executeWhenReady(() => {
            this.setCooldown(500);
        });      
    }

    //Get Mesh
    public getMesh(): TransformNode {
        return this.mesh;
    }

    //Get points
    public getPoints(): number {
        return this.points;
    }

    //Set Cooldown
    public setCooldown(timeout = 2000) {
        this.cooldown = true;
        setTimeout(() => {
            this.cooldown = false;
        }, timeout);
    }

    //Dispose
    public dispose() {
        this.mesh.dispose();
        this.dispose();
    }
}

