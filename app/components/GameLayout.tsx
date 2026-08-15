'use client';

import { ReactNode, useEffect } from 'react';
import { useStore } from '../store';
import Link from 'next/link';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface GameLayoutProps {
  title: string;
  subtitle: string;
  icon: string;
  themeColor: string;
  children: ReactNode;
  onAction?: () => void;
  actionText?: string;
  actionDisabled?: boolean;
  showHistory?: boolean;
  history?: ReactNode;
  isWin?: boolean;
}

export default function GameLayout({
  title,
  subtitle,
  icon,
  themeColor,
  children,
  onAction,
  actionText,
  actionDisabled,
  showHistory,
  history,
  isWin,
}: GameLayoutProps) {
  const { game } = useStore();

  useEffect(() => {
    if (isWin) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF4500'],
      });
    }
  }, [isWin]);

  const gradientClass = themeColor === 'purple' 
    ? 'from-purple-500 to-pink-500'
    : themeColor === 'red'
    ? 'from-red-500 to-orange-500'
    : themeColor === 'green'
    ? 'from-green-500 to-teal-500'
    : themeColor === 'gray'
    ? 'from-gray-400 to-gray-600'
    : 'from-yellow-500 to-orange-500';

  const bgGradient = themeColor === 'purple'
    ? 'from-gray-900 via-purple-900 to-gray-900'
    : themeColor === 'red'
    ? 'from-gray-900 via-red-900 to-gray-900'
    : themeColor === 'green'
    ? 'from-gray-900 via-green-900 to-gray-900'
    : themeColor === 'gray'
    ? 'from-gray-900 via-gray-800 to-black'
    : 'from-gray-900 via-pink-900 to-gray-900';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} text-white font-sans selection:bg-yellow-500/30`}>
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                <span className="text-xl">🔙</span>
              </Link>
              <div>
                <h1 className={`text-xl font-black bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent uppercase tracking-tighter`}>
                  {title}
                </h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{subtitle}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl px-4 py-2 border border-white/10 flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Saldo Disponível</span>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-bold">💰</span>
                <span className="text-sm font-black font-mono">
                  R$ {(Number(game.balance[game.selectedCoin]) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>

          {/* History Section */}
          {showHistory && history && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-[1px] flex-1 bg-white/10" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Histórico de Jogadas</span>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>
              {history}
            </div>
          )}
        </main>

        {/* Floating Action Button */}
        {onAction && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
            <div className="max-w-lg mx-auto flex flex-col gap-4">
              {isWin !== undefined && (
                <div className="flex justify-between items-center px-6 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Resultado Anterior</span>
                  <span className={`text-sm font-black ${isWin ? 'text-green-400' : 'text-gray-400'}`}>
                    {isWin ? 'VITÓRIA' : '---'}
                  </span>
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onAction}
                disabled={actionDisabled}
                className={`w-full py-5 rounded-3xl font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-3 ${
                  actionDisabled 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' 
                  : `bg-gradient-to-r ${gradientClass} text-white shadow-purple-500/20`
                }`}
              >
                <span className="text-2xl">{icon}</span>
                {actionText}
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}