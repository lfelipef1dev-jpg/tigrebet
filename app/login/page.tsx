'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '../store';
import { toast } from 'sonner';
import { authAPI } from '../lib/api';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setBalance, setSelectedCoin } = useStore();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || !password) { toast.error('Preencha todos os campos'); return; }
    setLoading(true);

    try {
      const res = await authAPI.login({ mobile, password });
      const result = res.data;

      if (result.code === 200) {
        const { uid, token, userInfo } = result.data;

        // Salva o token no localStorage para o interceptor do axios
        localStorage.setItem('cp_token', token);
        localStorage.setItem('cp_UID', uid);

        // Atualiza o store com dados do usuário
        setUser({
          uid,
          token,
          mobile: userInfo.mobile,
          username: userInfo.username,
          balance: userInfo.balance,
          vipLevel: userInfo.vipLevel,
          refCode: userInfo.refCode,
        });

        // Sincroniza o game.balance com o saldo real do servidor
        if (userInfo.balance) {
          setBalance('ETC', userInfo.balance.ETC ?? 0);
          setBalance('ETH', userInfo.balance.ETH ?? 0);
          setBalance('BTC', userInfo.balance.BTC ?? 0);
        }
        setSelectedCoin('ETC');

        toast.success('Login realizado! Bem-vindo de volta 🎰');
        router.push('/');
      } else {
        toast.error(result.msg || 'Credenciais inválidas');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { msg?: string } } };
      toast.error(e?.response?.data?.msg || 'Erro ao fazer login');
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

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        <div className="bg-[#111] border border-white/8 rounded-[32px] p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">🐯</div>
            <h1 className="text-2xl font-black text-yellow-400 tracking-tight">TigreBet</h1>
            <p className="text-gray-500 text-sm mt-1">Entre na sua conta</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
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
              {loading ? 'Entrando...' : '🐯 ENTRAR'}
            </motion.button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <Link href="/forgot-password" className="text-orange-400 text-sm hover:text-orange-300 transition-colors block font-bold">
              Esqueceu a senha?
            </Link>
            <p className="text-gray-500 text-sm">
              Não tem conta?{' '}
              <Link href="/register" className="text-yellow-400 font-bold hover:text-yellow-300 transition-colors">
                Cadastre-se grátis
              </Link>
            </p>
            <Link href="/" className="text-gray-600 text-xs hover:text-gray-400 transition-colors block">
              ← Voltar ao início
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
