// Watchman patrols, lantern sweeps, pursuit, and return to route.
class Guard {
  constructor(def, world, rng) {
    this.waypoints = def.waypoints;
    const first = this.waypoints[0];
    const start = tileCenter(first.x, first.y);
    this.x = start.x;
    this.y = start.y;
    this.radius = TUNING.guardRadius;
    this.facing = 0;
    this.lastSeen = null;
    this.path = [];
    this.stepTimer = 0;
    this.flickerPhase = rng() * Math.PI * 2;
    this.seesPlayer = false;
    this.caughtPlayer = false;
    this.moving = false;
    this.route = [start];
    this.patrolLegs = this.waypoints.map((from, index) => {
      const to = this.waypoints[(index + 1) % this.waypoints.length];
      const path = lvlPatrolPath(world, from.x, from.y, to.x, to.y);
      this.route.push(...path.map(tile => tileCenter(tile.tx, tile.ty)));
      return path;
    });
    const approach = this.route[this.route.length - 2];
    if (approach) this.facing = Math.atan2(start.y - approach.y, start.x - approach.x);
    this.setState('PATROL', { waypoint: 0 });
    this.facing = this.sweepBase;
    this.cone = castVisionCone(world, this);
  }

  setState(name, opts = {}) {
    const previous = this.state;
    if (opts.lastSeen !== undefined) this.lastSeen = opts.lastSeen;
    if (name === previous) return previous;
    this.state = name;
    if (name === 'ALERT') this.enteredAlert = true;
    this.path = [];
    this.pathTarget = null;
    this.repathIn = 0;
    this.stateTime = 0;
    this.sweepBase = this.facing;
    if (name === 'PATROL') {
      this.waypoint = opts.waypoint ?? this.waypoint;
      this.grdWaitAtWaypoint();
    }
    if (name === 'RETURN') this.returnWaypoint = null;
    return previous;
  }

  grdWaitAtWaypoint() {
    const point = this.waypoints[this.waypoint];
    this.patrolWait = 0;
    this.walkingPatrol = false;
    this.sweepBase = point.face === undefined ? this.facing : point.face * DEG;
  }

  grdTurnToward(angle, dt) {
    const limit = TUNING.guardTurnRate * dt;
    this.facing += clamp(angleDiff(this.facing, angle), -limit, limit);
  }

  grdFollowPath(speed, dt) {
    let remaining = speed * TILE * dt;
    while (this.path.length && remaining > 0) {
      const tile = this.path[0];
      const target = tileCenter(tile.tx, tile.ty);
      const length = distance(this.x, this.y, target.x, target.y);
      const travel = Math.min(remaining, length);
      if (travel > 0) {
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        this.x += Math.cos(angle) * travel;
        this.y += Math.sin(angle) * travel;
        this.moving = true;
      }
      if (travel === length) {
        this.x = target.x;
        this.y = target.y;
        this.path.shift();
      }
      remaining -= travel;
    }
  }

  grdPathTo(world, tx, ty) {
    const fromTx = pixelToTile(this.x), fromTy = pixelToTile(this.y);
    const path = findPath(world, fromTx, fromTy, tx, ty);
    if (path === null) return null;
    const center = tileCenter(fromTx, fromTy);
    if (distance(this.x, this.y, center.x, center.y) > 1e-8) path.unshift({ tx: fromTx, ty: fromTy });
    return path;
  }

  grdPatrol(dt) {
    if (!this.walkingPatrol) {
      this.patrolWait += dt;
      const swing = TUNING.sweepAmplitude * Math.sin(this.patrolWait * 2 * Math.PI / TUNING.sweepPeriod);
      this.grdTurnToward(this.sweepBase + swing, dt);
      if (this.patrolWait + 1e-9 < this.waypoints[this.waypoint].wait) return;
      this.path = this.patrolLegs[this.waypoint].slice();
      this.waypoint = (this.waypoint + 1) % this.waypoints.length;
      this.walkingPatrol = true;
      return;
    }
    const tile = this.path[0];
    if (tile) {
      const target = tileCenter(tile.tx, tile.ty);
      this.grdTurnToward(Math.atan2(target.y - this.y, target.x - this.x), dt);
      this.grdFollowPath(TUNING.guardPatrolSpeed, dt);
    }
    if (!this.path.length) this.grdWaitAtWaypoint();
  }

