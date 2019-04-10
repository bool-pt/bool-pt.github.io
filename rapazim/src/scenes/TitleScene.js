class TitleScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'TitleScene'
        });
    }
    preload() {
        this.load.atlas('mario-sprites', 'assets/mario-sprites.png', 'assets/mario-sprites.json', 'assets/images/bull.png');

        // Load Bull
        this.load.spritesheet("bull", "assets/images/bull.png", {
            frameWidth: 59,
            frameHeight: 31,
            spacing: 0
        });
        this.load.image("bull_flated",  "assets/images/bull-10espalmado.png");

        // Load cow
        this.load.spritesheet("cow", "assets/images/cow.png", {
            frameWidth: 64,
            frameHeight: 64,
            spacing: 0
        });
    

    }
    create() {
        let config = {
            key: 'title',
            frames: [{
                frame: 'title',
                key: 'mario-sprites'
            }]
        };
        this.anims.create(config);

        // Create bull animations
        this.anims.create({
            key: 'bull_walking',
            frames: this.anims.generateFrameNames('bull', {
                frames: [0, 1]
            }),
            frameRate: 4,
            yoyo: true,
            repeat: -1
        });

        this.anims.create({
            key: 'bull_flat',
            frames: [{
                key: 'bull_flated',
                frame: 0
            }]
        });

        // Create cow animations
        this.anims.create({
            key: 'cow_walking',
            frames: this.anims.generateFrameNames('cow', {
                frames: [3, 4, 5]
            }),
            frameRate: 4,
            yoyo: true,
            repeat: -1
        });

        this.title = this.add.sprite(this.sys.game.config.width / 2, 16 * 5);
        this.title.play('title');
        this.attractMode = this.scene.launch('GameScene');
        console.log(this.attractMode.stop);

        this.scene.bringToTop();

        this.registry.set('restartScene', false);
        this.registry.set('attractMode', true);

        let sh = window.screen.availHeight;
        let sw = window.screen.availWidth;

        // let ch = 0;
        // let cw = 0;
        let multiplier = 1;
        if (sh / sw > 0.6) {
            // Portrait, fit width
            multiplier = sw / 400;
        } else {
            multiplier = sh / 240;
        }
        multiplier = Math.floor(multiplier);
        let el = document.getElementsByTagName('canvas')[0];
        // el.style.width = window.screen.availWidth + 'px';
        // el.style.height = window.screen.availHeight+ 'px'; //240
        el.style.width = 490 * multiplier + 'px';
        el.style.height = 240 * multiplier + 'px'; //240

        this.pressX = this.add.bitmapText(16 * 8 + 4, 8 * 16, 'font', 'PRESS X TO START', 8);
        this.blink = 1000;

        this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

        this.input.on('pointerdown', () => {
            this.startGame();
        });
    }

    update(time, delta) {
        if (this.registry.get('restartScene')) {
            this.restartScene();
        }
        this.blink -= delta;
        if (this.blink < 0) {
            this.pressX.alpha = this.pressX.alpha === 1 ? 0 : 1;
            this.blink = 500;
        }

        if (!this.registry.get('attractMode')) {}
        if (this.startKey.isDown) {
            this.startGame();
        }
    }

    startGame() {
        this.scene.stop('GameScene');
        this.registry.set('attractMode', false);
        this.scene.start('GameScene');
    }

    restartScene() {
        // this.attractMode.stop();
        this.scene.stop('GameScene');
        this.scene.launch('GameScene');
        this.scene.bringToTop();

        this.registry.set('restartScene', false);
    }
}

export default TitleScene;
