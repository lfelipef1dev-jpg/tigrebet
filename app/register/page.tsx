'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '../store';
import { toast } from 'sonner';
import { authAPI } from '../lib/api';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setBalance, setSelectedCoin } = useStore();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [refCode, setRefCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || !password) { toast.error('Preencha todos os campos'); return; }
    if (password !== confirmPassword) { toast.error('As senhas não coincidem'); return; }
    if (password.length < 6) { toast.error('Senha mínima de 6 caracteres'); return; }
    setLoading(true);

    try {
      const res = await authAPI.register({ mobile, password, confirmPassword, refCode: refCode || undefined });
      const result = res.data;

      if (result.code === 200) {
        const { uid, token, userInfo } = result.data;

        // Salva o token no localStorage para o interceptor do axios
        localStorage.setItem('cp_token', token);
        localStorage.setItem('cp_UID', uid);

        // Atualiza o store
        setUser({
          uid,
          token,
          mobile: userInfo?.mobile || mobile,
          username: userInfo?.username,
          balance: userInfo?.balance || { ETC: 0, ETH: 0, BTC: 0 },
          vipLevel: userInfo?.vipLevel || 1,
          refCode: userInfo?.refCode,
        });

        // Sincroniza o game.balance com o saldo real do servidor
        const bal = userInfo?.balance || { ETC: 0, ETH: 0, BTC: 0 };
        setBalance('ETC', bal.ETC ?? 0);
        setBalance('ETH', bal.ETH ?? 0);
        setBalance('BTC', bal.BTC ?? 0);
        setSelectedCoin('ETC');

        toast.success('Conta criada! R$ 10 de bônus de boas-vindas 🎉');
        router.push('/');
      } else {
        toast.error(result.msg || 'Erro ao fazer cadastro');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { msg?: string } } };
      toast.error(e?.response?.data?.msg || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a00] to-[#0a0a0a] flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-yellow-500/8 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        <div className="bg-[#111] border border-white/8 rounded-[32px] p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">🎰</div>
            <h1 className="text-2xl font-black text-yellow-400 tracking-tight">TigreBet</h1>
            <p className="text-gray-500 text-sm mt-1">Crie sua conta e ganhe bônus</p>
            <div className="mt-3 inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5">
              <span className="text-green-400 text-xs font-black">🎁 R$ 10 de boas-vindas</span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
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
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={loading}
                placeholder="Repita a senha"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold placeholder-gray-600 outline-none focus:border-yellow-500/50 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                Código de Indicação <span className="text-gray-600 lowercase font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={refCode}
                onChange={e => setRefCode(e.target.value.toUpperCase())}
                disabled={loading}
                placeholder="Ex: ABC123"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold placeholder-gray-600 outline-none focus:border-yellow-500/50 transition-all uppercase tracking-widest"
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
              {loading ? 'Cadastrando...' : '🎰 CRIAR CONTA'}
            </motion.button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-500 text-sm">
              Já tem conta?{' '}
              <Link href="/login" className="text-yellow-400 font-bold hover:text-yellow-300 transition-colors">
                Fazer login
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
