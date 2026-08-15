'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import GameLayout from '../../components/GameLayout';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { minesweeperAPI } from '../../lib/api';
import { sounds } from '../../lib/sounds';
import confetti from 'canvas-confetti';

interface Cell {
  state: 'hidden' | 'safe' | 'mine' | 'revealed-mine';
}

const BET_AMOUNTS = [1, 2, 5, 10, 25, 50, 100];
const MINE_OPTIONS = [1, 2, 3, 5, 8, 10, 15, 20, 24];

export default function MinesPage() {
  const { game, setBalance } = useStore();
  const [betAmount, setBetAmount] = useState(5);
  const [mineCount, setMineCount] = useState(3);
  const [grid, setGrid] = useState<Cell[]>(Array(25).fill({ state: 'hidden' }));
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [safeRevealed, setSafeRevealed] = useState(0);
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ win: number; mult: number }[]>([]);

  const resetGrid = () => {
    setGrid(Array(25).fill(null).map(() => ({ state: 'hidden' as const })));
  };

  const initGame = async () => {
    if (loading || gameActive) return;
    const balance = game.balance[game.selectedCoin];
    if (balance < betAmount) { toast.error('Saldo insuficiente'); return; }

    setLoading(true);


    try {
      const res = await minesweeperAPI.createOrder({ coin: game.selectedCoin, amount: betAmount, mineCount });
      if (res.data.code === 200) {
        setOrderId(res.data.data.orderId);
        setBalance(game.selectedCoin, res.data.data.balance);
        resetGrid();
        setGameActive(true);
        setGameOver(false);
        setWinAmount(betAmount);
        setMultiplier(1);
        setSafeRevealed(0);
        toast.success('Campo Minado ativo! Clique nas células.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { msg?: string } } };
      toast.error(e?.response?.data?.msg || 'Erro ao iniciar');

    } finally {
      setLoading(false);
    }
  };

  const revealCell = async (index: number) => {
    if (!gameActive || gameOver || loading || grid[index].state !== 'hidden') return;
    setLoading(true);

    try {
      const res = await minesweeperAPI.revealCell({ orderId, cellIndex: index });
      if (res.data.code === 200) {
        const { isMine, minePositions, currentMultiplier, winAmount: wa, gameOver: go } = res.data.data;

        const newGrid = [...grid];
        if (isMine) {
          // Reveal all mines
          newGrid[index] = { state: 'mine' };
          for (const pos of (minePositions || [])) {
            if (pos !== index && newGrid[pos].state === 'hidden') {
              newGrid[pos] = { state: 'revealed-mine' };
            }
          }
          setGrid(newGrid);
          setGameActive(false);
          setGameOver(true);
          setWinAmount(0);
          sounds.bomb();
          toast.error('💥 BUM! Você pisou em uma mina!');
          setHistory(prev => [{ win: 0, mult: 0 }, ...prev.slice(0, 9)]);
        } else {
          newGrid[index] = { state: 'safe' };
          setGrid(newGrid);
          const newSafe = safeRevealed + 1;
          setSafeRevealed(newSafe);
          setMultiplier(currentMultiplier);
          setWinAmount(wa);
          sounds.reveal();

          if (go) {
            // All safe cells revealed — auto cashout
            setGameActive(false);
            setGameOver(true);
            setBalance(game.selectedCoin, game.balance[game.selectedCoin] + wa);
            setHistory(prev => [{ win: wa, mult: currentMultiplier }, ...prev.slice(0, 9)]);
            sounds.bigWin();
            confetti({ particleCount: 200, spread: 70, origin: { y: 0.5 } });
            toast.success(`🏆 CAMPO LIMPO! +R$ ${wa.toFixed(2)}`);
          }
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { msg?: string } } };
      toast.error(e?.response?.data?.msg || 'Erro ao revelar');
    } finally {
      setLoading(false);
    }
  };

  const cashOut = async () => {
    if (!gameActive || gameOver || loading || safeRevealed === 0) return;
    setLoading(true);


    try {
      const res = await minesweeperAPI.getReward({ orderId, coin: game.selectedCoin });
      if (res.data.code === 200) {
        const { winAmount: wa, multiplier: m, balance: b } = res.data.data;
        setBalance(game.selectedCoin, b);
        setGameActive(false);
        setGameOver(true);
        setHistory(prev => [{ win: wa, mult: m }, ...prev.slice(0, 9)]);
        sounds.cashout();
        confetti({ particleCount: 150, spread: 60, origin: { y: 0.5 }, colors: ['#22c55e', '#4ade80', '#fff'] });
        toast.success(`💰 SAQUE: +R$ ${wa.toFixed(2)} (x${m})`);

      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { msg?: string } } };
      toast.error(e?.response?.data?.msg || 'Erro no saque');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GameLayout
      title="MINES PRO"
      subtitle="Campo de Diamantes"
      icon="💎"
      themeColor="green"
      onAction={gameActive ? cashOut : initGame}
      actionText={
        loading ? 'AGUARDE...'
        : gameActive ? `💰 SACAR R$ ${winAmount.toFixed(2)} (x${multiplier})`
        : '⚡ INICIAR EXPEDIÇÃO'
      }
      actionDisabled={loading || (gameActive && safeRevealed === 0)}
      showHistory
      isWin={gameOver && winAmount > 0}
      history={
        <div className="grid grid-cols-5 gap-2">
          {history.map((h, i) => (
            <div key={i} className={`rounded-xl py-2 text-center font-black text-[10px] border ${
              h.win > 0 ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'
            }`}>
              {h.win > 0 ? `x${h.mult}` : '💥'}
            </div>
          ))}
        </div>
      }
    >
      {/* Config bar */}
      {!gameActive && (
        <div className="bg-[#111] border border-white/8 rounded-[28px] p-5 mb-4 flex gap-4">
          <div className="flex-1">
            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">Aposta</div>
            <div className="grid grid-cols-4 gap-1.5">
              {BET_AMOUNTS.map(a => (
                <button key={a} onClick={() => setBetAmount(a)}
                  className={`py-2.5 rounded-xl font-black text-xs border transition-all ${
                    betAmount === a ? 'bg-green-500 border-green-400 text-black' : 'bg-white/5 border-transparent text-gray-400'
                  }`}>{a}</button>
              ))}
            </div>
          </div>
          <div className="w-28">
            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">Minas</div>
            <select value={mineCount} onChange={e => setMineCount(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 font-black text-sm appearance-none cursor-pointer text-red-400">
              {MINE_OPTIONS.map(m => <option key={m} value={m} className="bg-[#111]">{m}💣</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Live stats */}
      {gameActive && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
            <div className="text-[9px] text-green-400 uppercase tracking-widest font-black">Multiplicador</div>
            <div className="text-2xl font-black text-white">{multiplier}x</div>
          </div>
          <div className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-center">
            <div className="text-[9px] text-yellow-400 uppercase tracking-widest font-black">Ganho Atual</div>
            <div className="text-2xl font-black text-white">R${winAmount.toFixed(2)}</div>
          </div>
          <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
            <div className="text-[9px] text-red-400 uppercase tracking-widest font-black">Minas</div>
            <div className="text-2xl font-black text-white">{mineCount}💣</div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[36px] p-6 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#22c55e_0%,transparent_65%)] opacity-4 pointer-events-none" />
        <div className="grid grid-cols-5 gap-3">
          {grid.map((cell, i) => (
            <motion.button
              key={i}
              whileHover={cell.state === 'hidden' && gameActive && !loading ? { scale: 1.08, y: -2 } : {}}
              whileTap={cell.state === 'hidden' && gameActive && !loading ? { scale: 0.92 } : {}}
              onClick={() => revealCell(i)}
              disabled={cell.state !== 'hidden' || !gameActive || loading}
              className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-200 border-b-4 shadow-lg ${
                cell.state === 'hidden'
                  ? gameActive
                    ? 'bg-[#1e2128] border-[#0d0f13] hover:bg-[#252830] hover:border-green-900 cursor-pointer shadow-black/50'
                    : 'bg-[#141618] border-[#0d0e10] cursor-not-allowed opacity-60'
                  : cell.state === 'safe'
                    ? 'bg-gradient-to-br from-green-500 to-emerald-700 border-emerald-900 shadow-green-900/40'
                    : cell.state === 'mine'
                      ? 'bg-gradient-to-br from-red-500 to-rose-700 border-red-900 shadow-red-900/60 animate-pulse'
                      : 'bg-gradient-to-br from-red-900/60 to-red-950 border-red-950 opacity-70'
              }`}
            >
              <AnimatePresence mode="wait">
                {cell.state !== 'hidden' && (
                  <motion.span
                    key={cell.state}
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    className="text-2xl select-none"
                  >
                    {cell.state === 'safe' ? '💎' : '💣'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </div>
    </GameLayout>
  );
}
