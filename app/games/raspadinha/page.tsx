'use client';

import { useState, useCallback } from 'react';
import { useStore } from '../../store';
import GameLayout from '../../components/GameLayout';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { scratchAPI } from '../../lib/api';
import { sounds } from '../../lib/sounds';
import confetti from 'canvas-confetti';

interface ScratchCell {
  id: string;
  label: string;
  emoji: string;
  multiplier: number;
  scratched: boolean;
}

const BET_AMOUNTS = [1, 2, 5, 10, 25, 50, 100];

const SYMBOL_COLORS: Record<string, string> = {
  cash10:  '#22c55e',
  cash50:  '#16a34a',
  cash100: '#15803d',
  cash500: '#166534',
  moto50:  '#3b82f6',
  moto125: '#2563eb',
  motopro: '#1d4ed8',
  diamond: '#a855f7',
  star:    '#f59e0b',
};

const SYMBOL_GRADIENTS: Record<string, string> = {
  cash10:  'from-green-500 to-emerald-700',
  cash50:  'from-green-600 to-emerald-800',
  cash100: 'from-green-700 to-emerald-900',
  cash500: 'from-emerald-600 to-teal-800',
  moto50:  'from-blue-500 to-blue-700',
  moto125: 'from-blue-600 to-indigo-800',
  motopro: 'from-indigo-500 to-purple-700',
  diamond: 'from-purple-500 to-violet-700',
  star:    'from-yellow-500 to-orange-600',
};

