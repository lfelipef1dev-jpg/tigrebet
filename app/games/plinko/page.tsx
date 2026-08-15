'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import GameLayout from '../../components/GameLayout';
import { toast } from 'sonner';
import { plinkoAPI } from '../../lib/api';
import { sounds } from '../../lib/sounds';
import confetti from 'canvas-confetti';

const MULTIPLIERS: Record<number, number[]> = {
  8:  [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
  12: [10, 5, 2, 1.1, 1.0, 0.5, 0.3, 0.5, 1.0, 1.1, 2, 5, 10],
  16: [20, 10, 5, 2, 1.1, 1.0, 0.5, 0.3, 0.2, 0.3, 0.5, 1.0, 1.1, 2, 5, 10, 20],
};
const BET_AMOUNTS = [1, 5, 10, 25, 50, 100];

const PEG_R = 3.5;
const BALL_R = 7;
const ROW_H = 32;
const TOP_PAD = 20;
const BUCKET_H = 28;

function multColor(m: number) {
  if (m >= 10) return '#f97316';
  if (m >= 5)  return '#eab308';
  if (m >= 2)  return '#22c55e';
  if (m >= 1)  return '#059669';
  return '#ef4444';
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

type WP = { x: number; y: number; isPeg: boolean; pegKey?: string };

function computeWaypoints(rows: number, path: number[], cx: number, sp: number): { wps: WP[]; finalCol: number } {
  const wps: WP[] = [];
  wps.push({ x: cx, y: TOP_PAD - 28, isPeg: false });

  let col = 0;
  for (let r = 0; r < rows; r++) {
    const px = cx + (col - r / 2) * sp;
    const py = TOP_PAD + r * ROW_H;
    wps.push({ x: px, y: py, isPeg: true, pegKey: `${r},${col}` });

    const dir = path[r] === 1 ? 1 : -1;
    wps.push({ x: px + dir * sp * 0.42, y: py + ROW_H * 0.52, isPeg: false });

    col += path[r];
    const nx = cx + (col - (r + 1) / 2) * sp;
    const ny = TOP_PAD + (r + 1) * ROW_H - 7;
    wps.push({ x: nx, y: ny, isPeg: false });
  }

  const finalX = cx + (col - rows / 2) * sp;
  wps.push({ x: finalX, y: TOP_PAD + rows * ROW_H + 5, isPeg: false });
  wps.push({ x: finalX, y: TOP_PAD + rows * ROW_H + BUCKET_H * 0.5, isPeg: false });

  return { wps, finalCol: col };
}

function draw(
  ctx: CanvasRenderingContext2D,
  dpr: number,
  rows: number,
  mults: number[],
  sp: number,
  ball: { x: number; y: number } | null,
  winBucket: number | null,
  flashKey: string | null,
) {
  const W = ctx.canvas.width / dpr;
  const H = ctx.canvas.height / dpr;
  const cx = W / 2;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#080810';
  ctx.fillRect(0, 0, W, H);

  // Subtle glow bg
  const g = ctx.createRadialGradient(cx, TOP_PAD + rows * ROW_H * 0.3, 10, cx, TOP_PAD + rows * ROW_H * 0.3, W * 0.7);
  g.addColorStop(0, 'rgba(236,72,153,0.04)');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Pegs
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= r; c++) {
      const x = cx + (c - r / 2) * sp;
      const y = TOP_PAD + r * ROW_H;
      const key = `${r},${c}`;
      const flash = flashKey === key;
      ctx.beginPath();
      ctx.arc(x, y, flash ? PEG_R + 2 : PEG_R, 0, Math.PI * 2);
      ctx.shadowBlur = flash ? 14 : 3;
      ctx.shadowColor = flash ? '#ec4899' : 'rgba(255,255,255,0.15)';
      ctx.fillStyle = flash ? '#f472b6' : 'rgba(255,255,255,0.35)';
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;

  // Buckets
  mults.forEach((m, i) => {
    const bx = cx + (i - rows / 2) * sp;
    const by = TOP_PAD + rows * ROW_H + 5;
    const bw = sp - 3;
    const bh = BUCKET_H - 2;
    const color = multColor(m);
    const isWin = winBucket === i;

    rrect(ctx, bx - bw / 2, by, bw, bh, 5);
    ctx.shadowBlur = isWin ? 16 : 0;
    ctx.shadowColor = color;
    ctx.fillStyle = isWin ? color : color + '50';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = isWin ? '#000' : 'rgba(255,255,255,0.75)';
    ctx.font = `bold ${sp < 24 ? 7 : sp < 30 ? 8 : 9}px system-ui,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${m}x`, bx, by + bh / 2);
  });

  // Ball
  if (ball && ball.y > -BALL_R - 5) {
    const gr = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, BALL_R);
    gr.addColorStop(0, '#fce7f3');
    gr.addColorStop(0.5, '#ec4899');
    gr.addColorStop(1, '#9d174d');
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ec4899';
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export default function PlinkoPage() {
  const { game, setBalance } = useStore();
  const [betAmount, setBetAmount] = useState(10);
  const [rows, setRows] = useState<8 | 12 | 16>(8);
  const [isDropping, setIsDropping] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [lastMult, setLastMult] = useState<number | null>(null);
  const [winBucket, setWinBucket] = useState<number | null>(null);
  const [history, setHistory] = useState<{ mult: number; win: number }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const droppingRef = useRef(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const canvasH = (r: number) => TOP_PAD + r * ROW_H + BUCKET_H + 14;

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.getBoundingClientRect().width || canvas.offsetWidth || 320;
    const H = canvasH(rows);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const sp = (W - 18) / (rows + 1);
    draw(ctx, dpr, rows, MULTIPLIERS[rows], sp, null, null, null);
  }, [rows]);

  useEffect(() => {
    initCanvas();
    return () => cancelAnimationFrame(rafRef.current);
  }, [initCanvas]);

  const dropBall = async () => {
    if (droppingRef.current) return;
    const balance = game.balance[game.selectedCoin];
    if (balance < betAmount) { toast.error('Saldo insuficiente'); return; }

    droppingRef.current = true;
    setIsDropping(true);
    setLastWin(null);
    setWinBucket(null);

    const canvas = canvasRef.current;
    if (!canvas) { droppingRef.current = false; setIsDropping(false); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { droppingRef.current = false; setIsDropping(false); return; }

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.getBoundingClientRect().width || 320;
    const cx = W / 2;
    const r = rowsRef.current;
    const sp = (W - 18) / (r + 1);
    const mults = MULTIPLIERS[r];

    sounds.spin();

    try {
      const res = await plinkoAPI.playPlinko({ coin: game.selectedCoin, amount: betAmount, rows: r });
      if (res.data.code !== 200) throw new Error(res.data.msg || 'Erro');

      const { path, finalIndex, multiplier, win, balance: newBal } = res.data.data;
      const { wps } = computeWaypoints(r, path, cx, sp);

      const STEP_MS = Math.max(40, 80 - r * 1.5);
      let wpIdx = 0;
      let stepStart: number | null = null;
      let flashKey: string | null = null;
      const soundedKeys = new Set<string>();

      await new Promise<void>(resolve => {
        const loop = (ts: number) => {
          if (wpIdx >= wps.length - 1) {
            draw(ctx, dpr, r, mults, sp, null, finalIndex, null);
            resolve();
            return;
          }

          if (stepStart === null) stepStart = ts;
          const raw = (ts - stepStart) / STEP_MS;
          const t = Math.min(raw, 1);
          const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

          const from = wps[wpIdx];
          const to = wps[wpIdx + 1];
          const bx = from.x + (to.x - from.x) * ease;
          const by = from.y + (to.y - from.y) * ease;

          if (to.isPeg && to.pegKey) {
            flashKey = to.pegKey;
            if (t > 0.6 && !soundedKeys.has(to.pegKey)) {
              soundedKeys.add(to.pegKey);
              sounds.tick();
            }
          } else {
            flashKey = null;
          }

          draw(ctx, dpr, r, mults, sp, { x: bx, y: by }, null, flashKey);

          if (t >= 1) {
            wpIdx++;
            stepStart = null;
          }

          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      });

      setWinBucket(finalIndex);
      setBalance(game.selectedCoin, newBal);
      setLastWin(win);
      setLastMult(multiplier);
      setHistory(prev => [{ mult: multiplier, win }, ...prev.slice(0, 9)]);

      if (win >= betAmount * 5) {
        sounds.bigWin();
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        toast.success(`🎉 x${multiplier} → +R$ ${win.toFixed(2)}`);
      } else if (win > 0) {
        sounds.win();
        toast.success(`x${multiplier} → R$ ${win.toFixed(2)}`);
      } else {
        sounds.loss();
        toast.error(`x${multiplier} — Tente novamente!`);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { msg?: string } }; message?: string };
      toast.error(e?.response?.data?.msg || e?.message || 'Erro ao jogar');
    } finally {
      droppingRef.current = false;
      setIsDropping(false);
    }
  };

  return (
    <GameLayout
      title="PLINKO SUPREME"
      subtitle="A Bola da Sorte"
      icon="🔵"
      themeColor="pink"
      onAction={dropBall}
      actionText={isDropping ? '⚡ CAINDO...' : `🔵 SOLTAR BOLA — R$ ${betAmount}`}
      actionDisabled={isDropping}
      showHistory
      isWin={!isDropping && (lastWin ?? 0) > 0}
      history={
        <div className="grid grid-cols-5 gap-2">
          {history.map((h, i) => (
            <div key={i} className={`rounded-xl py-2 text-center font-black text-[10px] border ${
              h.win >= betAmount ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'
            }`}>x{h.mult}</div>
          ))}
        </div>
      }
    >
      {/* Config */}
      <div className="bg-[#111] border border-white/8 rounded-[28px] p-5 mb-4 flex gap-4">
        <div className="flex-1">
          <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">Aposta (R$)</div>
          <div className="grid grid-cols-3 gap-1.5">
            {BET_AMOUNTS.map(a => (
              <button key={a} onClick={() => setBetAmount(a)} disabled={isDropping}
                className={`py-2.5 rounded-xl font-black text-xs border transition-all ${
                  betAmount === a ? 'bg-pink-500 border-pink-400 text-black' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                }`}>{a}</button>
            ))}
          </div>
        </div>
        <div className="w-32">
          <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">Fileiras</div>
          <div className="flex flex-col gap-1.5">
            {([8, 12, 16] as const).map(rv => (
              <button key={rv} onClick={() => !isDropping && setRows(rv)} disabled={isDropping}
                className={`py-2 rounded-xl font-black text-xs border transition-all ${
                  rows === rv ? 'bg-pink-500 border-pink-400 text-black' : 'bg-white/5 border-transparent text-gray-400'
                }`}>{rv} {rv === 8 ? '(Fácil)' : rv === 12 ? '(Médio)' : '(Difícil)'}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="bg-[#080810] border border-pink-500/10 rounded-[28px] overflow-hidden mb-4 p-3">
        <canvas ref={canvasRef} className="w-full block" />
      </div>

      {/* Result */}
      {lastWin !== null && !isDropping && (
        <div className={`rounded-2xl p-4 text-center mb-4 border ${
          lastWin > 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/20'
        }`}>
          <div className="text-[9px] uppercase tracking-widest text-gray-500 font-black mb-1">
            {lastWin > 0 ? `x${lastMult} aplicado` : 'Sem prêmio'}
          </div>
          <div className={`text-3xl font-black ${lastWin > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {lastWin > 0 ? `+R$ ${lastWin.toFixed(2)}` : `-R$ ${betAmount.toFixed(2)}`}
          </div>
        </div>
      )}
    </GameLayout>
  );
}
