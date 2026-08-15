'use client';

import { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { wingoAPI } from '../../lib/api';
import { sounds } from '../../lib/sounds';
import GameLayout from '../../components/GameLayout';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type BetType = 'number' | 'red' | 'green' | 'violet' | 'large' | 'small';

interface Bet {
  type: BetType;
  value: number | string;
  amount: number;
}

export default function WingoPage() {
  const { game, user, setBalance, setLoading } = useStore();
  const [timeLeft, setTimeLeft] = useState(60);
  const [betAmount, setBetAmount] = useState(10);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectedColors, setSelectedColors] = useState<BetType[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  const numberOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const colorOptions: BetType[] = ['red', 'green', 'violet'];
  const sizeOptions: BetType[] = ['large', 'small'];

  const getResultColorClass = (num: number) => {
    if (num === 0 || num === 5) return 'bg-purple-600';
    if ([1, 3, 7, 9].includes(num)) return 'bg-green-600';
    return 'bg-red-600';
  };

  const toggleNumber = (num: number) => {
    setSelectedNumbers(prev =>
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const toggleColor = (color: BetType) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const placeBet = async () => {
    if (selectedNumbers.length === 0 && selectedColors.length === 0) {
      return;
    }

    setIsSpinning(true);
    setSpinResult(null);

    try {
      const bets: Bet[] = [];
      
      selectedNumbers.forEach(num => {
        bets.push({ type: 'number', value: num, amount: betAmount });
      });
      
      selectedColors.forEach(color => {
        bets.push({ type: color, value: color, amount: betAmount });
      });

      let totalWin = 0;
      let finalBalance = game.balance[game.selectedCoin];

      for (const bet of bets) {
        const response = await wingoAPI.wingoBet({
          period: game.currentPeriod || Date.now().toString(),
          select: bet.value,
          amount: bet.amount,
          coin: game.selectedCoin,
        });

        if (response.data.code === 200) {
          const { result, goal, balance } = response.data.data;
          setSpinResult(result);
          totalWin += goal;
          finalBalance = balance;
          setHistory([result, ...history.slice(0, 9)]);
        }
      }

      setBalance(game.selectedCoin, finalBalance);
      
      if (totalWin > 0) {
        sounds.win();
        toast.success(`🎉 Você ganhou ${totalWin.toFixed(2)}!`);
      } else {
        sounds.loss();
      }
    } catch (error) {
      toast.error('Erro na aposta');
    } finally {
      setTimeout(() => setIsSpinning(false), 1000);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await wingoAPI.balance(game.selectedCoin);
      if (response.data.code === 200) {
        setBalance(game.selectedCoin, response.data.data.money || 0);
      }
    } catch (error) {
      // Silencioso
    }
  };

  useEffect(() => {
    fetchBalance();
    
    // Simular contador
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [game.selectedCoin]);

  return (
    <GameLayout
      title="WINGO"
      subtitle="Sorteio de Números"
      icon="🎯"
      themeColor="purple"
      onAction={placeBet}
      actionText={isSpinning ? 'SORTEANDO...' : 'APOSTAR AGORA'}
      actionDisabled={isSpinning || (selectedNumbers.length === 0 && selectedColors.length === 0)}
      showHistory
      isWin={!isSpinning && spinResult !== null && (selectedNumbers.includes(spinResult) || selectedColors.some(c => {
        if (c === 'red') return [2, 4, 6, 8].includes(spinResult);
        if (c === 'green') return [1, 3, 7, 9].includes(spinResult);
        if (c === 'violet') return [0, 5].includes(spinResult);
        return false;
      }))}
      history={
        <div className="grid grid-cols-5 gap-2">
          {history.map((num, index) => (
            <div key={index} className={`rounded-xl p-2 text-center font-black text-sm border border-white/10 text-white ${getResultColorClass(num)}`}>
              {num}
            </div>
          ))}
        </div>
      }
    >
      {/* Timer & Period */}
      <div className="flex gap-3 mb-8">
        <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Próximo Sorteio</span>
          <span className="text-3xl font-black text-purple-400 font-mono">{timeLeft}s</span>
        </div>
        <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Período</span>
          <span className="text-3xl font-black text-gray-400 font-mono">#{game.currentPeriod || '---'}</span>
        </div>
      </div>

      {/* Result Display */}
      <div className="relative mb-8 text-center">
        <div className="absolute inset-0 bg-purple-500/10 blur-3xl rounded-full" />
        <motion.div
          animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
          transition={isSpinning ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
          className={`relative w-40 h-40 mx-auto rounded-full border-4 border-white/10 flex items-center justify-center text-7xl font-black shadow-2xl ${
            spinResult !== null && !isSpinning ? getResultColorClass(spinResult) : 'bg-white/5'
          }`}
        >
          {isSpinning ? '?' : spinResult ?? '-'}
        </motion.div>
      </div>

      {/* Selections */}
      <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 mb-8">
        <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-4">Escolha seus Números</h3>
        <div className="grid grid-cols-5 gap-2 mb-6">
          {numberOptions.map(num => (
            <button
              key={num}
              onClick={() => toggleNumber(num)}
              disabled={isSpinning}
              className={`aspect-square rounded-2xl font-black text-xl transition-all ${
                selectedNumbers.includes(num)
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-4">Escolha as Cores</h3>
        <div className="grid grid-cols-3 gap-2">
          {colorOptions.map(color => (
            <button
              key={color}
              onClick={() => toggleColor(color)}
              disabled={isSpinning}
              className={`py-4 rounded-2xl font-black text-xs transition-all ${
                selectedColors.includes(color)
                  ? color === 'red' ? 'bg-red-500 shadow-red-500/20' : color === 'green' ? 'bg-green-500 shadow-green-500/20' : 'bg-purple-500 shadow-purple-500/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {color === 'red' ? 'VERMELHO' : color === 'green' ? 'VERDE' : 'VIOLETA'}
            </button>
          ))}
        </div>
      </div>

      {/* Bet Amount */}
      <div className="bg-white/5 border border-white/10 rounded-[32px] p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-black uppercase text-gray-500 tracking-widest">Valor da Aposta</span>
          <span className="text-xl font-black text-yellow-400">{betAmount} {game.selectedCoin}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[10, 50, 100, 500].map(amount => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              disabled={isSpinning}
              className={`py-3 rounded-2xl font-black text-sm transition-all ${
                betAmount === amount
                ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {amount}
            </button>
          ))}
        </div>
      </div>
    </GameLayout>
  );
}
