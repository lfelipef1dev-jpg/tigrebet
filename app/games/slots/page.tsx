'use client';

import { useState } from 'react';
import { useStore } from '../../store';
import { slotsAPI } from '../../lib/api';
import { sounds } from '../../lib/sounds';
import GameLayout from '../../components/GameLayout';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface Sym {
  id: number;
  name: string;
  emoji: string;
  mult: number;
}

const SYMBOLS: Sym[] = [
  { id: 1, name: 'Cereja',   emoji: '🍒', mult: 2   },
  { id: 2, name: 'Limão',    emoji: '🍋', mult: 3   },
  { id: 3, name: 'Laranja',  emoji: '🍊', mult: 5   },
  { id: 4, name: 'Uva',      emoji: '🍇', mult: 8   },
  { id: 5, name: 'Sino',     emoji: '🔔', mult: 10  },
  { id: 6, name: 'Bar',      emoji: '💰', mult: 20  },
  { id: 7, name: 'Sete',     emoji: '7️⃣', mult: 50  },
  { id: 8, name: 'Diamante', emoji: '💎', mult: 100 },
];

const SPIN_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '💰', '7️⃣', '💎'];
const BET_AMOUNTS = [1, 5, 10, 25, 50, 100];

function symById(id: number): Sym {
  return SYMBOLS.find(s => s.id === id) ?? SYMBOLS[0];
}

