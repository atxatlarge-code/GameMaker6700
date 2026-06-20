// ECS Components (Pure Data)

export const Components = {
  Transform: 'Transform',
  Velocity: 'Velocity',
  Collider: 'Collider',
  Renderable: 'Renderable',
  PlayerControl: 'PlayerControl',
  AIControl: 'AIControl',
  Gravity: 'Gravity'
};

export function createTransform(x = 0, y = 0, width = 32, height = 38) {
  return { x, y, width, height, scaleX: 1, scaleY: 1, tiltAngle: 0 };
}

export function createVelocity(vx = 0, vy = 0) {
  return { vx, vy };
}

export function createCollider(isSolid = true) {
  return { isSolid, isGrounded: false };
}

export function createRenderable(spriteId, facing = 'right') {
  return { spriteId, facing, walkCycle: 0, blinkTimer: 0, blinkDuration: 0, visible: true };
}

export function createPlayerControl() {
  return {
    jumpBufferTimer: 0,
    coyoteTimer: 0,
    hasDash: false,
    dashAvailable: false,
    isDashing: false,
    dashTimer: 0,
    hasGrapple: false,
    grappleHook: null,
    isDead: false,
    deathTimer: 0
  };
}

export function createAIControl(type = 'basic', speed = 1, patrolLeft = 0, patrolRight = 0) {
  return {
    type,
    speed,
    patrolLeft,
    patrolRight,
    state: 'patrol',
    timer: 0
  };
}

export function createGravity(multiplier = 1) {
  return { multiplier };
}
