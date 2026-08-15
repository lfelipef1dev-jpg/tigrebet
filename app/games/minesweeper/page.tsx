'use client';

import { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { minesweeperAPI, wingoAPI } from '../../lib/api';
import GameLayout from '../../components/GameLayout';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Cell {
  x: number;
  y: number;
  isMine: boolean;
  isRevealed: boolean;
  isGem: boolean;
  value: number;
}

type CellState = 'hidden' | 'gem' | 'mine';

export default function MinesweeperPage() {
  const { game, setBalance, setLoading } = useStore();
  const [cellStates, setCellStates] = useState<CellState[]>([]);
  const [gridSize, setGridSize] = useState(5);
  const [mineCount, setMineCount] = useState(3);
  const [betAmount, setBetAmount] = useState(10);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [revealedCount, setRevealedCount] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [orderId, setOrderId] = useState('');
  const [history, setHistory] = useState<number[]>([]);
  const [revealing, setRevealing] = useState(false);

  const multipliers = [1.1, 1.3, 1.5, 1.8, 2.2, 2.8, 3.5, 4.5, 6, 8, 10, 15, 20, 30, 50];

  const initGrid = (size: number): CellState[] =>
    Array(size * size).fill('hidden');

  const initGame = async () => {
    setLoading(true);
    try {
      const response = await minesweeperAPI.createOrder({
        coin: game.selectedCoin,
        amount: betAmount,
        mineCount,
      });

      if (response.data.code === 200) {
        setOrderId(response.data.data.orderId);
        setCellStates(initGrid(gridSize));
        setGameActive(true);
        setGameOver(false);
        setWinAmount(0);
        setCurrentMultiplier(1);
        setRevealedCount(0);
        setBalance(game.selectedCoin, response.data.data.balance);
        toast.success('Jogo iniciado! Boa sorte!');
      }
    } catch {
      toast.error('Erro ao iniciar jogo');
    } finally {
      setLoading(false);
    }
  };

  const revealCell = async (index: number) => {
    if (!gameActive || gameOver || cellStates[index] !== 'hidden' || revealing) return;

    setRevealing(true);
    try {
      const response = await minesweeperAPI.revealCell({
        orderId,
        cellIndex: index,
        coin: game.selectedCoin,
      });

      if (response.data.code === 200) {
        const { isMine, currentMultiplier: mult, winAmount: win, gameOver: over, minePositions } = response.data.data;

        const newStates = [...cellStates];

        if (isMine) {
          newStates[index] = 'mine';
          if (minePositions && Array.isArray(minePositions)) {
            minePositions.forEach((pos: number) => { newStates[pos] = 'mine'; });
          }
          setCellStates(newStates);
          setGameOver(true);
          setGameActive(false);
          setWinAmount(0);
          setHistory(prev => [0, ...prev.slice(0, 9)]);
          toast.error('💣 BOMBA! Jogo encerrado.');
        } else {
          newStates[index] = 'gem';
          setCellStates(newStates);
          const newRevealed = revealedCount + 1;
          setRevealedCount(newRevealed);
          setCurrentMultiplier(mult ?? multipliers[Math.min(newRevealed - 1, multipliers.length - 1)]);
          const potential = (win !== undefined ? win : betAmount * (mult ?? 1));
          setWinAmount(potential);

          if (over) {
            setGameActive(false);
            setGameOver(true);
            setHistory(prev => [potential, ...prev.slice(0, 9)]);
            toast.success(`🎉 Todas as gemas encontradas! +R$ ${potential.toFixed(2)}`);
          }
        }
      }
    } catch {
      toast.error('Erro ao revelar célula');
    } finally {
      setRevealing(false);
    }
  };

  const cashOut = async () => {
    if (!gameActive || gameOver) return;
    setLoading(true);
    try {
      const response = await minesweeperAPI.getReward({
        orderId,
        coin: game.selectedCoin,
      });

      if (response.data.code === 200) {
        const payout = response.data.data.winAmount ?? winAmount;
        if (response.data.data.balance !== undefined) {
          setBalance(game.selectedCoin, response.data.data.balance);
        }
        setHistory(prev => [payout, ...prev.slice(0, 9)]);
        setGameActive(false);
        setGameOver(true);
        toast.success(`🎉 Sacou R$ ${payout.toFixed(2)}!`);
      }
    } catch {
      toast.error('Erro ao sacar');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await wingoAPI.balance(game.selectedCoin);
      if (response.data.code === 200) {
        setBalance(game.selectedCoin, response.data.data.money || 0);
      }
    } catch {
      // silencioso
    }
  };

  useEffect(() => {
    setCellStates(initGrid(gridSize));
    setGameActive(false);
    setGameOver(false);
    fetchBalance();
  }, [game.selectedCoin, gridSize, mineCount]);

  return (
    <GameLayout
      title="MINES"
      subtitle="Campo Minado"
      icon="💣"
      themeColor="red"
      onAction={gameActive ? cashOut : initGame}
      actionText={gameActive ? `SACAR R$ ${winAmount.toFixed(2)}` : 'INICIAR JOGO'}
      actionDisabled={revealing}
      showHistory
      isWin={gameOver && winAmount > 0}
      history={
        <div className="grid grid-cols-5 gap-2">
          {history.map((win, index) => (
            <div key={index} className={`rounded-xl p-2 text-center font-black text-xs border border-white/10 ${win > 0 ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500'}`}>
              {win > 0 ? `+${win.toFixed(0)}` : '0'}
            </div>
          ))}
        </div>
      }
    >
      {/* Game Board */}
      <div className="relative mb-8">
        <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
          {cellStates.map((state, index) => (
            <button
              key={index}
              onClick={() => revealCell(index)}
              disabled={!gameActive || state !== 'hidden' || revealing}
              className={`aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all shadow-lg ${
                state === 'mine'
                  ? 'bg-red-500 shadow-red-500/50'
                  : state === 'gem'
                  ? 'bg-green-500 shadow-green-500/50'
                  : gameActive
                  ? 'bg-white/10 hover:bg-white/20 border border-white/10 active:scale-95'
                  : 'bg-white/5 cursor-not-allowed opacity-50'
              }`}
            >
              {state === 'mine' ? '💣' : state === 'gem' ? '💎' : ''}
            </button>
          ))}
        </div>

        {/* Multiplier Info */}
        <div className="flex justify-between items-center bg-white/5 rounded-3xl p-6 border border-white/10">
          <div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Multiplicador</span>
            <span className="text-3xl font-black text-red-400">x{currentMultiplier.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Ganho Potencial</span>
            <span className="text-3xl font-black text-green-400">R$ {winAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white/5 border border-white/10 rounded-[32px] p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Grade</label>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              disabled={gameActive}
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-black appearance-none text-white"
            >
              <option value={3}>3 x 3</option>
              <option value={4}>4 x 4</option>
              <option value={5}>5 x 5</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Minas</label>
            <select
              value={mineCount}
              onChange={(e) => setMineCount(Number(e.target.value))}
              disabled={gameActive}
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-black appearance-none text-white"
            >
              {[1, 3, 5, 10, 15, 20].filter(n => n < gridSize * gridSize).map(n => (
                <option key={n} value={n}>{n} Minas</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Aposta</label>
          <div className="grid grid-cols-4 gap-2">
            {[10, 50, 100, 500].map(amount => (
              <button
                key={amount}
                onClick={() => setBetAmount(amount)}
                disabled={gameActive}
                className={`py-3 rounded-2xl font-black text-sm transition-all ${
                  betAmount === amount
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