export default function SlotsPage() {
  const { game, setBalance } = useStore();
  const [reels, setReels] = useState<Sym[][]>([
    [SYMBOLS[6], SYMBOLS[0], SYMBOLS[4]],
    [SYMBOLS[2], SYMBOLS[6], SYMBOLS[1]],
    [SYMBOLS[4], SYMBOLS[3], SYMBOLS[6]],
  ]);
  const [spinning, setSpinning] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [lastWin, setLastWin] = useState(0);
  const [winLines, setWinLines] = useState<number[]>([]);
  const [history, setHistory] = useState<{ win: number }[]>([]);
  const [spinRow, setSpinRow] = useState([0, 0, 0]);

  const getWinLines = (r: Sym[][]): number[] => {
    const lines: number[] = [];
    for (let row = 0; row < 3; row++) {
      if (r[0][row].id === r[1][row].id && r[1][row].id === r[2][row].id) lines.push(row);
    }
    if (r[0][0].id === r[1][1].id && r[1][1].id === r[2][2].id) lines.push(3);
    if (r[0][2].id === r[1][1].id && r[1][1].id === r[2][0].id) lines.push(4);
    return lines;
  };

  const spin = async () => {
    if (spinning) return;
    const balance = game.balance[game.selectedCoin];
    if (balance < betAmount) { toast.error('Saldo insuficiente'); return; }

    setSpinning(true);
    setLastWin(0);
    setWinLines([]);
    sounds.spin();

    // Kick off spinning animation (ticker)
    let frame = 0;
    const ticker = setInterval(() => {
      frame++;
      setSpinRow([frame, frame + 1, frame + 2]);
    }, 80);

    try {
      const res = await slotsAPI.playSlots({ coin: game.selectedCoin, amount: betAmount });
      if (res.data.code === 200) {
        const { reels: serverReels, win, balance: newBal } = res.data.data;

        // Stop animation after min 1.5s
        const minDelay = 1500 - frame * 80;
        if (minDelay > 0) await new Promise(r => setTimeout(r, minDelay));
        clearInterval(ticker);

        // Stop each reel with delay
        const finalReels = (serverReels as number[][]).map(col => col.map(id => symById(id)));
        for (let i = 0; i < 3; i++) {
          await new Promise<void>(r => setTimeout(r, 200));
          setReels(prev => {
            const next = [...prev];
            next[i] = finalReels[i];
            return next;
          });
        }

        setBalance(game.selectedCoin, newBal);
        setLastWin(win);
        setHistory(prev => [{ win }, ...prev.slice(0, 9)]);

        if (win > 0) {
          const wl = getWinLines(finalReels);
          setWinLines(wl);
          if (win >= betAmount * 10) {
            sounds.bigWin();
            confetti({ particleCount: 200, spread: 80, origin: { y: 0.5 } });
          } else {
            sounds.win();
          }
          toast.success(`🎉 +R$ ${win.toFixed(2)}`);
        } else {
          sounds.loss();
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { msg?: string } } };
      clearInterval(ticker);
      toast.error(e?.response?.data?.msg || 'Erro ao girar');
    } finally {
      setSpinning(false);
    }
  };

  return (
    <GameLayout
      title="SLOTS PRO"
      subtitle="Máquina de Frutas"
      icon="🎰"
      themeColor="purple"
      onAction={spin}
      actionText={spinning ? '🎰 GIRANDO...' : `🎰 GIRAR — R$ ${betAmount}`}
      actionDisabled={spinning}
      showHistory
      isWin={lastWin > 0 && !spinning}
      history={
        <div className="grid grid-cols-5 gap-2">
          {history.map((h, i) => (
            <div key={i} className={`rounded-xl py-2 text-center font-black text-[10px] border ${
              h.win > 0 ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'
            }`}>
              {h.win > 0 ? `+${h.win.toFixed(0)}` : '✗'}
            </div>
          ))}
        </div>
      }
    >
      {/* Slot Machine */}
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 to-pink-600/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative bg-[#0d0d12] border-2 border-white/8 rounded-[40px] p-6 shadow-2xl overflow-hidden">
          {/* Machine top chrome */}
          <div className="flex justify-center mb-5">
            <div className="flex items-center gap-2 bg-white/5 px-5 py-1.5 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-[9px] font-black tracking-[0.3em] text-gray-400 uppercase">Fortune Slots Pro</span>
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
            </div>
          </div>

          {/* Win banner */}
          <AnimatePresence>
            {lastWin > 0 && !spinning && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-yellow-400 text-black px-6 py-1.5 rounded-full font-black text-sm shadow-lg shadow-yellow-400/30 whitespace-nowrap"
              >
                🏆 +R$ {lastWin.toFixed(2)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reels */}
          <div className="flex gap-3 mb-4">
            {reels.map((reel, ri) => (
              <div key={ri} className="flex-1 bg-black/50 border border-white/10 rounded-3xl overflow-hidden" style={{ aspectRatio: '1/1.5' }}>
                <div className="h-full flex flex-col justify-around items-center py-3">
                  {reel.map((sym, si) => {
                    const isWinRow = winLines.includes(si) ||
                      (si === 0 && winLines.includes(3)) ||
                      (si === 2 && winLines.includes(4));
                    return (
                      <motion.div
                        key={`${ri}-${si}`}
                        animate={spinning
                          ? { y: [0, -8, 8, 0], transition: { repeat: Infinity, duration: 0.15 } }
                          : { y: 0 }}
                        className={`text-3xl select-none transition-all duration-300 ${
                          isWinRow ? 'scale-125 drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]' : ''
                        }`}
                      >
                        {spinning
                          ? SPIN_SYMBOLS[(spinRow[ri] + si) % SPIN_SYMBOLS.length]
                          : sym.emoji}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Win lines indicator */}
          {winLines.length > 0 && !spinning && (
            <div className="flex justify-center gap-2">
              {winLines.map(l => (
                <span key={l} className="text-[9px] font-black bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded-full px-2 py-0.5">
                  {l < 3 ? `Linha ${l + 1}` : l === 3 ? 'Diagonal ↘' : 'Diagonal ↗'}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bet selection */}
      <div className="bg-[#111] border border-white/8 rounded-[28px] p-5 mb-4">
        <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-3">Valor da Aposta</div>
        <div className="grid grid-cols-3 gap-2">
          {BET_AMOUNTS.map(a => (
            <button key={a} onClick={() => setBetAmount(a)} disabled={spinning}
              className={`py-3 rounded-2xl font-black text-sm border transition-all ${
                betAmount === a
                  ? 'bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
              }`}>
              R$ {a}
            </button>
          ))}
        </div>
      </div>

      {/* Paytable */}
      <div className="bg-[#111] border border-white/8 rounded-[28px] p-5">
        <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-3">Tabela de Pagamentos</div>
        <div className="grid grid-cols-4 gap-2">
          {SYMBOLS.map(s => (
            <div key={s.id} className="bg-white/5 rounded-2xl p-3 flex flex-col items-center gap-1 border border-white/8">
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-[8px] font-black text-gray-500">{s.name}</span>
              <span className="text-[10px] font-black text-yellow-400">x{s.mult}</span>
            </div>
          ))}
        </div>
      </div>
    </GameLayout>
  );
}
