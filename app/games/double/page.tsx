'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store';
import { doubleAPI } from '../../lib/api';
import { toast } from 'sonner';
import { sounds } from '../../lib/sounds';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ── Constants ─────────────────────────────────────────────────────────────────
const TOTAL_SEGS = 15;
const SEG_DEG = 360 / TOTAL_SEGS; // 24°
type ColorKey = 'red' | 'black' | 'white';
const SEG_COLORS: ColorKey[] = Array.from({ length: TOTAL_SEGS }, (_, i) =>
  i === 0 ? 'white' : i % 2 === 1 ? 'red' : 'black'
) as ColorKey[];

const C: Record<ColorKey, { fill: string; bright: string; glow: string; label: string; mult: number }> = {
  red:   { fill: '#7f1d1d', bright: '#ef4444', glow: 'rgba(239,68,68,0.65)',   label: '2×',  mult: 2  },
  black: { fill: '#0f172a', bright: '#475569', glow: 'rgba(100,116,139,0.45)', label: '2×',  mult: 2  },
  white: { fill: '#78350f', bright: '#fbbf24', glow: 'rgba(251,191,36,0.8)',   label: '14×', mult: 14 },
};

const BET_AMOUNTS = [1, 5, 10, 25, 50, 100];

type Phase = 'betting' | 'spinning' | 'result';
interface HistoryItem { nonce: number; result: ColorKey; resultSegment: number }
interface RoundData {
  roundId: string; phase: Phase; timeLeft: number;
  result: ColorKey | null; resultSegment: number | null;
  resolvedServerSeed: string | null; serverSeedHash: string; nonce: number;
  userBet: { color: ColorKey; amount: number; coin: string } | null;
  history: HistoryItem[];
}

// ── Canvas ────────────────────────────────────────────────────────────────────
function toRad(d: number) { return d * Math.PI / 180; }

