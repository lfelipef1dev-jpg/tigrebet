'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { paymentAPI } from '../lib/api';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCw, Clock } from 'lucide-react';

const COINS = ['ETC'] as const;
const COIN_LABELS: Record<string, string> = { ETC: 'BRL (Real)' };
const COIN_EMOJI: Record<string, string> = { ETC: '🇧🇷' };

type Tx = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  description?: string;
};

const STATUS_COLOR: Record<string, string> = {
  completed: 'text-green-400',
  pending: 'text-yellow-400',
  failed: 'text-red-400',
  processing: 'text-blue-400',
};

const STATUS_LABEL: Record<string, string> = {
  completed: 'Concluído',
  pending: 'Pendente',
  failed: 'Falhou',
  processing: 'Processando',
};

const TYPE_LABEL: Record<string, string> = {
  deposit: 'Depósito',
  withdrawal: 'Saque',
  bonus: 'Bônus',
  win: 'Ganho',
  bet: 'Aposta',
};

export default function WalletPage() {
  const { game, setSelectedCoin } = useStore();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.history({ limit: 20 });
      const d = res.data?.data;
      const rows = d?.transactions ?? d;
      setTxs(Array.isArray(rows) ? rows : []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const totalBRL = Object.values(game.balance).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#080810] via-[#0d0d20] to-[#080810] text-white">
      {/* bg glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-yellow-500/6 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto pb-24 px-4 pt-6">
        {/* Back + title */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <span className="text-lg">🔙</span>
          </Link>
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent uppercase tracking-tight">
              Carteira
            </h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Seus Saldos</p>
          </div>
          <button
            onClick={fetchHistory}
            className="ml-auto w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Total card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-500/15 to-orange-500/10 border border-yellow-500/25 rounded-[28px] p-6 mb-5 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-yellow-400" />
              <span className="text-[10px] font-black text-yellow-400/70 uppercase tracking-widest">Saldo Total</span>
            </div>
            <div className="text-4xl font-black text-white mb-1">
              R$ {totalBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-gray-500 text-xs">Saldo em Reais</p>
          </div>
        </motion.div>

        {/* Coin balances */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {COINS.map((coin) => {
            const active = game.selectedCoin === coin;
            return (
              <motion.button
                key={coin}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedCoin(coin)}
                className={`rounded-2xl p-4 border transition-all text-left ${
                  active
                    ? 'bg-yellow-500/15 border-yellow-500/40'
                    : 'bg-white/4 border-white/8 hover:bg-white/8'
                }`}
              >
                <div className="text-2xl mb-2">{COIN_EMOJI[coin]}</div>
                <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">{coin}</div>
                <div className={`text-sm font-black ${active ? 'text-yellow-400' : 'text-white'}`}>
                  R$ {game.balance[coin].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link href="/deposit">
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
            >
              <ArrowDownCircle className="w-4 h-4" />
              Depositar
            </motion.button>
          </Link>
          <Link href="/withdraw">
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl font-black text-sm bg-white/8 border border-white/15 text-gray-300 flex items-center justify-center gap-2 hover:bg-white/12 transition-colors"
            >
              <ArrowUpCircle className="w-4 h-4" />
              Sacar
            </motion.button>
          </Link>
        </div>

        {/* Transaction history */}
        <div className="bg-[#111] border border-white/8 rounded-[24px] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Histórico de Transações</span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-gray-600 text-sm">Carregando...</div>
          ) : txs.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 text-sm font-bold">Nenhuma transação ainda</p>
              <p className="text-gray-600 text-xs mt-1">Faça seu primeiro depósito!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {txs.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                    tx.type === 'deposit' || tx.type === 'bonus' ? 'bg-green-500/15' : 'bg-red-500/15'
                  }`}>
                    {tx.type === 'deposit' ? '⬇️' : tx.type === 'bonus' ? '🎁' : '⬆️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white">{TYPE_LABEL[tx.type] || tx.type}</div>
                    <div className="text-[10px] text-gray-600">
                      {new Date(tx.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-black ${tx.type === 'deposit' || tx.type === 'bonus' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'deposit' || tx.type === 'bonus' ? '+' : '-'}R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`text-[10px] font-bold ${STATUS_COLOR[tx.status] || 'text-gray-500'}`}>
                      {STATUS_LABEL[tx.status] || tx.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
