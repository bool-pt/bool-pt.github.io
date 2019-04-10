import Enemy from './Enemy';

export default class Turtle extends Enemy {
    constructor(config) {
        super(config);
        this.flipX = true;
        //this.anims.play('turtle');
        this.anims.play('cow_walking');
        this.sliding = false;
        this.type = 'turtle';
        //his.body.setSize(12, 12);
        //this.body.offset.set(2, 2);
        this.body.setSize(40,25);
        this.body.setOffset(-15, 5);
    }

    update() {
        if (!this.activated()) {
            return;
        }
        this.scene.physics.world.collide(this, this.scene.groundLayer);
        this.scene.physics.world.overlap(this, this.scene.mario, this.marioHit);
        if (this.body.velocity.x === 0) {
            this.direction = -this.direction;
            this.body.velocity.x = this.direction;
            this.flipX = this.direction < 0;
        }
    }

    slidekill(turtle, victim) {
        if (typeof victim.starKilled !== 'undefined') {
            victim.starKilled();
        }
    }

    marioHit(enemy, mario) {
        if (enemy.verticalHit(enemy, mario)) {
            // Mario jumps on the enemy
            mario.enemyBounce(enemy);
            enemy.scene.sound.playAudioSprite('sfx', 'smb_stomp');
            enemy.getFlat(enemy, mario);
            // get points
            enemy.scene.updateScore(100);
        } else {
            // Mario collides with the enemy
            enemy.hurtMario(enemy, mario);
        }
    }




    getFlat(enemy, mario) {
        //enemy.play('goombaFlat');
        this.flipX = !this.flipX;
        this.flipY = !this.flipY;
        this.y += -10;

        // Disable collisions for the bull to fall of the screen
        this.body.checkCollision.none = true;
        this.body.checkCollision.down = false;
        this.body.checkCollision.left = false;
        this.body.checkCollision.right = false;
        this.body.checkCollision.up = false;
        
        enemy.body.setVelocityX(0);
        enemy.body.acceleration.x = 0;
        // Keep goomba flat for 500ms, then remove it.
        enemy.killAt = 1000;
    }
}
