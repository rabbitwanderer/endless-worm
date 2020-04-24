/**
 * @author       Rabbitwanderer <rabbitwanderer@gmail.com>
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

import 'phaser';

// 座標定数
const field = {
    x1: 4,
    x2: 800-4,
    y1: 4+32,
    y2: 600-4,
    xc: 400-4,
    yc: 300,
    xt: 400,
    yt: 250,
    scale: 8
}

export default class Stage extends Phaser.Scene
{
    constructor () {
        super('stage');
    }

    // シーン変数
    xx: number;
    yy: number;
    score: number;
    gameover: boolean;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    text: Phaser.GameObjects.Text;
    head: Phaser.GameObjects.Sprite;
    neck: Phaser.GameObjects.Sprite;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    collider: Phaser.Physics.Arcade.Collider;
    gridWalking: boolean;
    timer: Phaser.Time.TimerEvent;

    // アセットのロード
    preload() {
        this.load.image('head', 'assets/head.png');
        this.load.image('block', 'assets/block.png');
    }

    // シーン開始処理
    create() {
        this.gameover = false;
        // キー入力初期化
        this.cursors = this.input.keyboard.createCursorKeys();
        // 外枠の描画
        this.platforms = this.physics.add.staticGroup();
        for(let x=field.x1; x<=field.x2; x+=field.scale) {
            this.platforms.create(x, field.y1, 'block');
            this.platforms.create(x, field.y2, 'block');
        }
        for(let y=field.y1; y<=field.y2; y+=field.scale) {
            this.platforms.create(field.x1, y, 'block');
            this.platforms.create(field.x2, y, 'block');
        }
        // スプライト初期化
        this.head = this.add.sprite(field.xc, field.yc, 'head').setDepth(1);
        this.neck = this.add.sprite(field.xc, field.yc, 'block');
        this.physics.world.enable(this.head);
        this.collider = this.physics.add.collider(this.head, this.platforms, this.hit, null, this);
        this.gridWalking = false
        this.xx = 1;
        this.yy = 0;
        // タイマ初期化
        this.timer = this.time.addEvent({
            delay: 100, // ms
            callback: this.addObstacle,
            callbackScope: this,
            loop: true
        });
        // スコア表示
        this.score = 0;
        this.text = this.add.text(14, 0, "Score 0", {fontSize: 28, fontFamily: "Arial"});
    }

    // 障害物の星を追加する
    addObstacle() {
        this.platforms.create(
            field.x1 + Math.floor(Math.random()*(field.x2 - field.x1)/8) * 8,
            field.y1 + Math.floor(Math.random()*(field.y2 - field.y1)/8) * 8,
            'block'
        );
    }

    // 障害物に衝突した時の処理
    hit() {
        // ゲームを止める
        this.gameover = true;
        this.collider.active = false;
        this.timer.remove();
        // GameOverメッセージとリスタート
        let text = this.add.text(field.xt, field.yt, "Game Over", {fontSize: 28, fontFamily: "Arial", color: "red"})
            .setOrigin(0.5,0);
        new Promise(resolve => this.time.delayedCall(1000, () => resolve(), null, this))
            .then(() => text.setText("  Game Over  \n\nPush any key."))
            .then(() => new Promise(resolve => this.input.keyboard.on('keydown', () => resolve())))
            .then(() => this.scene.restart());
    }

    // update
    update() {
        if(this.gameover) return;
        // キー入力状態の更新
        const {left, right, up, down} = this.cursors;
        if( left.isDown || right.isDown || up.isDown || down.isDown ) {
            this.xx = ( left.isDown ? -1 : 0 ) + ( right.isDown ? 1 : 0 );
            this.yy = ( up.isDown ? -1 : 0 ) + ( down.isDown ? 1 : 0 );
        }
        // 頭が次のグリッドまで進んでいなければ後の処理は飛ばす
        if(this.gridWalking) return;
        // 次のグリッドに進む
        this.gridWalking = true;
        if(this.neck.x !== this.head.x || this.neck.y !== this.head.y) {
            this.platforms.create(this.neck.x, this.neck.y, 'block');
        }
        this.neck.setPosition(this.head.x,this.head.y);
        this.gridWalk(this.head, this.xx, this.yy)
            .then(() => {
                // スコア更新
                this.score++;
                this.text.setText("Score " + this.score);
                this.gridWalking = false;
            });
    }

    // スプライトにグリッド上の一マスを移動させる
    gridWalk(target: Phaser.GameObjects.Sprite, xDir: number, yDir: number) {
        return new Promise( resolve => {
            let tween = this.add.tween({
                targets: [target],
                // X座標の移動を設定
                x: {
                    getStart: () => target.x,
                    getEnd: () => target.x + (field.scale * xDir)
                },
                // X座標の移動を設定
                y: {
                    getStart: () => target.y,
                    getEnd: () => target.y + (field.scale * yDir)
                },
                duration: 50,
                // アニメーション終了時に発火するコールバック
                onComplete: () => {
                    tween.stop();
                    resolve();
                }
            })
        })
    }
}

const config = {
    type: Phaser.AUTO,
    backgroundColor: '#125555',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
          debug: false,
          gravity: { y: 0 }
        }
      },
    scene: Stage
};

const game = new Phaser.Game(config);
