import { Ball, BallType, Pocket, TrajectoryPrediction, AIDifficulty } from '../types/billiards';
import { soundEngine } from '../audio/soundEngine';

export const TABLE_DIMENSIONS = {
  length: 22,
  width: 11,
  cushionHeight: 0.4,
  pocketRadius: 0.72,
  ballRadius: 0.38,
  friction: 0.988, // Deceleration per tick
  minVelocity: 0.015,
  cushionRestitution: 0.82,
  ballRestitution: 0.94
};

// Standard 6 pocket positions (4 corners, 2 side middle pockets)
export const POCKETS: Pocket[] = [
  { id: 0, position: [-TABLE_DIMENSIONS.length / 2, 0, -TABLE_DIMENSIONS.width / 2], radius: TABLE_DIMENSIONS.pocketRadius, name: 'Top-Left Corner' },
  { id: 1, position: [0, 0, -TABLE_DIMENSIONS.width / 2 - 0.15], radius: TABLE_DIMENSIONS.pocketRadius * 0.92, name: 'Top-Middle Side' },
  { id: 2, position: [TABLE_DIMENSIONS.length / 2, 0, -TABLE_DIMENSIONS.width / 2], radius: TABLE_DIMENSIONS.pocketRadius, name: 'Top-Right Corner' },
  { id: 3, position: [-TABLE_DIMENSIONS.length / 2, 0, TABLE_DIMENSIONS.width / 2], radius: TABLE_DIMENSIONS.pocketRadius, name: 'Bottom-Left Corner' },
  { id: 4, position: [0, 0, TABLE_DIMENSIONS.width / 2 + 0.15], radius: TABLE_DIMENSIONS.pocketRadius * 0.92, name: 'Bottom-Middle Side' },
  { id: 5, position: [TABLE_DIMENSIONS.length / 2, 0, TABLE_DIMENSIONS.width / 2], radius: TABLE_DIMENSIONS.pocketRadius, name: 'Bottom-Right Corner' },
];

export const BALL_COLORS: Record<number, string> = {
  0: '#FFFFFF', // Cue Ball
  1: '#F4CE14', // 1 Yellow Solid
  2: '#1E3E62', // 2 Blue Solid
  3: '#E4003A', // 3 Red Solid
  4: '#5B2333', // 4 Purple Solid
  5: '#E65C19', // 5 Orange Solid
  6: '#15803d', // 6 Green Solid
  7: '#850000', // 7 Maroon Solid
  8: '#181C14', // 8 Black Solid
  9: '#F4CE14', // 9 Yellow Stripe
  10: '#1E3E62', // 10 Blue Stripe
  11: '#E4003A', // 11 Red Stripe
  12: '#5B2333', // 12 Purple Stripe
  13: '#E65C19', // 13 Orange Stripe
  14: '#15803d', // 14 Green Stripe
  15: '#850000', // 15 Maroon Stripe
};

export function getBallType(num: number): BallType {
  if (num === 0) return 'CUE';
  if (num === 8) return 'EIGHT';
  if (num >= 1 && num <= 7) return 'SOLID';
  return 'STRIPE';
}

/**
 * Creates the initial rack of 16 balls (Cue ball + 15 racked balls)
 */
export function createInitialRack(): Ball[] {
  const balls: Ball[] = [];
  const r = TABLE_DIMENSIONS.ballRadius;
  const spacing = r * 2.04;

  // 0. Cue Ball at Head String (-length/4)
  balls.push({
    id: 0,
    type: 'CUE',
    color: BALL_COLORS[0],
    number: 0,
    position: [-TABLE_DIMENSIONS.length * 0.28, 0, 0],
    velocity: [0, 0, 0],
    angularVelocity: [0, 0, 0],
    inPocket: false,
    radius: r,
  });

  // Triangle rack starting at Foot Spot (+length/4)
  const startX = TABLE_DIMENSIONS.length * 0.28;
  const rackOrder = [
    1, // Row 1: Apex solid
    9, 2, // Row 2: stripe, solid
    3, 8, 10, // Row 3: solid, 8-ball in center, stripe
    11, 4, 12, 5, // Row 4
    6, 13, 14, 7, 15, // Row 5: alternate corners
  ];

  let idx = 0;
  for (let row = 0; row < 5; row++) {
    const x = startX + row * spacing * Math.sin(Math.PI / 3);
    const firstZ = -row * spacing * 0.5;
    for (let col = 0; col <= row; col++) {
      const z = firstZ + col * spacing;
      const number = rackOrder[idx++];
      balls.push({
        id: number,
        type: getBallType(number),
        color: BALL_COLORS[number],
        number: number,
        position: [x, 0, z],
        velocity: [0, 0, 0],
        angularVelocity: [0, 0, 0],
        inPocket: false,
        radius: r,
      });
    }
  }

  return balls;
}

