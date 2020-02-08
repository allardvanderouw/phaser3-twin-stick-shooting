import Phaser from 'phaser'
import playerImg from './assets/player.png'
import joystickImg from './assets/joystick.png'
import bulletImg from './assets/bullet.png'
import rexvirtualjoystickplugin from './plugins/rexvirtualjoystickplugin.min.js'

const MAX_PLAYER_SPEED = 200
const BULLET_SPEED = 800

class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet')

    this.born = 0
  }

  fire(shooter) {
    this.setRotation(shooter.rotation)

    // Offset the bullet to start a bit right of the shooter
    this.x = shooter.x + (50 * Math.cos(this.rotation))
    this.y = shooter.y + (50 * Math.sin(this.rotation))

    this.setVelocityX(BULLET_SPEED * Math.cos(Math.PI * this.angle / 180))
    this.setVelocityY(BULLET_SPEED * Math.sin(Math.PI * this.angle / 180))

    this.born = 0
  }

  update(time, delta) {
    this.born += delta

    if (this.born > 1500) {
      this.destroy()
    }
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  backgroundColor: '#56ac68',
  width: '100%',
  height: '100%',
  physics: {
    default: 'arcade',
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  input: {
    activePointers: 3, // 2 is default for mouse + pointer, +1 is required for dual touch
  },
}

const game = new Phaser.Game(config)

function preload() {
  this.load.image('player', playerImg)
  this.load.image('joystick', joystickImg)
  this.load.image('bullet', bulletImg)

  this.load.plugin('rexvirtualjoystickplugin', rexvirtualjoystickplugin, true)
}

function create() {
  // Create player
  this.player = this.physics.add.sprite(200, 200, 'player')
  this.player.setCollideWorldBounds(true)
  this.player.setOrigin(0.5, 0.72) // Set origin for bullet fire start

  // Create movement joystick
  this.movementJoyStick = this.plugins.get('rexvirtualjoystickplugin').add(this.scene, {
    x: 100,
    y: this.cameras.main.height - 125,
    radius: 40,
    forceMin: 0,
    base: this.add.circle(0, 0, 60, 0x888888).setDepth(100).setAlpha(0.25),
    thumb: this.add.image(0, 0, 'joystick').setDisplaySize(80, 80).setDepth(100).setAlpha(0.5),
  }).on('update', () => {}, this)

  // Create shooting joystick
  this.shootJoyStick = this.plugins.get('rexvirtualjoystickplugin').add(this.scene, {
    x: this.cameras.main.width - 100,
    y: this.cameras.main.height - 125,
    radius: 20,
    forceMin: 0,
    base: this.add.circle(0, 0, 60, 0x888888, 0.5).setDepth(100).setAlpha(0.25),
    thumb: this.add.image(0, 0, 'joystick').setDisplaySize(80, 80).setDepth(100).setAlpha(0.5),
  }).on('update', () => {}, this)

  // Move joysticks dynamically based on pointer-down
  this.input.on('pointerdown', (pointer) => {
    if (pointer.x <= this.cameras.main.width * 0.4) {
      this.movementJoyStick.base.setPosition(pointer.x, pointer.y).setAlpha(0.5)
      this.movementJoyStick.thumb.setPosition(pointer.x, pointer.y).setAlpha(1)
    }
    if (pointer.x >= this.cameras.main.width * 0.6) {
      this.shootJoyStick.base.setPosition(pointer.x, pointer.y).setAlpha(0.5)
      this.shootJoyStick.thumb.setPosition(pointer.x, pointer.y).setAlpha(1)
    }
  })

  // Add transparency to joysticks on pointer-up
  this.input.on('pointerup', (pointer) => {
    this.movementJoyStick.base.setAlpha(0.25)
    this.movementJoyStick.thumb.setAlpha(0.5)
    this.shootJoyStick.base.setAlpha(0.25)
    this.shootJoyStick.thumb.setAlpha(0.5)
  })

  this.bullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true })
  this.bulletCooldown = 0
}

function update(time, delta) {
  if (this.bulletCooldown > 0) {
    // Reduce bullet cooldown
    this.bulletCooldown -= delta
  }

  if (this.shootJoyStick.force) {
    // Rotate according to joystick
    this.player.setAngle(this.shootJoyStick.angle)

    // Fire bullet according to joystick
    if (this.shootJoyStick.force >= this.shootJoyStick.radius && this.bulletCooldown <= 0) {
      const bullet = this.bullets.get().setActive(true).setVisible(true)
      bullet.fire(this.player)

      this.bulletCooldown = 100
    }
  }

  if (this.movementJoyStick.force) {
    // Calculate speed based on joystick force
    let speedMultiplier = (this.movementJoyStick.force < this.movementJoyStick.radius) ? this.movementJoyStick.force / this.movementJoyStick.radius : 1
    let speed = MAX_PLAYER_SPEED * speedMultiplier

    // Move player according to movement joystick
    this.player.setVelocityX(speed * Math.cos(Math.PI * this.movementJoyStick.angle / 180))
    this.player.setVelocityY(speed * Math.sin(Math.PI * this.movementJoyStick.angle / 180))
  } else {
    // Stop moving
    this.player.setVelocityX(0)
    this.player.setVelocityY(0)
  }
}
