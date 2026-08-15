'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Wallet, Crown, Copy, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '../store';
import { toast } from 'sonner';

const VIP_NAMES: Record<number, string> = {
  0: 'Sem VIP',
  1: 'Bronze',
  2: 'Silver',
  3: 'Gold',
  4: 'Platinum',
  5: 'Diamond',
};

const VIP_COLORS: Record<number, string> = {
  0: '#6B7280',
  1: '#CD7F32',
  2: '#C0C0C0',
  3: '#FFD700',
  4: '#E5E4E2',
  5: '#B9F2FF',
};

const COIN_COLORS: Record<string, string> = {
  ETC: '#3B82F6',
  ETH: '#8B5CF6',
  BTC: '#F59E0B',
};

export default function StatsPage() {
  const { user, game } = useStore();

  const vipName = VIP_NAMES[user.vipLevel] ?? 'Bronze';
  const vipColor = VIP_COLORS[user.vipLevel] ?? '#CD7F32';

  const handleCopyRef = () => {
    if (user.refCode) {
      navigator.clipboard.writeText(user.refCode);
      toast.success('Código copiado!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#080810] via-[#0d0d20] to-[#080810] px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-4 mb-8"
      >
        <Link href="/">
          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:border-yellow-500/30 transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </div>
        </Link>
        <div>
          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">TigreBet</p>
          <h1
            className="text-2xl font-black"
            style={{
              fontFamily: "'Orbitron', monospace",
              background: 'linear-gradient(135deg, #FFD700, #FF8C00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ESTATÍSTICAS
          </h1>
        </div>
      </motion.div>

      {/* VIP + Ref Code row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-2 gap-3 mb-4"
      >
        {/* VIP Level */}
        <div className="bg-[#111] border border-white/8 rounded-[24px] p-5">
          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">Nível VIP</p>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5" style={{ color: vipColor }} />
            <span className="font-black text-lg" style={{ color: vipColor }}>{vipName}</span>
          </div>
          <p className="text-[10px] text-gray-600 mt-1">Nível {user.vipLevel}</p>
        </div>

        {/* Referral Code */}
        <div className="bg-[#111] border border-white/8 rounded-[24px] p-5">
          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">Código de Ref.</p>
          <div className="flex items-center gap-2">
            <span className="font-black text-base text-white truncate">{user.refCode || '—'}</span>
            {user.refCode && (
              <button onClick={handleCopyRef} className="flex-shrink-0">
                <Copy className="w-4 h-4 text-yellow-400 hover:text-yellow-300 transition-colors" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-600 mt-1">Compartilhe e ganhe</p>
        </div>
      </motion.div>

      {/* Balance Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-[#111] border border-white/8 rounded-[24px] p-5 mb-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4 text-yellow-400" />
          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Saldos</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(['ETC', 'ETH', 'BTC'] as const).map((coin) => {
            const color = COIN_COLORS[coin];
            const balance = game.balance[coin] ?? 0;
            return (
              <div
                key={coin}
                className="rounded-2xl p-3 text-center"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}
              >
                <p className="text-[9px] uppercase tracking-widest font-black mb-1" style={{ color }}>
                  {coin}
                </p>
                <p className="font-black text-white text-base">
                  {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Bet History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-[#111] border border-white/8 rounded-[24px] p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-4 h-4 text-yellow-400" />
          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Histórico de Apostas</p>
        </div>

        {game.betHistory.length === 0 ? (
          <div className="text-center py-10">
            <TrendingUp className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 font-bold text-sm">Nenhuma aposta registrada</p>
            <p className="text-gray-600 text-xs mt-1">Suas apostas aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-2">
            {game.betHistory.map((bet, idx) => {
              const won = bet.result === bet.goal;
              return (
                <motion.div
                  key={`${bet.period}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center justify-between py-3 px-4 rounded-2xl bg-white/3 border border-white/5"
                >
                  <div>
                    <p className="text-white font-bold text-sm">Período {bet.period}</p>
                    <p className="text-gray-500 text-xs">Seleção: {bet.select}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm ${won ? 'text-green-400' : 'text-red-400'}`}>
                      {won ? '+' : '-'}R$ {bet.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-gray-600 text-xs">{won ? 'Ganhou' : 'Perdeu'}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