/**
 * Predicts shot trajectory for aiming line (Raycast from cue ball)
 */
export function predictTrajectory(
  balls: Ball[],
  cueAngle: number,
  maxDist: number = 26
): TrajectoryPrediction {
  const cue = balls.find((b) => b.id === 0 && !b.inPocket);
  if (!cue) {
    return { cuePath: [[0, 0, 0], [0, 0, 0]] };
  }

  const origin: [number, number, number] = [...cue.position];
  const dirX = Math.cos(cueAngle);
  const dirZ = Math.sin(cueAngle);

  // Check intersection against all active target balls
  let minTime = Infinity;
  let targetBall: Ball | null = null;

  for (const b of balls) {
    if (b.id === 0 || b.inPocket) continue;

    const dx = b.position[0] - origin[0];
    const dz = b.position[2] - origin[2];

    // Project vector onto ray direction
    const proj = dx * dirX + dz * dirZ;
    if (proj <= 0) continue; // behind cue ball

    // Perpendicular distance squared
    const perpSq = dx * dx + dz * dz - proj * proj;
    const hitRadius = cue.radius + b.radius;
    const hitRadiusSq = hitRadius * hitRadius;

    if (perpSq <= hitRadiusSq) {
      const dt = Math.sqrt(hitRadiusSq - perpSq);
      const impactTime = proj - dt;
      if (impactTime > 0 && impactTime < minTime) {
        minTime = impactTime;
        targetBall = b;
      }
    }
  }

  // Also check intersection with cushions
  const halfLen = TABLE_DIMENSIONS.length / 2 - cue.radius;
  const halfWid = TABLE_DIMENSIONS.width / 2 - cue.radius;

  let cushionTime = Infinity;
  if (dirX > 0) cushionTime = Math.min(cushionTime, (halfLen - origin[0]) / dirX);
  else if (dirX < 0) cushionTime = Math.min(cushionTime, (-halfLen - origin[0]) / dirX);

  if (dirZ > 0) cushionTime = Math.min(cushionTime, (halfWid - origin[2]) / dirZ);
  else if (dirZ < 0) cushionTime = Math.min(cushionTime, (-halfWid - origin[2]) / dirZ);

  if (!targetBall || cushionTime < minTime) {
    const dist = Math.min(cushionTime, maxDist);
    return {
      cuePath: [
        origin,
        [origin[0] + dirX * dist, 0, origin[2] + dirZ * dist],
      ],
    };
  }

  // Hit target ball
  const impactPoint: [number, number, number] = [
    origin[0] + dirX * minTime,
    0,
    origin[2] + dirZ * minTime,
  ];

  // Calculate target ball path along normal vector
  const normX = targetBall.position[0] - impactPoint[0];
  const normZ = targetBall.position[2] - impactPoint[2];
  const normLen = Math.sqrt(normX * normX + normZ * normZ) || 1;
  const nx = normX / normLen;
  const nz = normZ / normLen;

  const targetPathLen = 4.2;
  const targetPath: [number, number, number][] = [
    [...targetBall.position],
    [targetBall.position[0] + nx * targetPathLen, 0, targetBall.position[2] + nz * targetPathLen],
  ];

  // Cue ball deflection (perpendicular tangent)
  const dot = dirX * nx + dirZ * nz;
  const defX = dirX - nx * dot;
  const defZ = dirZ - nz * dot;
  const defLen = Math.sqrt(defX * defX + defZ * defZ) || 1;
  const defPathLen = 2.8;

  const cueDeflection: [number, number, number][] = [
    impactPoint,
    [
      impactPoint[0] + (defX / defLen) * defPathLen,
      0,
      impactPoint[2] + (defZ / defLen) * defPathLen,
    ],
  ];

  return {
    cuePath: [origin, impactPoint],
    targetHit: {
      ballId: targetBall.id,
      impactPoint,
      targetPath,
      cueDeflection,
    },
  };
}

