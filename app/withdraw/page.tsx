'use client';

import { useState, useCallback } from 'react';
import GameLayout from '../components/GameLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { paymentAPI } from '../lib/api';
import { toast } from 'sonner';

const PIX_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Celular' },
  { value: 'random', label: 'Chave aleatória' },
];

const QUICK_AMOUNTS = [20, 50, 100, 200, 500, 1000];

export default function WithdrawPage() {
  const { game, setBalance } = useStore();
  const [amount, setAmount] = useState(50);
  const [pixType, setPixType] = useState('cpf');
  const [pixKey, setPixKey] = useState('');
  const [holderName, setHolderName] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{transactionId: string; amount: number; fee: number} | null>(null);

  const balance = Number(game.balance[game.selectedCoin]) || 0;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 20) { toast.error('Valor mínimo de saque: R$ 20'); return; }
    if (amount > 5000) { toast.error('Limite diário: R$ 5.000'); return; }
    if (amount > balance) { toast.error(`Saldo insuficiente. Seu saldo é R$ ${balance.toFixed(2)}`); return; }
    if (!pixKey.trim()) { toast.error('Informe a chave PIX'); return; }
    if (!holderName.trim()) { toast.error('Informe o nome do titular'); return; }
    if (!cpf.trim()) { toast.error('Informe o CPF'); return; }

    setLoading(true);
    try {
      const res = await paymentAPI.withdraw({
        amount,
        pixKeyType: pixType,
        pixKey: pixKey.trim(),
        holderName: holderName.trim(),
        cpf: cpf.trim(),
      });
      if (res.data.code === 200) {
        setResult(res.data.data);
        setSuccess(true);
        setBalance(game.selectedCoin, balance - amount);
        toast.success(`Saque de R$ ${res.data.data.amount.toFixed(2)} solicitado`);
      } else {
        toast.error(res.data.msg || 'Erro ao solicitar saque');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { msg?: string } } };
      toast.error(e?.response?.data?.msg || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  }, [amount, pixType, pixKey, holderName, cpf, balance, game.selectedCoin, setBalance]);

  return (
    <GameLayout title="SAQUE" subtitle="Retire seus ganhos" icon="💸" themeColor="red">
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111] border border-green-500/30 rounded-[32px] p-8 text-center"
          >
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-black text-green-400 mb-2">Saque Solicitado!</h2>
            <p className="text-2xl font-black text-white mb-1">R$ {result?.amount.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mb-4">Taxa: R$ {result?.fee.toFixed(2)}</p>
            <p className="text-gray-400 text-sm mb-6">Prazo de processamento: 24–48 horas úteis.</p>
            <button
              onClick={() => { setSuccess(false); setPixKey(''); setHolderName(''); setCpf(''); setAmount(50); }}
              className="w-full py-4 rounded-2xl font-black text-base bg-gradient-to-r from-red-500 to-orange-500 text-white"
            >
              Fazer outro saque
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-[#111] border border-white/8 rounded-[32px] p-5 space-y-4"
          >
            {/* Amount */}
            <div>
              <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">Valor do Saque (R$)</div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {QUICK_AMOUNTS.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    className={`py-3 rounded-xl font-black text-sm transition-all border ${
                      amount === v
                        ? 'bg-red-500 border-red-400 text-black'
                        : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    R$ {v}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={20}
                max={5000}
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:border-red-500/50 text-lg"
                placeholder="Valor personalizado"
              />
              <p className="text-[10px] text-gray-600 mt-2">Mínimo: R$ 20 • Máximo diário: R$ 5.000</p>
            </div>

            {/* PIX key type */}
            <div>
              <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">Tipo de Chave PIX</div>
              <select
                value={pixType}
                onChange={e => setPixType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none appearance-none"
              >
                {PIX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* PIX key */}
            <div>
              <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">Chave PIX</div>
              <input
                value={pixKey}
                onChange={e => setPixKey(e.target.value)}
                placeholder="Digite sua chave PIX..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold placeholder-gray-700 outline-none focus:border-red-500/50"
              />
            </div>

            {/* Name */}
            <div>
              <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">Nome do Titular</div>
              <input
                value={holderName}
                onChange={e => setHolderName(e.target.value)}
                placeholder="Nome completo..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold placeholder-gray-700 outline-none focus:border-red-500/50"
              />
            </div>

            {/* CPF */}
            <div>
              <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">CPF</div>
              <input
                value={cpf}
                onChange={e => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold placeholder-gray-700 outline-none focus:border-red-500/50"
              />
            </div>

            {/* Info box */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-4 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Prazo</span>
                <span className="text-gray-400 font-bold">24–48 horas úteis</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Taxa</span>
                <span className="text-gray-400 font-bold">1% a 5% conforme VIP</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Requisito</span>
                <span className="text-gray-400 font-bold">KYC aprovado + depósito R$ 20</span>
              </div>
            </div>

            {amount > balance && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-center">
                <p className="text-red-400 text-xs font-bold">Saldo insuficiente para R$ {amount}. Deposite para sacar.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25'
              }`}
            >
              {loading ? (
                <motion.div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
              ) : '💸 Solicitar Saque'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </GameLayout>
  );
}

