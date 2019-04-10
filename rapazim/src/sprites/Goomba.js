import Enemy from './Enemy';

export default class Goomba extends Enemy {
    constructor(config) {
        super(config);
        this.body.setVelocity(0, 0).setBounce(0, 0).setCollideWorldBounds(false);
        //this.anims.play('goomba');
        this.anims.play('bull_walking');
        this.body.setSize(40,25);
        this.body.setOffset(-6, 5);
        this.killAt = 0;
        
    }

    update(time, delta) {
        // If it's not activated, then just skip the update method (see Enemy.js)
        if (!this.activated()) {
            return;
        }
        this.scene.physics.world.collide(this, this.scene.groundLayer);
        if (this.killAt !== 0) {
            // The killtimer is set, keep the flat Goomba then kill it for good.
            this.body.setVelocityX(0);
            this.killAt -= delta;
            if (this.killAt < 0) {
                this.kill();
            }
            return;
        }

        // Collide with Mario!
        this.scene.physics.world.overlap(this, this.scene.mario, this.marioHit);

        // The Goomba stopped, better try to walk in the other direction.
        if (this.body.velocity.x === 0) {
            this.flipX = !this.flipX;
            this.direction = -this.direction;
            this.body.velocity.x = this.direction;
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
        
        enemy.play('bull_flat');
        enemy.body.setVelocityX(0);
        enemy.body.acceleration.x = 0;
        // Keep goomba flat for 500ms, then remove it.
        enemy.killAt = 1000;
    }
}
