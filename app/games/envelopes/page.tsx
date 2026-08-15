'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { envelopeAPI } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '../../components/GameLayout';
import { toast } from 'sonner';

type EnvelopeType = 'send' | 'receive';

interface Envelope {
  id: string;
  amount: number;
  opened: boolean;
  createdAt: Date;
  sender?: string;
}

export default function EnvelopesPage() {
  const { game, user, setBalance, setLoading } = useStore();
  const [activeTab, setActiveTab] = useState<EnvelopeType>('send');
  const [amount, setAmount] = useState(100);
  const [envelopeCount, setEnvelopeCount] = useState(10);
  const [password, setPassword] = useState('');
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [myEnvelopes, setMyEnvelopes] = useState<Envelope[]>([]);
  const [history, setHistory] = useState<number[]>([]);

  const sendEnvelopes = async () => {
    if (!password) {
      toast.error('Senha de pagamento é necessária');
      return;
    }

    setLoading(true);

    try {
      const response = await envelopeAPI.orderEnvelope({
        coin: game.selectedCoin,
        amount,
        envelopeCount,
        password,
        type: 'send',
      });

      if (response.data.code === 200) {
        setBalance(game.selectedCoin, response.data.data.balance);
        setHistory([amount * envelopeCount, ...history.slice(0, 9)]);
        toast.success('🎁 Envelopes enviados com sucesso!');
        fetchEnvelopes();
      }
    } catch (error) {
      toast.error('Erro ao enviar envelopes');
    } finally {
      setLoading(false);
    }
  };

  const openEnvelope = async (envelopeId: string) => {
    setLoading(true);

    try {
      const response = await envelopeAPI.orderEnvelope({
        coin: game.selectedCoin,
        envelopeId,
        type: 'open',
      });

      if (response.data.code === 200) {
        const winAmount = response.data.data.amount;
        setBalance(game.selectedCoin, response.data.data.balance);
        setHistory([winAmount, ...history.slice(0, 9)]);
        toast.success(`🧧 Você ganhou ${winAmount.toFixed(2)}!`);
        fetchMyEnvelopes();
      }
    } catch (error) {
      toast.error('Erro ao abrir envelope');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnvelopes = async () => {
    try {
      const response = await envelopeAPI.getList();
      if (response.data.code === 200) {
        setEnvelopes(response.data.data.list || []);
      }
    } catch (error) {
      // Silencioso
    }
  };

  const fetchMyEnvelopes = async () => {
    try {
      const response = await envelopeAPI.getList();
      if (response.data.code === 200) {
        setMyEnvelopes(response.data.data.list || []);
      }
    } catch (error) {
      // Silencioso
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await envelopeAPI.getInfo();
      if (response.data.code === 200) {
        setBalance(game.selectedCoin, response.data.data.balance || 0);
      }
    } catch (error) {
      // Silencioso
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchEnvelopes();
    fetchMyEnvelopes();
  }, [game.selectedCoin]);

  return (
    <GameLayout
      title="RED PACKETS"
      subtitle="Envelopes da Sorte"
      icon="🧧"
      themeColor="red"
      showHistory
      isWin={history.length > 0 && activeTab === 'receive'}
      history={
        <div className="grid grid-cols-5 gap-2">
          {history.map((val, index) => (
            <div key={index} className="rounded-xl p-2 text-center font-black text-xs border border-white/10 bg-red-500/20 text-red-400">
              {val.toFixed(0)}
            </div>
          ))}
        </div>
      }
    >
      {/* Tabs */}
      <div className="flex bg-white/5 p-1 rounded-3xl border border-white/10 mb-8">
        <button
          onClick={() => setActiveTab('send')}
          className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
            activeTab === 'send'
              ? 'bg-red-500 text-white shadow-lg'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          🎁 Enviar
        </button>
        <button
          onClick={() => setActiveTab('receive')}
          className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
            activeTab === 'receive'
              ? 'bg-red-500 text-white shadow-lg'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          📥 Receber
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'send' ? (
          <motion.div
            key="send"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-6">
              <div className="mb-6">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">Valor por Envelope</label>
                <div className="flex gap-2">
                  {[10, 50, 100, 500].map(val => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all ${
                        amount === val ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-400'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">Quantidade</label>
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                  <button onClick={() => setEnvelopeCount(Math.max(1, envelopeCount - 1))} className="w-12 h-12 flex items-center justify-center text-xl font-black">-</button>
                  <input
                    type="number"
                    value={envelopeCount}
                    onChange={(e) => setEnvelopeCount(Number(e.target.value))}
                    className="flex-1 bg-transparent text-center font-black text-xl outline-none"
                  />
                  <button onClick={() => setEnvelopeCount(envelopeCount + 1)} className="w-12 h-12 flex items-center justify-center text-xl font-black">+</button>
                </div>
              </div>

              <div className="mb-8">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">Senha de Pagamento</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-black outline-none focus:border-red-500 transition-colors"
                  placeholder="••••••"
                />
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex justify-between items-center mb-8">
                <span className="text-xs font-black text-red-400 uppercase tracking-widest">Total</span>
                <span className="text-2xl font-black text-white">{(amount * envelopeCount).toFixed(2)}</span>
              </div>

              <button
                onClick={sendEnvelopes}
                className="w-full py-5 rounded-[24px] bg-red-500 text-white font-black text-xl shadow-2xl shadow-red-500/20 hover:scale-[1.02] transition-transform active:scale-95"
              >
                🚀 ENVIAR AGORA
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="receive"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {envelopes.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-[32px] border border-dashed border-white/10">
                <span className="text-5xl block mb-4">📭</span>
                <p className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Nenhum envelope disponível</p>
              </div>
            ) : (
              envelopes.map((env) => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={env.id}
                  onClick={() => openEnvelope(env.id)}
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 p-6 rounded-[32px] flex items-center justify-between shadow-xl"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">🧧</div>
                    <div>
                      <h4 className="font-black text-lg">Envelope da Sorte</h4>
                      <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Toque para abrir</p>
                    </div>
                  </div>
                  <span className="text-xl">✨</span>
                </motion.button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GameLayout>
  );
}
