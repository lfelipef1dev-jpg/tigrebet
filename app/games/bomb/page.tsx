'use client';

import { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { wingoAPI } from '../../lib/api';
import GameLayout from '../../components/GameLayout';
import { toast } from 'sonner';

export default function BombPage() {
  const { game, user, setBalance, setLoading } = useStore();
  const [selectedBomb, setSelectedBomb] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<number[]>([]);

  const bombs = [1, 2, 3, 4, 5, 6, 7];

  const placeBet = async () => {
    if (selectedBomb === null) {
      return;
    }

    setIsRolling(true);
    setResult(null);

    try {
      const response = await wingoAPI.wingoBet({
        coin: game.selectedCoin,
        select: selectedBomb,
        amount: betAmount,
      });

      if (response.data.code === 200) {
        const winAmount = response.data.data.goal;
        const resultNumber = response.data.data.result;
        const newBalance = response.data.data.balance;

        setResult(resultNumber);
        if (newBalance !== undefined) setBalance(game.selectedCoin, newBalance);
        setHistory([resultNumber, ...history.slice(0, 9)]);
      }
    } catch (error) {
      toast.error('Erro na aposta');
    } finally {
      setTimeout(() => setIsRolling(false), 1000);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await wingoAPI.balance(game.selectedCoin);
      if (response.data.code === 200) {
        setBalance(game.selectedCoin, response.data.data.money);
      }
    } catch (error) {
      toast.error('Erro ao buscar saldo');
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [game.selectedCoin]);

  return (
    <GameLayout
      title="BOMB"
      subtitle="Desarme a Bomba"
      icon="💥"
      themeColor="gray"
      onAction={placeBet}
      actionText={isRolling ? '💣 DESARMANDO...' : '💥 DESARMAR AGORA'}
      actionDisabled={isRolling || selectedBomb === null}
      showHistory
      history={
        <div className="flex gap-3 flex-wrap">
          {history.map((num, index) => (
            <div key={index} className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl px-4 py-2 font-bold text-xl border border-gray-600">
              💣 {num}
            </div>
          ))}
        </div>
      }
    >
      {/* Result Display */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 mb-6 border border-gray-700">
        <div className="text-center">
          <span className="text-gray-400 text-sm">Resultado</span>
          <div className="mt-4 flex justify-center">
            <div className={`w-32 h-32 rounded-2xl flex items-center justify-center text-7xl font-black ${isRolling ? 'animate-spin' : ''} ${
              result !== null
                ? result === selectedBomb
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/50'
                  : 'bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/50'
                : 'bg-gradient-to-br from-gray-700 to-gray-800'
            }`}>
              {isRolling ? '?' : result !== null ? `💣 ${result}` : '-'}
            </div>
          </div>
          {result !== null && result === selectedBomb && (
            <div className="mt-4 text-2xl font-black text-green-400 animate-pulse">
              🎉 BOMBA DESARMADA! 🎉
            </div>
          )}
        </div>
      </div>

      {/* Bomb Selection */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 mb-6 border border-gray-700">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">💣</span> Selecione uma Bomba (1-7)
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {bombs.map(bomb => (
            <button
              key={bomb}
              onClick={() => setSelectedBomb(bomb)}
              disabled={isRolling}
              className={`aspect-square rounded-2xl font-bold text-3xl transition-all transform hover:scale-105 ${
                selectedBomb === bomb
                  ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-black shadow-lg shadow-gray-500/50'
                  : 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700'
              } ${isRolling ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              💣 {bomb}
            </button>
          ))}
        </div>
      </div>

      {/* Bet Amount */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 mb-6 border border-gray-700">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">💵</span> Valor da Aposta
        </h3>
        <div className="flex gap-3 items-center mb-4">
          <button
            onClick={() => setBetAmount(Math.max(10, betAmount - 10))}
            disabled={isRolling}
            className="w-14 h-14 bg-gray-700 rounded-xl font-bold text-2xl hover:bg-gray-600 transition-all"
          >
            -
          </button>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            disabled={isRolling}
            className="flex-1 bg-gray-700 text-center p-4 rounded-xl font-bold text-2xl"
          />
          <button
            onClick={() => setBetAmount(betAmount + 10)}
            disabled={isRolling}
            className="w-14 h-14 bg-gray-700 rounded-xl font-bold text-2xl hover:bg-gray-600 transition-all"
          >
            +
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[10, 50, 100, 500].map(amount => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              disabled={isRolling}
              className="p-3 bg-gray-700 rounded-xl font-bold hover:bg-gray-600 transition-all"
            >
              {amount}
            </button>
          ))}
        </div>
      </div>
    </GameLayout>
  );
}
