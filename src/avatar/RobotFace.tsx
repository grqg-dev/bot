import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { AvatarState } from '../curriculum/types';

const SIZE = 256;

interface FaceDrawOptions {
  blink: boolean;
  talkPhase: number;
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  state: AvatarState,
  opts: FaceDrawOptions,
): void {
  const { blink, talkPhase } = opts;
  ctx.clearRect(0, 0, SIZE, SIZE);

  // Face background
  ctx.fillStyle = '#7ec8e3';
  ctx.fillRect(0, 0, SIZE, SIZE);

  const drawEyes = () => {
    ctx.fillStyle = '#1a1a2e';
    if (state === 'celebrate') {
      // Star eyes
      ctx.font = '48px sans-serif';
      ctx.fillText('⭐', 60, 110);
      ctx.fillText('⭐', 148, 110);
      return;
    }

    if (blink && state === 'idle') {
      ctx.fillRect(70, 95, 50, 6);
      ctx.fillRect(136, 95, 50, 6);
      return;
    }

    if (state === 'thinking') {
      ctx.beginPath();
      ctx.arc(95, 90, 18, 0, Math.PI * 2);
      ctx.arc(161, 90, 18, 0, Math.PI * 2);
      ctx.fill();
      // eyebrows up
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(70, 60);
      ctx.lineTo(120, 50);
      ctx.moveTo(136, 50);
      ctx.lineTo(186, 60);
      ctx.stroke();
      return;
    }

    if (state === 'encourage') {
      ctx.beginPath();
      ctx.arc(95, 100, 20, 0, Math.PI * 2);
      ctx.arc(161, 100, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(70, 65);
      ctx.quadraticCurveTo(95, 45, 120, 65);
      ctx.moveTo(136, 65);
      ctx.quadraticCurveTo(161, 45, 186, 65);
      ctx.stroke();
      return;
    }

    // Normal open eyes
    ctx.beginPath();
    ctx.arc(95, 100, 22, 0, Math.PI * 2);
    ctx.arc(161, 100, 22, 0, Math.PI * 2);
    ctx.fill();
    // eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(88, 93, 7, 0, Math.PI * 2);
    ctx.arc(154, 93, 7, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawMouth = () => {
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    if (state === 'talking') {
      const open = Math.abs(Math.sin(talkPhase)) * 18 + 6;
      ctx.fillStyle = '#e85d75';
      ctx.beginPath();
      ctx.ellipse(128, 175, 28, open, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      return;
    }

    if (state === 'celebrate') {
      ctx.beginPath();
      ctx.arc(128, 165, 40, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      return;
    }

    if (state === 'thinking') {
      ctx.beginPath();
      ctx.arc(128, 180, 12, 0, Math.PI);
      ctx.stroke();
      return;
    }

    if (state === 'encourage') {
      ctx.beginPath();
      ctx.arc(128, 170, 25, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      return;
    }

    // idle soft smile
    ctx.beginPath();
    ctx.arc(128, 168, 30, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  };

  drawEyes();
  drawMouth();
}

export function useRobotFaceTexture(state: AvatarState, talkPhase: number): THREE.CanvasTexture {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const blinkRef = useRef(false);
  const nextBlinkRef = useRef(Date.now() + 3000 + Math.random() * 2000);

  if (!canvasRef.current) {
    canvasRef.current = document.createElement('canvas');
    canvasRef.current.width = SIZE;
    canvasRef.current.height = SIZE;
    textureRef.current = new THREE.CanvasTexture(canvasRef.current);
    textureRef.current.needsUpdate = true;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (state === 'idle' && Date.now() >= nextBlinkRef.current) {
        blinkRef.current = true;
        setTimeout(() => {
          blinkRef.current = false;
          nextBlinkRef.current = Date.now() + 3000 + Math.random() * 2000;
        }, 150);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    drawFace(ctx, state, { blink: blinkRef.current, talkPhase });
    textureRef.current!.needsUpdate = true;
  }, [state, talkPhase]);

  return textureRef.current!;
}