export default function RaspadinhaPage() {
  const { game, setBalance } = useStore();
  const [betAmount, setBetAmount] = useState(5);
  const [cells, setCells] = useState<ScratchCell[] | null>(null);
  const [winAmount, setWinAmount] = useState(0);
  const [winPositions, setWinPositions] = useState<number[]>([]);
  const [winSymbolId, setWinSymbolId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [allScratched, setAllScratched] = useState(false);
  const [history, setHistory] = useState<{ win: number }[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [cardBought, setCardBought] = useState(false);

  const buyCard = useCallback(async () => {
    if (isPlaying || cardBought) return;
    const balance = game.balance[game.selectedCoin];
    if (balance < betAmount) { toast.error('Saldo insuficiente'); return; }

    setIsPlaying(true);
    setStatusMsg(`Comprando cartela: R$ ${betAmount}...`);

    try {
      const res = await scratchAPI.play({ amount: betAmount, coin: game.selectedCoin });
      if (res.data.code === 200) {
        const d = res.data.data;
        setBalance(game.selectedCoin, d.balance);
        setCells(d.cells.map((c: Omit<ScratchCell, 'scratched'>) => ({ ...c, scratched: false })));
        setWinAmount(d.winAmount);
        setWinPositions(d.winPositions);
        setWinSymbolId(d.winSymbolId);
        setAllScratched(false);
        setCardBought(true);
        setStatusMsg(d.winAmount > 0 ? `🎉 Você ganhou! Raspe para descobrir...` : `Boa sorte! Raspe as células.`);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { msg?: string } } };
      toast.error(e?.response?.data?.msg || 'Erro ao comprar cartela');
      setStatusMsg(`Erro: ${e?.response?.data?.msg}`);
    } finally {
      setIsPlaying(false);
    }
  }, [isPlaying, cardBought, betAmount, game.selectedCoin, game.balance, setBalance]);

  const scratchCell = useCallback((index: number) => {
    if (!cells || cells[index].scratched || !cardBought) return;

    sounds.reveal();
    const newCells = cells.map((c, i) => i === index ? { ...c, scratched: true } : c);
    setCells(newCells);

    const allDone = newCells.every(c => c.scratched);
    if (allDone) {
      setAllScratched(true);
      if (winAmount > 0) {
        setTimeout(() => {
          sounds.bigWin();
          confetti({ particleCount: 250, spread: 90, origin: { y: 0.5 }, colors: ['#FFD700', '#FF6B00', '#fff', '#22c55e'] });
          toast.success(`🎉 GANHOU R$ ${winAmount.toFixed(2)}!`, { duration: 5000 });
        }, 300);
      } else {
        sounds.loss();
      }
      setHistory(prev => [{ win: winAmount }, ...prev.slice(0, 9)]);
    }
  }, [cells, cardBought, winAmount]);

  const scratchAll = () => {
    if (!cells || !cardBought) return;
    const newCells = cells.map(c => ({ ...c, scratched: true }));
    setCells(newCells);
    setAllScratched(true);
    if (winAmount > 0) {
      confetti({ particleCount: 250, spread: 90, origin: { y: 0.5 }, colors: ['#FFD700', '#FF6B00', '#fff'] });
      toast.success(`🎉 GANHOU R$ ${winAmount.toFixed(2)}!`, { duration: 5000 });
    }
    setHistory(prev => [{ win: winAmount }, ...prev.slice(0, 9)]);
  };

  const newCard = () => {
    setCells(null);
    setWinAmount(0);
    setWinPositions([]);
    setWinSymbolId(null);
    setAllScratched(false);
    setCardBought(false);
    setStatusMsg('');
  };

  return (
    <GameLayout
      title="RASPADINHA"
      subtitle="Moto e Dinheiro na Sorte"
      icon="🏍️"
      themeColor="green"
      onAction={!cardBought ? buyCard : allScratched ? newCard : scratchAll}
      actionText={
        isPlaying ? 'COMPRANDO...'
        : !cardBought ? `🎟️ COMPRAR CARTELA R$ ${betAmount}`
        : allScratched ? '🔄 NOVA CARTELA'
        : '⚡ RASPAR TUDO'
      }
      actionDisabled={isPlaying}
      showHistory
      isWin={allScratched && winAmount > 0}
      history={
        <div className="grid grid-cols-5 gap-2">
          {history.map((h, i) => (
            <div key={i} className={`rounded-xl py-2 text-center font-black text-[10px] border ${
              h.win > 0 ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-gray-500 border-white/5 bg-white/3'
            }`}>
              {h.win > 0 ? `+${h.win.toFixed(0)}` : '✕'}
            </div>
          ))}
        </div>
      }
    >
      {/* Status bar */}
      {statusMsg && cardBought && !allScratched && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3 mb-4 text-center text-sm font-bold text-green-400">
          {statusMsg}
        </div>
      )}

      {/* Bet selector (only when no card) */}
      {!cardBought && (
        <div className="bg-[#111] border border-white/8 rounded-[28px] p-5 mb-5">
          <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-3">Valor da Cartela</div>
          <div className="grid grid-cols-4 gap-2">
            {BET_AMOUNTS.map(a => (
              <motion.button key={a} whileTap={{ scale: 0.9 }} onClick={() => setBetAmount(a)}
                className={`py-3 rounded-2xl font-black text-sm border transition-all ${
                  betAmount === a ? 'bg-green-500 border-green-400 text-black shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                }`}>
                R${a}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* No card yet: show scratch card illustration */}
      {!cardBought && (
        <div className="relative bg-gradient-to-br from-[#1a2a1a] to-[#0d1a0d] border-2 border-green-500/30 rounded-[36px] p-8 mb-5 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.08),transparent_70%)] pointer-events-none" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="text-3xl opacity-30">🎟️</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <p className="text-green-400/70 font-black text-xs uppercase tracking-widest">3 símbolos iguais = PRÊMIO!</p>
            <p className="text-gray-500 text-[10px] mt-1">Motos • Dinheiro • Jackpot Diamante</p>
          </div>
        </div>
      )}

      {/* Active card */}
      {cardBought && cells && (
        <>
          {/* Win banner */}
          <AnimatePresence>
            {allScratched && winAmount > 0 && (
              <motion.div
                key="win-banner"
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-gradient-to-r from-yellow-900/60 to-orange-900/60 border border-yellow-500/40 rounded-2xl p-4 mb-4 text-center"
              >
                <div className="text-xs text-yellow-400/80 font-black uppercase tracking-widest">VOCÊ GANHOU!</div>
                <div className="text-4xl font-black text-yellow-400">R$ {winAmount.toFixed(2)}</div>
                {winSymbolId && (
                  <div className="text-sm text-white/60 mt-1">3x {cells.find(c => c.id === winSymbolId)?.emoji} {cells.find(c => c.id === winSymbolId)?.label}</div>
                )}
              </motion.div>
            )}
            {allScratched && winAmount === 0 && (
              <motion.div
                key="lose-banner"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-900/20 border border-red-500/20 rounded-2xl p-3 mb-4 text-center"
              >
                <div className="text-sm text-red-400/80 font-black">Não foi dessa vez... Tente novamente!</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* The scratch card */}
          <div className="relative bg-gradient-to-br from-[#1a2a1a] via-[#0f1a0f] to-[#0d1a0d] border-2 border-green-500/40 rounded-[36px] p-6 mb-4 overflow-hidden shadow-[0_0_40px_rgba(34,197,94,0.1)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(34,197,94,0.06),transparent_65%)] pointer-events-none" />

            {/* Header */}
            <div className="text-center mb-4">
              <span className="text-[9px] text-green-400/60 font-black uppercase tracking-widest">RASPADINHA PREMIADA</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {cells.map((cell, i) => (
                <motion.button
                  key={i}
                  onClick={() => scratchCell(i)}
                  disabled={cell.scratched || !cardBought}
                  whileHover={!cell.scratched ? { scale: 1.04, y: -2 } : {}}
                  whileTap={!cell.scratched ? { scale: 0.94 } : {}}
                  className={`aspect-square rounded-2xl relative overflow-hidden border-2 transition-all ${
                    cell.scratched
                      ? `bg-gradient-to-br ${SYMBOL_GRADIENTS[cell.id] || 'from-gray-600 to-gray-800'} border-transparent shadow-lg ${
                          winPositions.includes(i) ? 'shadow-yellow-400/40 ring-2 ring-yellow-400' : ''
                        }`
                      : 'bg-gradient-to-br from-[#2a3a2a] to-[#1a2a1a] border-green-800/30 cursor-pointer hover:border-green-600/50'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {!cell.scratched ? (
                      <motion.div key="cover" className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl opacity-40 select-none">🎟️</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="reveal"
                        initial={{ scale: 0, rotate: -15, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2"
                      >
                        {/* Win glow for matching cells */}
                        {winPositions.includes(i) && (
                          <div className="absolute inset-0 rounded-2xl animate-pulse"
                            style={{ boxShadow: `inset 0 0 20px ${SYMBOL_COLORS[cell.id]}40` }} />
                        )}
                        <span className="text-4xl drop-shadow-lg select-none">{cell.emoji}</span>
                        <span className="text-[8px] font-black text-white/80 uppercase tracking-wide leading-tight text-center">
                          {cell.label}
                        </span>
                        {winPositions.includes(i) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center"
                          >
                            <span className="text-black text-[8px] font-black">✓</span>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>

            {/* Scratch progress */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-500 rounded-full"
                  animate={{ width: `${(cells.filter(c => c.scratched).length / 9) * 100}%` }}
                  transition={{ type: 'spring' }}
                />
              </div>
              <span className="text-[9px] text-gray-500 font-black">
                {cells.filter(c => c.scratched).length}/9
              </span>
            </div>
          </div>
        </>
      )}

      {/* Prize table */}
      <div className="bg-black/20 border border-white/5 rounded-[24px] p-5">
        <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest text-center mb-4">Prêmios — 3 Iguais</div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { emoji: '💵', label: 'R$ 10', mult: '5x' },
            { emoji: '💴', label: 'R$ 50', mult: '10x' },
            { emoji: '💶', label: 'R$ 100', mult: '20x' },
            { emoji: '💷', label: 'R$ 500', mult: '50x' },
            { emoji: '🛵', label: 'Moto 50', mult: '30x' },
            { emoji: '🏍️', label: 'Moto 125', mult: '75x' },
            { emoji: '🏎️', label: 'Moto Pro', mult: '200x' },
            { emoji: '⭐', label: 'Estrela', mult: '3x' },
            { emoji: '💎', label: 'Jackpot', mult: '1000x' },
          ].map((p, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/3 rounded-xl px-2 py-2 border border-white/5">
              <span className="text-2xl">{p.emoji}</span>
              <div>
                <div className="text-[8px] text-gray-400 font-bold leading-tight">{p.label}</div>
                <div className="text-yellow-400 font-black text-[10px]">{p.mult}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GameLayout>
  );
}