/**
 * Calculates an intelligent shot for the AI player
 */
export function calculateAIShot(
  balls: Ball[],
  aiGroup: 'SOLID' | 'STRIPE' | null,
  difficulty: AIDifficulty
): { angle: number; power: number } {
  const cue = balls.find((b) => b.id === 0 && !b.inPocket);
  if (!cue) return { angle: 0, power: 0.5 };

  // Determine valid target balls
  const myBalls = balls.filter((b) => {
    if (b.inPocket || b.id === 0) return false;
    if (aiGroup === 'SOLID') return b.type === 'SOLID';
    if (aiGroup === 'STRIPE') return b.type === 'STRIPE';
    if (aiGroup === null) return b.type === 'SOLID' || b.type === 'STRIPE';
    return false;
  });

  // If all my balls are pocketed, target the 8 ball
  const targetBalls = myBalls.length > 0
    ? myBalls
    : balls.filter((b) => !b.inPocket && b.id === 8);

  if (targetBalls.length === 0) return { angle: 0, power: 0.5 };

  // Find best target ball + pocket combination
  let bestAngle = 0;
  let bestPower = 0.65;
  let maxScore = -Infinity;

  for (const tBall of targetBalls) {
    for (const pocket of POCKETS) {
      // Vector from pocket to target ball
      const vx = tBall.position[0] - pocket.position[0];
      const vz = tBall.position[2] - pocket.position[2];
      const distToPocket = Math.sqrt(vx * vx + vz * vz);

      const normX = vx / distToPocket;
      const normZ = vz / distToPocket;

      // Ideal ghost ball impact position
      const ghostX = tBall.position[0] + normX * (cue.radius + tBall.radius);
      const ghostZ = tBall.position[2] + normZ * (cue.radius + tBall.radius);

      // Vector from cue ball to ghost ball
      const cx = ghostX - cue.position[0];
      const cz = ghostZ - cue.position[2];
      const distCueToGhost = Math.sqrt(cx * cx + cz * cz);

      // Check alignment angle quality (cosine of angle between shot and pocket line)
      const shotDirX = cx / distCueToGhost;
      const shotDirZ = cz / distCueToGhost;
      const alignDot = shotDirX * (-normX) + shotDirZ * (-normZ);

      // We prefer straight shots with minimal distance
      if (alignDot > -0.1) {
        const score = alignDot * 10 - distToPocket * 0.4 - distCueToGhost * 0.3;
        if (score > maxScore) {
          maxScore = score;
          bestAngle = Math.atan2(cz, cx);
          bestPower = Math.min(0.35 + (distCueToGhost + distToPocket) * 0.045, 0.95);
        }
      }
    }
  }

  // Add random inaccuracy based on difficulty
  if (difficulty === 'EASY') {
    bestAngle += (Math.random() - 0.5) * 0.16;
    bestPower *= 0.85 + Math.random() * 0.3;
  } else if (difficulty === 'MEDIUM') {
    bestAngle += (Math.random() - 0.5) * 0.06;
    bestPower *= 0.95 + Math.random() * 0.1;
  } else {
    // PRO AI: highly precise
    bestAngle += (Math.random() - 0.5) * 0.015;
  }

  return {
    angle: bestAngle,
    power: Math.min(Math.max(bestPower, 0.3), 0.96),
  };
}

/**
 * Step physics simulation forward by dt (using sub-stepping for stability)
 */