  grdPursue(dt, world, player) {
    const alert = this.state === 'ALERT';
    const speed = alert ? TUNING.guardAlertSpeed : TUNING.guardSuspiciousSpeed;
    const target = this.lastSeen;
    const reach = TUNING.catchDistance * TILE;
    if (alert && distance(this.x, this.y, player.x, player.y) <= reach) {
      this.caughtPlayer = true;
      return;
    }
    this.repathIn -= dt;
    const next = this.path[0];
    const blocked = next && !isWalkable(world, next.tx, next.ty);
    if (target && (target !== this.pathTarget || blocked || (alert && this.repathIn <= 1e-9))) {
      const path = this.grdPathTo(world, target.tx, target.ty);
      if (path === null && alert) {
        this.setState('SEARCH');
        return;
      }
      this.path = path || [];
      this.pathTarget = target;
      this.repathIn = TUNING.alertRepathInterval;
    }
    const tile = this.path[0];
    const focus = alert && tile ? tileCenter(tile.tx, tile.ty) : player;
    this.grdTurnToward(Math.atan2(focus.y - this.y, focus.x - this.x), dt);
    this.grdFollowPath(speed, dt);
    if (!alert) return;
    if (distance(this.x, this.y, player.x, player.y) <= reach) {
      this.caughtPlayer = true;
    } else if (!this.path.length && !this.seesPlayer) {
      this.setState('SEARCH');
    } else if (!this.path.length && this.seesPlayer && !this.moving) {
      const length = distance(this.x, this.y, player.x, player.y);
      const travel = Math.min(length, speed * TILE * dt);
      this.x += (player.x - this.x) * travel / length;
      this.y += (player.y - this.y) * travel / length;
      this.moving = travel > 0;
      this.caughtPlayer = length - travel <= reach;
    }
  }

  grdReturn(dt, world) {
    if (this.returnWaypoint === null) {
      this.waypoints.forEach((point, index) => {
        const path = this.grdPathTo(world, point.x, point.y);
        if (path !== null && (this.returnWaypoint === null || path.length < this.path.length)) {
          this.returnWaypoint = index;
          this.path = path;
        }
      });
    }
    const tile = this.path[0];
    if (tile && !isWalkable(world, tile.tx, tile.ty)) {
      this.returnWaypoint = null;
      this.path = [];
      return;
    }
    if (tile) {
      const target = tileCenter(tile.tx, tile.ty);
      this.grdTurnToward(Math.atan2(target.y - this.y, target.x - this.x), dt);
      this.grdFollowPath(TUNING.guardPatrolSpeed, dt);
    }
    if (!this.path.length && this.returnWaypoint !== null) {
      this.setState('PATROL', { waypoint: this.returnWaypoint });
    }
  }

  update(dt, world, player, exposure) {
    this.moving = false;
    this.caughtPlayer = false;
    this.enteredAlert = false;
    this.seesPlayer = pointInCone(world, this, player.x, player.y);
    if (this.seesPlayer) {
      const tx = pixelToTile(player.x), ty = pixelToTile(player.y);
      if (this.lastSeen?.tx !== tx || this.lastSeen?.ty !== ty) this.lastSeen = { tx, ty };
      if (exposure >= TUNING.exposureMax) this.setState('ALERT');
      else if (exposure > 0 && this.state !== 'ALERT') this.setState('SUSPICIOUS');
    }
    if (this.state === 'SUSPICIOUS' && exposure === 0) this.setState('RETURN');

    switch (this.state) {
      case 'PATROL': this.grdPatrol(dt); break;
      case 'SUSPICIOUS':
      case 'ALERT': this.grdPursue(dt, world, player); break;
      case 'SEARCH':
        this.stateTime = Math.min(TUNING.searchTime, this.stateTime + dt);
        this.facing = this.sweepBase + this.stateTime / TUNING.searchTime * 2 * Math.PI;
        if (this.stateTime + 1e-9 >= TUNING.searchTime) this.setState('RETURN');
        break;
      case 'RETURN': this.grdReturn(dt, world); break;
    }
    this.cone = castVisionCone(world, this);
  }
}
