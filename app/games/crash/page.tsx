'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import GameLayout from '../../components/GameLayout';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { crashAPI } from '../../lib/api';
import { sounds } from '../../lib/sounds';
import confetti from 'canvas-confetti';

const BET_AMOUNTS = [1, 5, 10, 25, 50, 100, 500];

export default function CrashPage() {
  const { game, setBalance } = useStore();
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [gameState, setGameState] = useState<'idle' | 'running' | 'won' | 'lost'>('idle');
  const [currentMult, setCurrentMult] = useState(1.0);
  const [crashAt, setCrashAt] = useState(0);
  const [history, setHistory] = useState<{ point: number; won: boolean }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const crashPointRef = useRef(0);
  const currentMultRef = useRef(1.0);
  const gameStateRef = useRef<'idle' | 'running' | 'won' | 'lost'>('idle');

  const startBet = async () => {
    if (gameState === 'running') return;
    const balance = game.balance[game.selectedCoin];
    if (balance < betAmount) { toast.error('Saldo insuficiente'); return; }

    gameStateRef.current = 'running';
    setGameState('running');
    currentMultRef.current = 1.0;
    setCurrentMult(1.0);
    setCrashAt(0);
    sounds.rocketRise();

    try {
      const res = await crashAPI.playCrash({ coin: game.selectedCoin, amount: betAmount, autoCashout });
      if (res.data.code === 200) {
        const { crashPoint, win, balance: newBal } = res.data.data;
        crashPointRef.current = crashPoint;
        startTimeRef.current = performance.now();

        const tick = () => {
          const elapsed = (performance.now() - startTimeRef.current) / 1000;
          const mult = parseFloat(Math.pow(Math.E, 0.12 * elapsed).toFixed(2));
          currentMultRef.current = mult;
          setCurrentMult(mult);

          if (mult >= crashPointRef.current) {
            setCrashAt(crashPoint);
            setBalance(game.selectedCoin, newBal);
            setHistory(prev => [{ point: crashPoint, won: win > 0 }, ...prev.slice(0, 9)]);

            if (win > 0) {
              gameStateRef.current = 'won';
              setGameState('won');
              sounds.cashout();
              confetti({ particleCount: 150, spread: 60, origin: { y: 0.5 }, colors: ['#8b5cf6', '#a855f7', '#fff'] });
              toast.success(`🚀 +R$ ${win.toFixed(2)} (x${autoCashout})`);
            } else {
              gameStateRef.current = 'lost';
              setGameState('lost');
              sounds.crash();
              toast.error(`💥 Explodiu em ${crashPoint.toFixed(2)}x`);
            }
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { msg?: string } } };
      toast.error(e?.response?.data?.msg || 'Erro de conexão');
      gameStateRef.current = 'idle';
      setGameState('idle');
    }
  };

  // Canvas chart animation — reads from refs so no re-registration on each frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const gs = gameStateRef.current;
      const mult = currentMultRef.current;
      ctx.clearRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(139,92,246,0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      if (gs === 'running' || gs === 'won' || gs === 'lost') {
        const progress = Math.min((mult - 1) / Math.max(crashPointRef.current - 1, 1), 1);
        const sx = 50, sy = H - 50;
        const ex = sx + (W - 80) * Math.pow(progress, 0.8);
        const ey = sy - (H - 80) * Math.pow(progress, 1.2);

        const isCrashed = gs === 'lost';
        const color = isCrashed ? '#ef4444' : '#8b5cf6';

        // Area fill
        const grad = ctx.createLinearGradient(sx, sy, ex, ey);
        grad.addColorStop(0, 'rgba(139,92,246,0)');
        grad.addColorStop(1, isCrashed ? 'rgba(239,68,68,0.15)' : 'rgba(139,92,246,0.15)');
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(sx + (ex - sx) * 0.5, sy, ex, ey);
        ctx.lineTo(ex, sy);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Line
        const lineGrad = ctx.createLinearGradient(sx, sy, ex, ey);
        lineGrad.addColorStop(0, 'rgba(139,92,246,0.2)');
        lineGrad.addColorStop(1, color);
        ctx.beginPath();
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(sx + (ex - sx) * 0.5, sy, ex, ey);
        ctx.stroke();

        // Glow dot
        if (gs === 'running') {
          ctx.shadowBlur = 20;
          ctx.shadowColor = color;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(ex, ey, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []); // stable — reads via refs

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <GameLayout
      title="CRASH PRO"
      subtitle="Radar de Multiplicadores"
      icon="🚀"
      themeColor="purple"
      onAction={startBet}
      actionText={
        gameState === 'running' ? `🚀 SUBINDO... ${currentMult.toFixed(2)}x`
        : `🚀 LANÇAR — R$ ${betAmount}`
      }
      actionDisabled={gameState === 'running'}
      showHistory
      isWin={gameState === 'won'}
      history={
        <div className="grid grid-cols-5 gap-2">
          {history.map((h, i) => (
            <div key={i} className={`rounded-xl py-2 text-center font-black text-[10px] border ${
              h.won ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'
            }`}>
              {h.point.toFixed(1)}x
            </div>
          ))}
        </div>
      }
    >
      {/* Radar screen */}
      <div className="relative bg-[#08090f] rounded-[40px] border-2 border-white/5 overflow-hidden mb-4 shadow-2xl" style={{ height: 280 }}>
        <canvas ref={canvasRef} width={500} height={280} className="absolute inset-0 w-full h-full" />

        {/* Center display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <AnimatePresence mode="wait">
            {gameState === 'idle' ? (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
                  <span className="text-4xl">🚀</span>
                </div>
                <p className="text-gray-600 font-black uppercase tracking-[0.3em] text-[9px]">Pronto para lançar</p>
              </motion.div>
            ) : (
              <motion.div key="running" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                <motion.div
                  animate={gameState === 'running' ? { scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 0.5 } } : {}}
                  className={`text-7xl font-black font-mono tracking-tighter ${
                    gameState === 'lost' ? 'text-red-500' : gameState === 'won' ? 'text-green-400' : 'text-white'
                  } drop-shadow-[0_0_30px_rgba(139,92,246,0.5)]`}
                >
                  {currentMult.toFixed(2)}<span className="text-3xl">x</span>
                </motion.div>
                {gameState === 'lost' && (
                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="mt-3 flex items-center gap-2 justify-center bg-red-500/15 px-5 py-2 rounded-full border border-red-500/30">
                    <span className="text-red-400 font-black text-xs">💥 EXPLODIU EM {crashAt.toFixed(2)}x</span>
                  </motion.div>
                )}
                {gameState === 'won' && (
                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="mt-3 flex items-center gap-2 justify-center bg-green-500/15 px-5 py-2 rounded-full border border-green-500/30">
                    <span className="text-green-400 font-black text-xs">🏆 SAQUE AUTOMÁTICO x{autoCashout}</span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
          <div className={`w-1.5 h-1.5 rounded-full ${gameState === 'running' ? 'bg-green-400 animate-ping' : 'bg-gray-600'}`} />
          <span className="text-[8px] font-black text-gray-400">RADAR AO VIVO</span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#111] border border-white/8 rounded-[28px] p-5 mb-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">Aposta (R$)</div>
            <input
              type="number" value={betAmount}
              onChange={e => setBetAmount(Math.max(1, Number(e.target.value)))}
              disabled={gameState === 'running'}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-lg font-black text-white outline-none focus:border-purple-500/50 transition-all"
            />
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">Auto Saque (x)</div>
            <input
              type="number" step="0.1" value={autoCashout}
              onChange={e => setAutoCashout(Math.max(1.01, Number(e.target.value)))}
              disabled={gameState === 'running'}
              className="w-full bg-white/5 border border-purple-500/20 rounded-xl py-3 px-4 text-lg font-black text-purple-400 outline-none focus:border-purple-500/50 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {BET_AMOUNTS.slice(0, 8).map(a => (
            <button key={a} onClick={() => setBetAmount(a)} disabled={gameState === 'running'}
              className={`py-3 rounded-2xl font-black text-xs border-2 transition-all ${
                betAmount === a
                  ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                  : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'
              }`}>
              R$ {a}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy tips */}
      <div className="bg-[#111] border border-white/8 rounded-[28px] p-5">
        <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-3">Auto Saque Rápido</div>
        <div className="grid grid-cols-4 gap-2">
          {[1.5, 2.0, 3.0, 5.0].map(v => (
            <button key={v} onClick={() => setAutoCashout(v)} disabled={gameState === 'running'}
              className={`py-2.5 rounded-xl font-black text-xs border transition-all ${
                autoCashout === v
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                  : 'bg-white/5 border-transparent text-gray-500'
              }`}>
              x{v.toFixed(1)}
            </button>
          ))}
        </div>
      </div>
    </GameLayout>
  );
}
