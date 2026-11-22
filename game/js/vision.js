// Guard lantern geometry uses the same tile rays for both sight and drawing.
function castVisionCone(world, guard) {
  const points = [];
  for (let i = 0; i < TUNING.coneRays; i++) {
    const angle = guard.facing - TUNING.coneHalfAngle + 2 * TUNING.coneHalfAngle * i / (TUNING.coneRays - 1);
    const hit = castRay(world, guard.x, guard.y, angle, TUNING.coneRange);
    points.push({ x: hit.x, y: hit.y });
  }
  return { origin: { x: guard.x, y: guard.y }, points };
}
function lampRangeAt(world, x, y) {
  const { lamps, lampsLit } = world.level;
  for (let index = 0; index < lamps.length; index++) {
    if (lampsLit?.[index] === false) continue;
    const center = tileCenter(lamps[index].tx, lamps[index].ty);
    if (distance(x, y, center.x, center.y) <= 2 * TILE) return TUNING.coneRange * 1.6;
  }
  return TUNING.coneRange;
}

function pointInCone(world, guard, x, y) {
  const length = distance(guard.x, guard.y, x, y);
  return length <= lampRangeAt(world, x, y) &&
    (length === 0 || Math.abs(angleDiff(guard.facing, Math.atan2(y - guard.y, x - guard.x))) <= TUNING.coneHalfAngle) &&
    hasLineOfSight(world, guard.x, guard.y, x, y);
}
