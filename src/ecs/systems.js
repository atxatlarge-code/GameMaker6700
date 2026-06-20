import { Components } from './components.js';
import { CONFIG } from '../config.js';

export function MovementSystem(world) {
  const entities = world.getEntitiesWith(Components.Transform, Components.Velocity);
  for (const id of entities) {
    const transform = world.getComponent(id, Components.Transform);
    const velocity = world.getComponent(id, Components.Velocity);
    
    transform.x += velocity.vx;
    transform.y += velocity.vy;
  }
}

export function GravitySystem(world) {
  const entities = world.getEntitiesWith(Components.Velocity, Components.Gravity);
  for (const id of entities) {
    const velocity = world.getComponent(id, Components.Velocity);
    const gravity = world.getComponent(id, Components.Gravity);
    
    velocity.vy += 0.5 * gravity.multiplier; // Base gravity
    
    // Terminal velocity
    if (velocity.vy > 12) velocity.vy = 12;
  }
}

export function RenderSystem(world, ctx, camera) {
  const entities = world.getEntitiesWith(Components.Transform, Components.Renderable);
  for (const id of entities) {
    const transform = world.getComponent(id, Components.Transform);
    const renderable = world.getComponent(id, Components.Renderable);
    
    if (!renderable.visible) continue;
    
    const screenX = transform.x - camera.x;
    const screenY = transform.y - camera.y;
    
    ctx.save();
    ctx.translate(screenX + transform.width / 2, screenY + transform.height / 2);
    ctx.rotate(transform.tiltAngle * Math.PI / 180);
    ctx.scale(transform.scaleX, transform.scaleY);
    
    // Draw placeholder box based on spriteId for now
    ctx.fillStyle = renderable.spriteId === 'ghibli' ? 'red' : 'blue';
    ctx.fillRect(-transform.width / 2, -transform.height / 2, transform.width, transform.height);
    
    ctx.restore();
  }
}