export function stepPhysics(
  balls: Ball[],
  dt: number = 0.016,
  onCollision?: () => void,
  onCushion?: () => void,
  onPocket?: (ballId: number) => void
): boolean {
  let anyMoving = false;
  const subSteps = 6;
  const subDt = dt / subSteps;

  const halfLen = TABLE_DIMENSIONS.length / 2;
  const halfWid = TABLE_DIMENSIONS.width / 2;
  const cRest = TABLE_DIMENSIONS.cushionRestitution;
  const bRest = TABLE_DIMENSIONS.ballRestitution;

  for (let s = 0; s < subSteps; s++) {
    // 1. Move balls & apply friction
    for (const b of balls) {
      if (b.inPocket) continue;

      const speedSq = b.velocity[0] * b.velocity[0] + b.velocity[2] * b.velocity[2];
      if (speedSq > TABLE_DIMENSIONS.minVelocity * TABLE_DIMENSIONS.minVelocity) {
        anyMoving = true;

        b.position[0] += b.velocity[0] * subDt;
        b.position[2] += b.velocity[2] * subDt;

        // Apply friction
        const frictionFactor = Math.pow(TABLE_DIMENSIONS.friction, subDt * 60);
        b.velocity[0] *= frictionFactor;
        b.velocity[2] *= frictionFactor;

        // Update angular rotation based on rolling
        b.angularVelocity[0] = b.velocity[2] / b.radius;
        b.angularVelocity[2] = -b.velocity[0] / b.radius;
      } else {
        b.velocity[0] = 0;
        b.velocity[2] = 0;
        b.angularVelocity[0] = 0;
        b.angularVelocity[2] = 0;
      }
    }

    // 2. Check Pocketing
    for (const b of balls) {
      if (b.inPocket) continue;

      for (const p of POCKETS) {
        const dx = b.position[0] - p.position[0];
        const dz = b.position[2] - p.position[2];
        const distSq = dx * dx + dz * dz;

        if (distSq < p.radius * p.radius) {
          b.inPocket = true;
          b.velocity = [0, 0, 0];
          b.position = [p.position[0], -0.6, p.position[2]];
          soundEngine.playPocketDrop();
          if (onPocket) onPocket(b.id);
          break;
        }
      }
    }

    // 3. Check Cushion collisions
    for (const b of balls) {
      if (b.inPocket) continue;

      const minX = -halfLen + b.radius;
      const maxX = halfLen - b.radius;
      const minZ = -halfWid + b.radius;
      const maxZ = halfWid - b.radius;

      let hitCushion = false;

      if (b.position[0] < minX) {
        b.position[0] = minX;
        b.velocity[0] = -b.velocity[0] * cRest;
        hitCushion = true;
      } else if (b.position[0] > maxX) {
        b.position[0] = maxX;
        b.velocity[0] = -b.velocity[0] * cRest;
        hitCushion = true;
      }

      if (b.position[2] < minZ) {
        b.position[2] = minZ;
        b.velocity[2] = -b.velocity[2] * cRest;
        hitCushion = true;
      } else if (b.position[2] > maxZ) {
        b.position[2] = maxZ;
        b.velocity[2] = -b.velocity[2] * cRest;
        hitCushion = true;
      }

      if (hitCushion) {
        const speed = Math.sqrt(b.velocity[0] * b.velocity[0] + b.velocity[2] * b.velocity[2]);
        soundEngine.playCushionBounce(Math.min(speed / 15, 1));
        if (onCushion) onCushion();
      }
    }

    // 4. Ball-to-Ball elastic collisions
    for (let i = 0; i < balls.length; i++) {
      const b1 = balls[i];
      if (b1.inPocket) continue;

      for (let j = i + 1; j < balls.length; j++) {
        const b2 = balls[j];
        if (b2.inPocket) continue;

        const dx = b2.position[0] - b1.position[0];
        const dz = b2.position[2] - b1.position[2];
        const distSq = dx * dx + dz * dz;
        const minDist = b1.radius + b2.radius;

        if (distSq < minDist * minDist && distSq > 0.00001) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const nz = dz / dist;

          // Separate overlapping balls
          const overlap = minDist - dist;
          b1.position[0] -= nx * overlap * 0.5;
          b1.position[2] -= nz * overlap * 0.5;
          b2.position[0] += nx * overlap * 0.5;
          b2.position[2] += nz * overlap * 0.5;

          // Relative velocity
          const rvx = b2.velocity[0] - b1.velocity[0];
          const rvz = b2.velocity[2] - b1.velocity[2];

          const velAlongNormal = rvx * nx + rvz * nz;

          // Do not resolve if velocities are separating
          if (velAlongNormal < 0) {
            const impulse = -(1 + bRest) * velAlongNormal * 0.5;
            const impulseX = impulse * nx;
            const impulseZ = impulse * nz;

            b1.velocity[0] -= impulseX;
            b1.velocity[2] -= impulseZ;
            b2.velocity[0] += impulseX;
            b2.velocity[2] += impulseZ;

            const impactSpeed = Math.abs(velAlongNormal);
            soundEngine.playBallCollision(Math.min(impactSpeed / 18, 1));
            if (onCollision) onCollision();
          }
        }
      }
    }
  }

  return anyMoving;
}
