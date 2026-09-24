import { STALKER_DASH } from '../../../config/stalkerDash.js';

/** Bote do verme: preparação visível, trajetória comprometida e recuperação parada. */
export function dashBehavior(e, dt, angle, curSpeed) {
  if (!(dt > 0)) return;
  const previousTimer = e.dashTimer || 0;
  e.dashTimer = previousTimer + dt;
  if (e.dashState === 'chase') {
    e.x += Math.cos(angle) * curSpeed * STALKER_DASH.chaseSpeedMultiplier * dt;
    e.y += Math.sin(angle) * curSpeed * STALKER_DASH.chaseSpeedMultiplier * dt;
    if (e.dashTimer >= STALKER_DASH.chase) {
      e.dashState = 'aim';
      e.dashTimer = 0;
      // Lock before the dust warning: no teleport or retarget during the lunge.
      e.dashAngle = angle;
      e.combatState = 'CHASE';
      e.attackTimer = 0;
    }
  } else if (e.dashState === 'aim') {
    if (e.dashTimer >= STALKER_DASH.windup) {
      e.dashState = 'dashing';
      e.dashTimer = 0;
      e.combatState = 'STRIKE';
      e.attackAngle = e.dashAngle;
      e.attackTimer = STALKER_DASH.duration + dt;
      e.hasHitInStrike = false;
    }
  } else if (e.dashState === 'dashing') {
    // Respect slows/stagger and cap travel when a frame spans the dash end.
    const travelDt = Math.min(dt, Math.max(0, STALKER_DASH.duration - previousTimer));
    const speed = Math.max(0, curSpeed) * STALKER_DASH.speedMultiplier;
    e.x += Math.cos(e.dashAngle) * speed * travelDt;
    e.y += Math.sin(e.dashAngle) * speed * travelDt;
    if (e.dashTimer >= STALKER_DASH.duration) {
      e.dashState = 'cooldown';
      e.dashTimer = 0;
      e.combatState = 'RECOVERY';
      e.attackTimer = STALKER_DASH.recovery;
    }
  } else if (e.dashState === 'cooldown') {
    // Miasma and interrupts may enter recovery outside this behavior.
    e.combatState = 'RECOVERY';
    e.attackTimer = Math.max(0, STALKER_DASH.recovery - e.dashTimer);
    if (e.dashTimer >= STALKER_DASH.recovery) {
      e.dashState = 'chase';
      e.dashTimer = 0;
      e.combatState = 'CHASE';
      e.attackTimer = 0;
      e.attackCooldown = e.attackCooldownMax || 19;
    }
  }
}
