import { Scene, Sound } from "@babylonjs/core"

export default class Sounds
{
    private scene: Scene;
    private silence: Sound;
    private golf_hit: Sound;
    private golf_clap: Sound;
    private target_hit: Sound;
    private music: Sound;

    constructor(scene: Scene)
    {
        this.scene = scene;
        
        this.golf_hit = new Sound("golfHit", "assets/sounds/golf_hit.wav", this.scene);
        this.golf_clap = new Sound("golfClap", "assets/sounds/golf_clap.wav", this.scene);
        this.target_hit = new Sound("targetHit", "assets/sounds/target_hit.wav", this.scene);
        this.music = new Sound("music", 'assets/sounds/music.mp3', this.scene, null, {loop: true, autoplay: true});

        //Play silence to make sure the mute icon will appear (it's really dumb)
        this.silence = new Sound("silence", "assets/sounds/silence.wav", this.scene, null, {autoplay: true});
    }

    //Play sounds
    public playGolfHit()
    {
        this.golf_hit.play();
    }

    public playGoftClap()
    {
        this.golf_clap.play();
    }

    public playTargetHit()
    {
        this.target_hit.play();
    }

    public playSilence()
    {
        this.silence.play();
    }
}