import * as THREE from 'three';
import { BALL_COLORS } from '../physics/billiardsPhysics';

const textureCache: Record<number, THREE.CanvasTexture> = {};

/**
 * Generates high-definition canvas texture for a pool ball (number, solid vs stripe, or cue ball)
 */
export function getBallTexture(number: number): THREE.CanvasTexture {
  if (textureCache[number]) {
    return textureCache[number];
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const baseColor = BALL_COLORS[number] || '#ffffff';

  if (number === 0) {
    // Cue ball: clean white with tiny red aiming dot
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle ivory shading gradient
    const grad = ctx.createRadialGradient(256, 128, 10, 256, 128, 240);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, '#F8FAFC');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Red alignment dot
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.arc(256, 128, 12, 0, Math.PI * 2);
    ctx.fill();
  } else if (number >= 1 && number <= 7) {
    // Solid balls
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // White circle on front and back
    drawNumberCircle(ctx, 128, 128, number);
    drawNumberCircle(ctx, 384, 128, number);
  } else if (number === 8) {
    // 8-Ball: black solid
    ctx.fillStyle = '#181C14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawNumberCircle(ctx, 128, 128, 8);
    drawNumberCircle(ctx, 384, 128, 8);
  } else {
    // Stripe balls (9-15)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Colored stripe in the middle horizontal band
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 64, canvas.width, 128);

    // White circle on front and back
    drawNumberCircle(ctx, 128, 128, number);
    drawNumberCircle(ctx, 384, 128, number);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  textureCache[number] = texture;
  return texture;
}

function drawNumberCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  num: number
) {
  // White badge circle
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, Math.PI * 2);
  ctx.fill();

  // Subtle inner shadow ring
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Number text
  ctx.fillStyle = '#09090B';
  ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(num.toString(), cx, cy + 2);
}
