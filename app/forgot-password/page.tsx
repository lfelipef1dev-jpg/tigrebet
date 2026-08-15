'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import api from '../lib/api';

export default function ForgotPasswordPage() {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile) { toast.error('Informe seu celular'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { mobile });
      if (res.data.code === 200) {
        setSent(true);
        toast.success('Link enviado!');
      }
    } catch {
      toast.error('Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a00] to-[#0a0a0a] flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/8 blur-[120px] rounded-full" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-sm">
        <div className="bg-[#111] border border-white/8 rounded-[32px] p-8 shadow-2xl">

          <div className="text-center mb-8">
            <div className="text-6xl mb-3">🔑</div>
            <h1 className="text-2xl font-black text-yellow-400 tracking-tight">Recuperar Senha</h1>
            <p className="text-gray-500 text-sm mt-1">TigreBet</p>
          </div>

          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
              <div className="text-5xl">📧</div>
              <p className="text-white font-bold text-lg">Verifique seu email!</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Se o número tiver email cadastrado, você receberá um link para redefinir sua senha. O link expira em <span className="text-yellow-400 font-bold">1 hora</span>.
              </p>
              <Link href="/login" className="block mt-4 text-yellow-400 font-bold hover:text-yellow-300 transition-colors text-sm">
                ← Voltar ao login
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Informe o celular cadastrado. Enviaremos um link de recuperação para o email associado à conta.
              </p>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                  Celular
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  disabled={loading}
                  placeholder="Ex: 11999999999"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold placeholder-gray-600 outline-none focus:border-yellow-500/50 transition-all"
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={!loading ? { scale: 0.97 } : {}}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all mt-2 ${
                  loading
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50'
                }`}
              >
                {loading ? 'Enviando...' : '🔑 ENVIAR LINK'}
              </motion.button>

              <div className="text-center mt-4">
                <Link href="/login" className="text-gray-500 text-sm hover:text-gray-400 transition-colors">
                  ← Voltar ao login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
