'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '../store';
import { authAPI } from '../lib/api';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.changePassword({ currentPassword, newPassword });
      toast.success(res.data?.msg || 'Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { msg?: string } } };
      toast.error(error.response?.data?.msg || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
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
            CONFIGURAÇÕES
          </h1>
        </div>
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="bg-[#111] border border-white/8 rounded-[24px] p-5 mb-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-4 h-4 text-yellow-400" />
          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Informações da Conta</p>
        </div>
        <div>
          <label className="block text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1.5">
            Celular / Login
          </label>
          <input
            type="text"
            readOnly
            value={user.mobile || '—'}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none cursor-not-allowed opacity-60"
          />
        </div>
      </motion.div>

      {/* Change Password Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-[#111] border border-white/8 rounded-[24px] p-5"
      >
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-yellow-400" />
          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Alterar Senha</p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1.5">
              Senha Atual
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:border-yellow-500/50 pr-12 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1.5">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:border-yellow-500/50 pr-12 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1.5">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:border-yellow-500/50 pr-12 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02, boxShadow: loading ? 'none' : '0 0 24px rgba(255,165,0,0.35)' }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black rounded-2xl py-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity mt-2"
          >
            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
