import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BabushkaProfile, FillingType, PirozhokInventory, RewardResult } from '../types/game';
import { FILLINGS, FILLING_ORDER } from '../data/gameData';
import { soundEngine } from '../utils/sound';
import { X, Sparkles, ArrowLeftRight, Volume2 } from 'lucide-react';

interface LipBrushMinigameProps {
  babushka: BabushkaProfile;
  craving: FillingType;
  inventory: PirozhokInventory;
  kirikiBuffActive: boolean;
  rollingPinOwned?: boolean;
  onComplete: (result: RewardResult) => void;
  onCancel: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  kind: 'crumb' | 'steam' | 'spark' | 'drool';
}

const CANVAS_W = 520;
const CANVAS_H = 340;
const LIPS_X = 260;
const LIPS_Y = 205;
const LIPS_RADIUS_X = 72;
const LIPS_RADIUS_Y = 40;

export const LipBrushMinigame: React.FC<LipBrushMinigameProps> = ({
  babushka,
  craving,
  inventory,
  kirikiBuffActive,
  rollingPinOwned = false,
  onComplete,
  onCancel,
}) => {
  const availableFillings = FILLING_ORDER.filter((f) => inventory[f] > 0);
  const initialFilling: FillingType =
    inventory[craving] > 0 ? craving : availableFillings[0] || 'cabbage';

  const [selectedFilling, setSelectedFilling] = useState<FillingType>(initialFilling);
  const [delight, setDelight] = useState<number>(0);
  const [speech, setSpeech] = useState<string>(babushka.greetingLines[0]);
  const [memeCaption, setMemeCaption] = useState<string>(babushka.memeTag);
  const [reward, setReward] = useState<RewardResult | null>(null);
  const [isTouchingLips, setIsTouchingLips] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const memeImgRef = useRef<HTMLImageElement | null>(null);
  const memeImgLoadedRef = useRef<boolean>(false);

  const pirozhokPos = useRef<{ x: number; y: number }>({ x: 260, y: 288 });
  const prevPirozhokPos = useRef<{ x: number; y: number }>({ x: 260, y: 288 });
  const keysDown = useRef<Set<string>>(new Set());
  const delightRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const lipWiggleRef = useRef<number>(0);
  const completedRef = useRef<boolean>(false);
  const lastSpeechStage = useRef<number>(0);

  // Load this babushka's unique meme portrait & speak greeting
  useEffect(() => {
    memeImgLoadedRef.current = false;
    const img = new Image();
    img.src = babushka.imageUrl;
    img.onload = () => {
      memeImgRef.current = img;
      memeImgLoadedRef.current = true;
    };

    const greeting =
      babushka.greetingLines[Math.floor(Math.random() * babushka.greetingLines.length)];
    setSpeech(greeting);
    soundEngine.speakRussian(greeting, {
      pitch: babushka.voicePitch,
      rate: babushka.voiceRate,
      priority: true,
    });
  }, [babushka]);

  const finishMinigame = useCallback(
    (fillingUsed: FillingType) => {
      if (completedRef.current) return;
      completedRef.current = true;
      soundEngine.playReward();

      const matched = fillingUsed === craving;
      let gazyava = matched ? 4 : 2;
      let kiriki = matched ? 3 : 2;
      if (kirikiBuffActive) {
        gazyava += 2;
        kiriki += 2;
      }

      const phrase =
        babushka.rewardLines[Math.floor(Math.random() * babushka.rewardLines.length)];
      setSpeech(phrase);
      setMemeCaption('БАБУШКА В ВОСТОРГЕ!');
      soundEngine.speakRussian(phrase, {
        pitch: babushka.voicePitch,
        rate: babushka.voiceRate,
        priority: true,
      });

      setReward({
        gazyava,
        kiriki,
        matchedCraving: matched,
        fillingUsed,
        babushkaName: babushka.name,
        phrase,
      });
    },
    [babushka, craving, kirikiBuffActive]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'Escape') {
        e.preventDefault();
        if (reward) {
          onComplete(reward);
        } else {
          onCancel();
        }
        return;
      }
      if ((code === 'KeyE' || code === 'Space' || code === 'Enter') && reward) {
        e.preventDefault();
        onComplete(reward);
        return;
      }
      keysDown.current.add(code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysDown.current.delete(e.code);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onCancel, onComplete, reward]);

  useEffect(() => {
    let animId = 0;
    let lastTime = performance.now();

    const spawnParticles = (x: number, y: number, intensity: number) => {
      const fillingInfo = FILLINGS[selectedFilling];
      if (Math.random() < 0.55) {
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 28,
          y: y + (Math.random() - 0.5) * 14,
          vx: (Math.random() - 0.5) * 45,
          vy: 30 + Math.random() * 55,
          size: 2.2 + Math.random() * 2.5,
          alpha: 1,
          color: fillingInfo.crustColor,
          kind: 'crumb',
        });
      }
      if (Math.random() < 0.45) {
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y - 14,
          vx: (Math.random() - 0.5) * 18,
          vy: -25 - Math.random() * 25,
          size: 4 + Math.random() * 5,
          alpha: 0.7,
          color: fillingInfo.steamTint,
          kind: 'steam',
        });
      }
      if (intensity > 0.3 && Math.random() < 0.4) {
        particlesRef.current.push({
          x: LIPS_X + (Math.random() - 0.5) * 76,
          y: LIPS_Y + (Math.random() - 0.5) * 28,
          vx: (Math.random() - 0.5) * 60,
          vy: -40 - Math.random() * 45,
          size: 3 + Math.random() * 3,
          alpha: 1,
          color: '#FBBF24',
          kind: 'spark',
        });
      }
    };

    const update = (dt: number, now: number) => {
      if (!completedRef.current) {
        const speed = 350;
        let dx = 0;
        let dy = 0;
        if (keysDown.current.has('KeyA') || keysDown.current.has('ArrowLeft')) dx -= 1;
        if (keysDown.current.has('KeyD') || keysDown.current.has('ArrowRight')) dx += 1;
        if (keysDown.current.has('KeyW') || keysDown.current.has('ArrowUp')) dy -= 1;
        if (keysDown.current.has('KeyS') || keysDown.current.has('ArrowDown')) dy += 1;

        if (dx !== 0 || dy !== 0) {
          const len = Math.hypot(dx, dy);
          pirozhokPos.current.x = Math.max(
            48,
            Math.min(CANVAS_W - 48, pirozhokPos.current.x + (dx / len) * speed * dt)
          );
          pirozhokPos.current.y = Math.max(
            40,
            Math.min(CANVAS_H - 36, pirozhokPos.current.y + (dy / len) * speed * dt)
          );
        }
      }

      if (!completedRef.current && Math.random() < 0.16) {
        const mouthSide = (Math.random() - 0.5) * 64;
        particlesRef.current.push({
          x: LIPS_X + mouthSide,
          y: LIPS_Y + 8,
          vx: (Math.random() - 0.5) * 8,
          vy: 55 + Math.random() * 55,
          size: 2.8 + Math.random() * 2.5,
          alpha: 0.92,
          color: '#BAE6FD',
          kind: 'drool',
        });
      }

      const px = pirozhokPos.current.x;
      const py = pirozhokPos.current.y;
      const vx = (px - prevPirozhokPos.current.x) / Math.max(dt, 0.008);
      const vy = (py - prevPirozhokPos.current.y) / Math.max(dt, 0.008);
      const moveDist = Math.hypot(px - prevPirozhokPos.current.x, py - prevPirozhokPos.current.y);
      prevPirozhokPos.current = { x: px, y: py };

      const normDist =
        Math.pow((px - LIPS_X) / LIPS_RADIUS_X, 2) +
        Math.pow((py - LIPS_Y) / LIPS_RADIUS_Y, 2);
      const touching = normDist <= 1.25;
      setIsTouchingLips(touching);

      if (touching && !completedRef.current && moveDist > 0.6) {
        const speedBoost = Math.min(1.8, Math.hypot(vx, vy) / 260);
        const toolMult = rollingPinOwned ? 2.0 : 1.0;
        const gain = moveDist * 0.16 * (0.65 + speedBoost * 0.45) * toolMult;
        const nextDelight = Math.min(100, delightRef.current + gain);
        delightRef.current = nextDelight;
        setDelight(nextDelight);
        lipWiggleRef.current = Math.min(1, lipWiggleRef.current + 0.38);

        soundEngine.playLipBrush(nextDelight / 100);
        spawnParticles(px, py, speedBoost);

        if (nextDelight >= 25 && lastSpeechStage.current < 1) {
          lastSpeechStage.current = 1;
          const line = babushka.brushingLines[0];
          setSpeech(line);
          setMemeCaption('ОЙ ХОРОШО!');
          soundEngine.speakRussian(line, {
            pitch: babushka.voicePitch,
            rate: babushka.voiceRate,
          });
        } else if (nextDelight >= 55 && lastSpeechStage.current < 2) {
          lastSpeechStage.current = 2;
          const line = babushka.brushingLines[1] || babushka.brushingLines[0];
          setSpeech(line);
          setMemeCaption('СЛЮНКИ ТЕКУТ!');
          soundEngine.speakRussian(line, {
            pitch: babushka.voicePitch,
            rate: babushka.voiceRate,
          });
        } else if (nextDelight >= 82 && lastSpeechStage.current < 3) {
          lastSpeechStage.current = 3;
          const line = babushka.brushingLines[2] || babushka.brushingLines[0];
          setSpeech(line);
          setMemeCaption('ДАВАЙ ЕЩЁ КОРОЧКУ!');
          soundEngine.speakRussian(line, {
            pitch: babushka.voicePitch,
            rate: babushka.voiceRate,
          });
        }

        if (nextDelight >= 100) {
          finishMinigame(selectedFilling);
        }
      } else {
        lipWiggleRef.current = Math.max(0, lipWiggleRef.current - dt * 3.5);
        if (Math.random() < 0.15) {
          particlesRef.current.push({
            x: px + (Math.random() - 0.5) * 20,
            y: py - 14,
            vx: (Math.random() - 0.5) * 10,
            vy: -18 - Math.random() * 16,
            size: 3 + Math.random() * 3.5,
            alpha: 0.45,
            color: FILLINGS[selectedFilling].steamTint,
            kind: 'steam',
          });
        }
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === 'crumb' || p.kind === 'drool') {
          p.vy += 170 * dt;
          p.alpha -= dt * 1.1;
        } else if (p.kind === 'steam') {
          p.size += dt * 4;
          p.alpha -= dt * 0.7;
        } else {
          p.alpha -= dt * 1.5;
        }
        return p.alpha > 0.03 && p.y < CANVAS_H + 10;
      });

      drawScene(now, touching);
    };

    const drawScene = (now: number, touching: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== CANVAS_W * dpr || canvas.height !== CANVAS_H * dpr) {
        canvas.width = CANVAS_W * dpr;
        canvas.height = CANVAS_H * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bgGrad.addColorStop(0, '#F5D8A8');
      bgGrad.addColorStop(1, '#D3B88C');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      const satisfaction = delightRef.current / 100;
      const wiggle = Math.sin(now * 0.03) * lipWiggleRef.current * 4;
      const bounceScale = 1 + lipWiggleRef.current * 0.04;

      if (memeImgLoadedRef.current && memeImgRef.current) {
        const img = memeImgRef.current;
        const frameW = 350;
        const frameH = CANVAS_H;
        const frameX = (CANVAS_W - frameW) / 2;

        ctx.save();
        ctx.translate(CANVAS_W / 2 + wiggle * 0.5, CANVAS_H / 2);
        ctx.scale(bounceScale, bounceScale);
        ctx.translate(-CANVAS_W / 2, -CANVAS_H / 2);

        ctx.drawImage(img, 0, 0, img.width, img.height, frameX, 0, frameW, frameH);

        if (satisfaction > 0.05) {
          ctx.fillStyle = `rgba(244, 63, 94, ${satisfaction * 0.14})`;
          ctx.fillRect(frameX, 0, frameW, frameH);
        }
        ctx.restore();

        const leftFade = ctx.createLinearGradient(frameX - 6, 0, frameX + 46, 0);
        leftFade.addColorStop(0, '#E1C498');
        leftFade.addColorStop(1, 'rgba(225, 196, 152, 0)');
        ctx.fillStyle = leftFade;
        ctx.fillRect(0, 0, frameX + 46, CANVAS_H);

        const rightFade = ctx.createLinearGradient(
          frameX + frameW - 46,
          0,
          frameX + frameW + 6,
          0
        );
        rightFade.addColorStop(0, 'rgba(225, 196, 152, 0)');
        rightFade.addColorStop(1, '#E1C498');
        ctx.fillStyle = rightFade;
        ctx.fillRect(frameX + frameW - 46, 0, CANVAS_W - (frameX + frameW - 46), CANVAS_H);
      }

      // Glistening animated drool strands
      const droolLen1 = 18 + Math.sin(now * 0.005) * 8 + satisfaction * 14;
      const droolLen2 = 14 + Math.cos(now * 0.006 + 1) * 7 + satisfaction * 10;
      const drawDroolStrand = (sx: number, sy: number, length: number) => {
        ctx.save();
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.9)';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(
          sx + Math.sin(now * 0.008) * 3,
          sy + length * 0.5,
          sx,
          sy + length
        );
        ctx.stroke();

        ctx.fillStyle = 'rgba(224, 242, 254, 0.95)';
        ctx.beginPath();
        ctx.arc(sx, sy + length, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawDroolStrand(LIPS_X - 24 + wiggle, LIPS_Y + 8, droolLen1);
      drawDroolStrand(LIPS_X + 20 + wiggle, LIPS_Y + 6, droolLen2);

      if (!completedRef.current) {
        const pulse = 0.45 + Math.sin(now * 0.007) * 0.28;
        ctx.save();
        ctx.strokeStyle = touching
          ? 'rgba(16, 185, 129, 0.9)'
          : `rgba(245, 158, 11, ${pulse})`;
        ctx.lineWidth = touching ? 3.5 : 2.2;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.ellipse(LIPS_X, LIPS_Y, LIPS_RADIUS_X, LIPS_RADIUS_Y, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        if (p.kind === 'drool') {
          ctx.ellipse(p.x, p.y, p.size * 0.75, p.size * 1.25, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
      });

      if (!completedRef.current) {
        const px = pirozhokPos.current.x;
        const py = pirozhokPos.current.y;
        const filling = FILLINGS[selectedFilling];
        const tilt = Math.max(-0.3, Math.min(0.3, (px - LIPS_X) * 0.0022));

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(tilt);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(2, 14, 34, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        const crustGrad = ctx.createLinearGradient(-32, -16, 32, 16);
        crustGrad.addColorStop(0, '#F6C26B');
        crustGrad.addColorStop(0.5, filling.crustColor);
        crustGrad.addColorStop(1, '#9E5614');

        ctx.fillStyle = crustGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 38, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5C310A';
        ctx.lineWidth = 2.4;
        ctx.stroke();

        ctx.strokeStyle = '#FCE1A6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-24, -2);
        ctx.quadraticCurveTo(-12, -8, 0, -2);
        ctx.quadraticCurveTo(12, 4, 24, -2);
        ctx.stroke();

        ctx.fillStyle = filling.fillingColor;
        ctx.beginPath();
        ctx.ellipse(17, 2, 7.5, 4.5, 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      if (!completedRef.current) {
        ctx.save();
        ctx.font = '900 22px Rubik, Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(memeCaption, CANVAS_W / 2, 34);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(memeCaption, CANVAS_W / 2, 34);
        ctx.restore();
      }

      ctx.restore();
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      update(dt, now);
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [babushka, finishMinigame, memeCaption, selectedFilling]);

  const updatePointerPos = (clientX: number, clientY: number) => {
    if (completedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    pirozhokPos.current = {
      x: Math.max(40, Math.min(CANVAS_W - 40, (clientX - rect.left) * scaleX)),
      y: Math.max(36, Math.min(CANVAS_H - 30, (clientY - rect.top) * scaleY)),
    };
  };

  const cravingInfo = FILLINGS[craving];
  const isMatch = selectedFilling === craving;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Угощение: ${babushka.name}`}
    >
      <div className="w-full max-w-2xl bg-[#FAF7F2] text-[#1E2229] rounded-2xl shadow-2xl border border-[#E2D9C8] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#F1EAE0] border-b border-[#E2D9C8]">
          <div>
            <h2 className="font-display text-xl font-bold text-[#1E2229] leading-tight">
              {babushka.name}
            </h2>
            <p className="text-xs text-[#645C52] mt-0.5">
              {babushka.role} · Ждёт:{' '}
              <strong className="text-[#9A4D0D]">{cravingInfo.label}</strong>
              {isMatch ? ' (x2 награда)' : ''}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                soundEngine.speakRussian(speech, {
                  pitch: babushka.voicePitch,
                  rate: babushka.voiceRate,
                  priority: true,
                })
              }
              className="p-2 rounded-lg text-[#574F45] hover:bg-[#E5DCCF] hover:text-[#1E2229] transition-colors cursor-pointer"
              aria-label="Озвучить фразу"
              title="Озвучить фразу"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => (reward ? onComplete(reward) : onCancel())}
              className="p-2 rounded-lg text-[#574F45] hover:bg-[#E5DCCF] hover:text-[#1E2229] transition-colors cursor-pointer"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 pt-4 pb-2">
          <div className="bg-white border border-[#E2D9C8] rounded-xl px-4 py-2.5 text-sm font-medium text-[#2A2622]">
            «{speech}»
          </div>
        </div>

        <div className="px-6 py-2">
          <div className="relative rounded-xl overflow-hidden border border-[#D8CEBE] bg-[#E1C498] select-none">
            <canvas
              ref={canvasRef}
              onPointerMove={(e) => updatePointerPos(e.clientX, e.clientY)}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                updatePointerPos(e.clientX, e.clientY);
              }}
              className="w-full h-auto block touch-none cursor-grab active:cursor-grabbing"
              style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
            />

            {!reward && (
              <div className="pointer-events-none absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs font-medium">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1E2229]/85 text-[#FAF7F2]">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                  Водите пирожком по губам мышкой или A / D
                </span>
                {isTouchingLips && (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-700/95 text-white font-semibold">
                    Вкуснотища!
                  </span>
                )}
              </div>
            )}

            {reward && (
              <div className="absolute inset-0 bg-[#1E2229]/90 flex flex-col items-center justify-center p-6 text-center text-[#FAF7F2]">
                <div className="inline-flex items-center gap-2 text-amber-300 text-sm font-semibold mb-2">
                  <Sparkles className="w-4 h-4" />
                  Бабушка довольна!
                </div>
                <h3 className="font-display text-2xl font-bold mb-4">
                  Награда от {reward.babushkaName}
                </h3>
                <div className="flex items-center gap-6 mb-5">
                  <div className="px-5 py-3 rounded-xl bg-emerald-950 border border-emerald-500/40">
                    <div className="text-xs text-emerald-200 mb-0.5">Газява</div>
                    <div className="font-mono-tabular text-3xl font-bold text-emerald-300">
                      +{reward.gazyava}
                    </div>
                  </div>
                  <div className="px-5 py-3 rounded-xl bg-amber-950 border border-amber-500/40">
                    <div className="text-xs text-amber-200 mb-0.5">Кирики</div>
                    <div className="font-mono-tabular text-3xl font-bold text-amber-300">
                      +{reward.kiriki}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-stone-300 mb-5">
                  {reward.matchedCraving
                    ? 'Точное попадание по вкусу! Получен двойной бонус.'
                    : 'В следующий раз принесите любимую начинку для x2 награды.'}
                </p>
                <button
                  type="button"
                  onClick={() => onComplete(reward)}
                  className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#1E2229] font-bold text-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  Забрать и бежать дальше (E)
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pt-2 pb-5 space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#574F45] mb-1.5">
              <span>Восторг бабушки от корочки</span>
              <span className="font-mono-tabular text-[#1E2229]">{Math.round(delight)}%</span>
            </div>
            <div className="w-full h-3 rounded-md bg-[#E5DCCF] overflow-hidden">
              <div
                className="h-full transition-all duration-75"
                style={{
                  width: `${delight}%`,
                  background:
                    delight > 75
                      ? 'linear-gradient(90deg, #E08E26, #10B981)'
                      : 'linear-gradient(90deg, #D97706, #F59E0B)',
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-[#645C52] mr-1">Пирожок:</span>
              {FILLING_ORDER.map((fId) => {
                const count = inventory[fId];
                const info = FILLINGS[fId];
                const active = selectedFilling === fId;
                const desired = fId === craving;
                return (
                  <button
                    key={fId}
                    type="button"
                    disabled={count <= 0 || !!reward}
                    onClick={() => setSelectedFilling(fId)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border ${
                      active
                        ? 'bg-[#1E2229] text-white border-[#1E2229]'
                        : 'bg-white text-[#2A2622] border-[#D8CEBE] hover:bg-[#F1EAE0]'
                    }`}
                  >
                    {info.shortLabel} ({count}){desired ? ' ★' : ''}
                  </button>
                );
              })}
            </div>

            {!reward && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 text-xs font-semibold text-[#645C52] hover:text-[#1E2229] transition-colors cursor-pointer whitespace-nowrap"
              >
                Отойти (Esc)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