function drawWheel(canvas: HTMLCanvasElement, rotation: number, glowSeg: number | null) {
  const dpr = window.devicePixelRatio || 1;
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width / dpr, H = canvas.height / dpr;
  const cx = W / 2, cy = H / 2;
  const r = Math.min(W, H) / 2 - 12;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  // Shadow ring
  ctx.beginPath(); ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
  const ringGr = ctx.createRadialGradient(cx, cy, r - 2, cx, cy, r + 10);
  ringGr.addColorStop(0, 'rgba(255,215,0,0.12)'); ringGr.addColorStop(1, 'transparent');
  ctx.fillStyle = ringGr; ctx.fill();

  // Segments
  SEG_COLORS.forEach((color, i) => {
    const s = toRad(rotation + i * SEG_DEG - 90);
    const e = toRad(rotation + (i + 1) * SEG_DEG - 90);
    const col = C[color];
    const isGlow = glowSeg === i;
    const midRad = toRad(rotation + i * SEG_DEG + SEG_DEG / 2 - 90);
    const gx = cx + Math.cos(midRad) * r * 0.55, gy = cy + Math.sin(midRad) * r * 0.55;

    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, s, e); ctx.closePath();

    if (isGlow) { ctx.shadowBlur = 28; ctx.shadowColor = col.glow; }

    const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, r * 0.6);
    gr.addColorStop(0, isGlow ? col.bright : col.bright + 'bb');
    gr.addColorStop(1, col.fill);
    ctx.fillStyle = gr; ctx.fill(); ctx.shadowBlur = 0;

    // Divider
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, s, e); ctx.closePath();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();

    // Label
    const tx = cx + Math.cos(midRad) * r * 0.72, ty = cy + Math.sin(midRad) * r * 0.72;
    ctx.save();
    ctx.translate(tx, ty); ctx.rotate(midRad + Math.PI / 2);
    ctx.font = `bold ${Math.max(8, r * 0.085)}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = color === 'black' ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.88)';
    ctx.fillText(col.label, 0, 0); ctx.restore();
  });

  // Hub
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.19, 0, Math.PI * 2);
  const hubGr = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, r * 0.19);
  hubGr.addColorStop(0, '#1e1b4b'); hubGr.addColorStop(1, '#06061a');
  ctx.fillStyle = hubGr; ctx.fill();
  ctx.strokeStyle = 'rgba(251,191,36,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.font = `${r * 0.115}px system-ui`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🎡', cx, cy);

  // Pointer (triangle at top)
  const pr = r + 5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - pr + 13);
  ctx.lineTo(cx - 10, cy - pr - 9);
  ctx.lineTo(cx + 10, cy - pr - 9);
  ctx.closePath();
  ctx.shadowBlur = 12; ctx.shadowColor = '#fbbf24';
  ctx.fillStyle = '#fbbf24'; ctx.fill(); ctx.shadowBlur = 0;
}

function easeOut(t: number) { return 1 - Math.pow(1 - t, 4); }

// ── Component ─────────────────────────────────────────────────────────────────
export default function DoublePage() {
  const { game, setBalance } = useStore();
  const [round, setRound] = useState<RoundData | null>(null);
  const [betColor, setBetColor] = useState<ColorKey>('red');
  const [betAmount, setBetAmount] = useState(10);
  const [placing, setPlacing] = useState(false);
  const [winMsg, setWinMsg] = useState<{ won: boolean; amount: number; color: ColorKey } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotRef = useRef(0);
  const spinRef = useRef<{ from: number; to: number; startMs: number; dur: number } | null>(null);
  const rafRef = useRef(0);
  const lastPhaseRef = useRef<Phase | null>(null);
  const lastRoundRef = useRef<string | null>(null);
  const prevBetRef = useRef<{ color: ColorKey; amount: number; coin: string } | null>(null);

  // ── Canvas loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(canvas.parentElement?.clientWidth ?? 300, 300);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = `${size}px`; canvas.style.height = `${size}px`;

    let prev = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      const sp = spinRef.current;
      if (sp) {
        const t = Math.min((now - sp.startMs) / sp.dur, 1);
        rotRef.current = sp.from + (sp.to - sp.from) * easeOut(t);
        if (t >= 1) spinRef.current = null;
      } else {
        rotRef.current += 22 * dt; // idle: ~22°/s
      }
      const glow = (round?.phase !== 'betting' && round?.resultSegment != null) ? round.resultSegment : null;
      drawWheel(canvas, rotRef.current, glow);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.phase, round?.resultSegment]);

  // ── Phase transitions ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!round) return;
    const { phase, resultSegment, result } = round;

    if (round.roundId !== lastRoundRef.current && phase === 'betting') {
      lastRoundRef.current = round.roundId;
      setWinMsg(null);
      spinRef.current = null;
    }

    if (phase === 'spinning' && lastPhaseRef.current === 'betting' && resultSegment != null) {
      const curMod = ((rotRef.current % 360) + 360) % 360;
      const targetMod = resultSegment * SEG_DEG + SEG_DEG / 2;
      let delta = ((targetMod - curMod) + 360) % 360;
      if (delta < SEG_DEG * 2) delta += 360;
      spinRef.current = {
        from: rotRef.current,
        to: rotRef.current + 360 * 7 + delta,
        startMs: performance.now(),
        dur: 4300,
      };
      sounds.spin?.();
    }

    if (phase === 'result' && lastPhaseRef.current === 'spinning' && result) {
      const bet = prevBetRef.current ?? round.userBet;
      if (bet) {
        const won = bet.color === result;
        const winAmt = won ? parseFloat((bet.amount * C[result].mult).toFixed(2)) : bet.amount;
        setWinMsg({ won, amount: winAmt, color: result });
        if (won) {
          sounds.win?.();
          if (winAmt >= bet.amount * 5) { sounds.bigWin?.(); confetti({ particleCount: 130, spread: 70, origin: { y: 0.5 } }); }
          toast.success(`🎉 +R$ ${winAmt.toFixed(2)} — ${C[result].label}`);
        } else {
          sounds.loss?.();
          toast.error(`${result === 'white' ? '⚪ Branco' : result === 'red' ? '🔴 Vermelho' : '⚫ Preto'} — Não foi dessa vez`);
        }
      }
    }

    lastPhaseRef.current = phase;
  }, [round?.phase, round?.roundId, round?.result]);

  // ── Polling ───────────────────────────────────────────────────────────────
  const poll = useCallback(async () => {
    try {
      const res = await doubleAPI.status();
      if (res.data?.data) {
        const d: RoundData = res.data.data;
        setRound(d);
        if (d.userBet) prevBetRef.current = { color: d.userBet.color, amount: d.userBet.amount, coin: d.userBet.coin };
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { poll(); const id = setInterval(poll, 600); return () => clearInterval(id); }, [poll]);

  // ── Place bet ─────────────────────────────────────────────────────────────
  const placeBet = async () => {
    if (!round || round.phase !== 'betting' || round.userBet || placing) return;
    if (game.balance[game.selectedCoin] < betAmount) { toast.error('Saldo insuficiente'); return; }
    setPlacing(true);
    try {
      const res = await doubleAPI.placeBet({ color: betColor, amount: betAmount, coin: game.selectedCoin });
      if (res.data.code === 200) {
        setBalance(game.selectedCoin, res.data.data.balance);
        prevBetRef.current = { color: betColor, amount: betAmount, coin: game.selectedCoin };
        toast.success(`Aposta confirmada — R$${betAmount} no ${betColor === 'white' ? 'Branco' : betColor === 'red' ? 'Vermelho' : 'Preto'}`);
        await poll();
      } else { toast.error(res.data.msg || 'Erro'); }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { msg?: string } } };
      toast.error(err?.response?.data?.msg || 'Erro de conexão');
    } finally { setPlacing(false); }
  };

  const phase = round?.phase ?? 'betting';
  const timeLeft = round?.timeLeft ?? 0;
  const canBet = phase === 'betting' && !round?.userBet && !placing && timeLeft > 1;

  const phaseInfo = {
    betting: { label: `Apostas abertas — ${timeLeft}s`, color: '#4ade80' },
    spinning: { label: 'Girando...', color: '#fbbf24' },
    result:   { label: `Resultado — ${timeLeft}s`, color: '#60a5fa' },
  }[phase];

  return (
    <div className="min-h-screen bg-[#060610] text-white font-sans select-none">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, rgba(251,191,36,0.04) 50%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/8 px-4 py-3.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/" className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-base">🔙</Link>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight"
                  style={{ background: 'linear-gradient(90deg,#ef4444,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Double
                </h1>
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Roda da Sorte</p>
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl px-4 py-2 border border-white/8 text-right">
              <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest block">Saldo</span>
              <span className="text-sm font-black text-yellow-400">
                R$ {(game.balance[game.selectedCoin] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-36 space-y-4">
          {/* Phase bar */}
          <div className="flex items-center justify-between bg-white/4 border border-white/8 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: phaseInfo.color }} />
              <span className="text-xs font-bold" style={{ color: phaseInfo.color }}>{phaseInfo.label}</span>
            </div>
            <span className="text-[10px] text-gray-600 font-mono">Rodada #{round?.nonce ?? '—'}</span>
          </div>

          {/* Wheel */}
          <div className="flex justify-center py-2">
            <div className="w-full max-w-[300px]">
              <canvas ref={canvasRef} className="w-full block" />
            </div>
          </div>

          {/* Result flash */}
          <AnimatePresence mode="wait">
            {winMsg && phase === 'result' && (
              <motion.div key="win"
                initial={{ opacity: 0, y: -10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className={`rounded-2xl p-4 text-center border ${winMsg.won ? 'bg-green-500/10 border-green-500/25' : 'bg-red-500/8 border-red-500/15'}`}
              >
                <div className="text-3xl mb-1">{winMsg.won ? '🎉' : '😔'}</div>
                <div className={`text-2xl font-black ${winMsg.won ? 'text-green-400' : 'text-red-400'}`}>
                  {winMsg.won ? `+R$ ${winMsg.amount.toFixed(2)}` : `-R$ ${winMsg.amount.toFixed(2)}`}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Saiu: {winMsg.color === 'white' ? '⚪ Branco (14×)' : winMsg.color === 'red' ? '🔴 Vermelho (2×)' : '⚫ Preto (2×)'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active bet display */}
          {round?.userBet && phase === 'betting' && (
            <div className="bg-white/4 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-gray-300 text-center">
              ✅ Apostou R$ {round.userBet.amount.toFixed(2)} no{' '}
              {round.userBet.color === 'white' ? '⚪ Branco (14×)' : round.userBet.color === 'red' ? '🔴 Vermelho (2×)' : '⚫ Preto (2×)'}
            </div>
          )}

          {/* Bet panel */}
          <div className="bg-[#111] border border-white/8 rounded-[24px] p-4 space-y-4">
            {/* Color picker */}
            <div>
              <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">Escolha a cor</div>
              <div className="grid grid-cols-3 gap-2">
                {(['red', 'black', 'white'] as ColorKey[]).map(color => {
                  const col = C[color];
                  const active = betColor === color;
                  return (
                    <button key={color} onClick={() => canBet && setBetColor(color)} disabled={!canBet}
                      className="py-4 rounded-2xl font-black text-sm flex flex-col items-center gap-1.5 transition-all border"
                      style={{
                        background: active ? col.bright + '22' : 'rgba(255,255,255,0.04)',
                        borderColor: active ? col.bright : 'rgba(255,255,255,0.08)',
                        boxShadow: active ? `0 0 20px ${col.glow}` : 'none',
                        opacity: !canBet ? 0.55 : 1,
                      }}>
                      <span className="text-2xl">{color === 'white' ? '⚪' : color === 'red' ? '🔴' : '⚫'}</span>
                      <span className="text-xs" style={{ color: active ? col.bright : '#6b7280' }}>
                        {color === 'white' ? 'Branco' : color === 'red' ? 'Vermelho' : 'Preto'}
                      </span>
                      <span className="text-xs font-black" style={{ color: col.bright }}>{col.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount */}
            <div>
              <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">Valor (R$)</div>
              <div className="grid grid-cols-6 gap-1.5">
                {BET_AMOUNTS.map(a => (
                  <button key={a} onClick={() => setBetAmount(a)} disabled={!canBet}
                    className="py-2.5 rounded-xl font-black text-xs border transition-all"
                    style={{
                      background: betAmount === a ? C[betColor].bright + '22' : 'rgba(255,255,255,0.05)',
                      borderColor: betAmount === a ? C[betColor].bright : 'transparent',
                      color: betAmount === a ? C[betColor].bright : '#6b7280',
                    }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* History */}
          {(round?.history.length ?? 0) > 0 && (
            <div className="bg-[#111] border border-white/8 rounded-[20px] p-4">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-3">Últimos Resultados</div>
              <div className="flex gap-1.5 flex-wrap">
                {round!.history.slice(0, 20).map((h, idx) => (
                  <motion.div key={h.nonce}
                    initial={idx === 0 ? { scale: 0, opacity: 0 } : false}
                    animate={{ scale: 1, opacity: 1 }}
                    title={`#${h.nonce} — ${h.result}`}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border"
                    style={{
                      background: h.result === 'white' ? '#78350f' : h.result === 'red' ? '#7f1d1d' : '#0f172a',
                      borderColor: h.result === 'white' ? '#fbbf24' : h.result === 'red' ? '#ef4444' : '#334155',
                      boxShadow: idx === 0 ? `0 0 10px ${C[h.result].glow}` : 'none',
                    }}>
                    {h.result === 'white' ? 'W' : h.result === 'red' ? 'R' : 'B'}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Fixed bet button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#060610] via-[#060610]/80 to-transparent">
          <div className="max-w-lg mx-auto">
            <motion.button
              whileTap={canBet ? { scale: 0.97 } : {}}
              onClick={placeBet}
              disabled={!canBet}
              className="w-full py-5 rounded-3xl font-black text-lg transition-all flex items-center justify-center gap-2"
              style={{
                background: canBet ? `linear-gradient(135deg, ${C[betColor].fill}, ${C[betColor].bright})` : '#18181b',
                color: canBet ? (betColor === 'black' ? '#fff' : '#000') : '#52525b',
                boxShadow: canBet ? `0 8px 32px ${C[betColor].glow}` : 'none',
                cursor: canBet ? 'pointer' : 'not-allowed',
              }}>
              {placing ? '⏳ Confirmando...' :
               phase === 'spinning' ? '⚡ Girando...' :
               phase === 'result' ? '⏳ Próxima rodada...' :
               round?.userBet ? `✅ Apostado — R$${round.userBet.amount.toFixed(2)}` :
               `Apostar R$${betAmount} no ${betColor === 'white' ? 'Branco ⚪' : betColor === 'red' ? 'Vermelho 🔴' : 'Preto ⚫'}`}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
