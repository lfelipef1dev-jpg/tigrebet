'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { toast } from 'sonner';
import GameLayout from '../components/GameLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { paymentAPI } from '../lib/api';
import confetti from 'canvas-confetti';

const QUICK_AMOUNTS = [5, 10, 20, 50, 100, 200, 500, 1000];

type DepositState = 'idle' | 'loading' | 'awaiting' | 'confirmed';

interface PixData {
  transactionId: string;
  qrCode: string;
  qrCodeBase64: string;
  expiresAt: string;
}

export default function DepositPage() {
  const { game, setBalance } = useStore();
  const [amount, setAmount]         = useState(100);
  const [state, setState]           = useState<DepositState>('idle');
  const [pixData, setPixData]       = useState<PixData | null>(null);
  const [timeLeft, setTimeLeft]     = useState(0);
  const [copied, setCopied]         = useState(false);

  // Countdown timer
  useEffect(() => {
    if (state !== 'awaiting' || !pixData) return;
    const expires = new Date(pixData.expiresAt).getTime();
    setTimeLeft(Math.max(0, Math.floor((expires - Date.now()) / 1000)));

    const id = setInterval(() => {
      const left = Math.max(0, Math.floor((expires - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(id);
        setState('idle');
        setPixData(null);
        toast.error('PIX expirado. Gere um novo.');
      }
    }, 1000);
    return () => clearInterval(id);
  }, [pixData, state]);

  // Poll for payment confirmation
  useEffect(() => {
    if (state !== 'awaiting' || !pixData) return;

    const id = setInterval(async () => {
      try {
        const res = await paymentAPI.checkDepositStatus(pixData.transactionId);
        if (res.data.data?.status === 'completed') {
          clearInterval(id);
          setState('confirmed');
          if (res.data.data.balance != null) {
            setBalance('ETC', res.data.data.balance);
          }
          confetti({ particleCount: 250, spread: 90, origin: { y: 0.5 }, colors: ['#00E676', '#FFD700', '#fff'] });
          toast.success(`✅ Depósito de R$ ${amount.toFixed(2)} confirmado!`, { duration: 6000 });
        }
      } catch { /* ignore */ }
    }, 5000);

    return () => clearInterval(id);
  }, [pixData, state, amount, setBalance]);

  const handleGenerate = useCallback(async () => {
    if (amount < 5) { toast.error('Valor mínimo: R$ 5'); return; }
    setState('loading');
    try {
      const res = await paymentAPI.createDeposit({ amount, method: 'pix' });
      if (res.data.code === 200) {
        setPixData(res.data.data);
        setState('awaiting');
      } else {
        toast.error(res.data.msg || 'Erro ao gerar PIX');
        setState('idle');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { msg?: string } } };
      toast.error(e?.response?.data?.msg || 'Erro de conexão');
      setState('idle');
    }
  }, [amount]);

  const copyPix = () => {
    if (!pixData?.qrCode) return;
    navigator.clipboard.writeText(pixData.qrCode);
    setCopied(true);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopied(false), 2500);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <GameLayout
      title="DEPÓSITO"
      subtitle="Adicione fundos via PIX"
      icon="💰"
      themeColor="green"
    >
      <AnimatePresence mode="wait">

        {/* ── CONFIRMED ── */}
        {state === 'confirmed' && (
          <motion.div key="confirmed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111] border border-green-500/30 rounded-[32px] p-8 text-center"
          >
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-black text-green-400 mb-2">Depósito Confirmado!</h2>
            <p className="text-3xl font-black text-white mb-4">+R$ {amount.toFixed(2)}</p>
            <p className="text-gray-400 text-sm mb-6">Saldo atualizado na sua conta</p>
            <button onClick={() => { setState('idle'); setPixData(null); }}
              className="w-full py-4 rounded-2xl font-black text-base bg-gradient-to-r from-green-500 to-teal-500 text-black">
              Fazer outro depósito
            </button>
          </motion.div>
        )}

        {/* ── AWAITING PAYMENT ── */}
        {state === 'awaiting' && pixData && (
          <motion.div key="awaiting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Timer */}
            <div className="flex items-center justify-between bg-[#111] border border-white/8 rounded-2xl px-5 py-3">
              <span className="text-sm text-gray-400 font-bold">Expira em</span>
              <span className={`text-xl font-black font-mono ${timeLeft < 60 ? 'text-red-400' : 'text-yellow-400'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* QR Code */}
            <div className="bg-[#111] border border-white/8 rounded-[32px] p-6 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-4">
                Escaneie com o app do banco
              </p>

              {pixData.qrCodeBase64 ? (
                <div className="flex justify-center mb-4">
                  <img
                    src={pixData.qrCodeBase64.startsWith('data:') ? pixData.qrCodeBase64 : `data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-52 h-52 rounded-2xl border-4 border-white/10"
                  />
                </div>
              ) : (
                <div className="w-52 h-52 mx-auto mb-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                  <span className="text-4xl">📱</span>
                </div>
              )}

              <div className="text-2xl font-black text-green-400 mb-1">R$ {amount.toFixed(2)}</div>
              <p className="text-xs text-gray-500">Valor exato</p>
            </div>

            {/* Copy-paste PIX */}
            {pixData.qrCode && (
              <div className="bg-[#111] border border-white/8 rounded-2xl p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-3">
                  Ou copie o código PIX
                </p>
                <div className="bg-black/50 rounded-xl px-4 py-3 mb-3 font-mono text-xs text-gray-300 break-all leading-relaxed">
                  {pixData.qrCode.slice(0, 60)}...
                </div>
                <button
                  onClick={copyPix}
                  className={`w-full py-3 rounded-xl font-black text-sm transition-all ${
                    copied
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-white/8 text-white border border-white/10 hover:bg-white/12'
                  }`}
                >
                  {copied ? '✅ Copiado!' : '📋 Copiar código PIX'}
                </button>
              </div>
            )}

            {/* Status pulse */}
            <div className="flex items-center justify-center gap-3 py-2">
              <motion.div className="w-2 h-2 rounded-full bg-yellow-400"
                animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }} />
              <span className="text-sm text-gray-400">Aguardando pagamento...</span>
            </div>

            <button onClick={() => { setState('idle'); setPixData(null); }}
              className="w-full py-3 rounded-2xl text-sm font-bold text-gray-500 hover:text-gray-300 transition-colors">
              Cancelar
            </button>
          </motion.div>
        )}

        {/* ── IDLE / SELECT AMOUNT ── */}
        {(state === 'idle' || state === 'loading') && (
          <motion.div key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Quick amounts */}
            <div className="bg-[#111] border border-white/8 rounded-[32px] p-6">
              <div className="text-[9px] font-black uppercase text-gray-500 tracking-[0.25em] mb-4">
                Valor do Depósito
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {QUICK_AMOUNTS.map(v => (
                  <button key={v} onClick={() => setAmount(v)}
                    className={`py-3.5 rounded-2xl font-black text-sm transition-all border ${
                      amount === v
                        ? 'bg-green-500 border-green-400 text-black shadow-[0_0_16px_rgba(34,197,94,0.4)]'
                        : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10'
                    }`}>
                    R$ {v}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">R$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  min={5}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-4 font-black text-white text-lg outline-none focus:border-green-500/50 transition-all"
                  placeholder="Valor personalizado"
                />
              </div>
            </div>

            {/* Info */}
            <div className="bg-green-500/5 border border-green-500/15 rounded-2xl p-4 flex gap-3 items-start">
              <span className="text-xl">📱</span>
              <div>
                <p className="text-sm font-bold text-green-400 mb-0.5">Pagamento instantâneo</p>
                <p className="text-xs text-gray-500">Gere o QR code, pague pelo app do seu banco e o saldo é creditado em segundos.</p>
              </div>
            </div>

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleGenerate}
              disabled={state === 'loading' || amount < 5}
              className={`w-full py-5 rounded-3xl font-black text-xl transition-all flex items-center justify-center gap-3 ${
                state === 'loading' || amount < 5
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-teal-500 text-black shadow-lg shadow-green-500/25'
              }`}
            >
              {state === 'loading' ? (
                <>
                  <motion.div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                  Gerando PIX...
                </>
              ) : (
                <>📱 Gerar QR Code PIX</>
              )}
            </motion.button>

            <p className="text-center text-gray-600 text-xs">Mínimo: R$ 5 • Máximo: R$ 50.000</p>
          </motion.div>
        )}

      </AnimatePresence>
    </GameLayout>
  );
}
