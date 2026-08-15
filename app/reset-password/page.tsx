'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import api from '../lib/api';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Link inválido');
      router.push('/login');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) { toast.error('Preencha todos os campos'); return; }
    if (password.length < 6) { toast.error('Mínimo 6 caracteres'); return; }
    if (password !== confirm) { toast.error('As senhas não coincidem'); return; }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      if (res.data.code === 200) {
        setDone(true);
        toast.success('Senha alterada com sucesso!');
        setTimeout(() => router.push('/login'), 2500);
      } else {
        toast.error(res.data.msg || 'Erro ao redefinir senha');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { msg?: string } } };
      toast.error(e?.response?.data?.msg || 'Link inválido ou expirado');
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
            <div className="text-6xl mb-3">{done ? '✅' : '🔒'}</div>
            <h1 className="text-2xl font-black text-yellow-400 tracking-tight">
              {done ? 'Senha Alterada!' : 'Nova Senha'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">TigreBet</p>
          </div>

          {done ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3">
              <p className="text-gray-400 text-sm">Redirecionando para o login...</p>
              <Link href="/login" className="block text-yellow-400 font-bold hover:text-yellow-300 transition-colors text-sm">
                Ir para o login →
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold placeholder-gray-600 outline-none focus:border-yellow-500/50 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  disabled={loading}
                  placeholder="Repita a senha"
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
                {loading ? 'Salvando...' : '🔒 SALVAR NOVA SENHA'}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="text-yellow-400 text-4xl">🐯</div></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
