'use client';

import { useState } from 'react';
import { useStore } from '../store';
import { toast } from 'sonner';
import GameLayout from '../components/GameLayout';

export default function ProfilePage() {
  const { user, logout } = useStore();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso');
    window.location.href = '/';
  };

  return (
    <GameLayout
      title="PERFIL"
      subtitle="Gerencie sua conta"
      icon="👤"
      themeColor="purple"
    >
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">UID</label>
            <div className="bg-gray-700 p-4 rounded-xl font-mono text-sm text-gray-300">
              {user.uid || 'N/A'}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Celular</label>
            <div className="bg-gray-700 p-4 rounded-xl font-bold text-white">
              {user.mobile || 'N/A'}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Nome de Usuário</label>
            <div className="bg-gray-700 p-4 rounded-xl font-bold text-white">
              {user.username || 'N/A'}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Nível VIP</label>
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-xl font-black text-black text-center text-2xl">
              VIP {user.vipLevel}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Código de Indicação</label>
            <div className="bg-gray-700 p-4 rounded-xl font-mono text-sm text-yellow-400 text-center">
              {user.refCode || 'N/A'}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-700">
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-4 rounded-2xl text-xl font-black bg-gradient-to-r from-red-500 to-pink-500 text-white transition-all transform hover:scale-105 disabled:opacity-50"
            >
              SAIR DA CONTA
            </button>
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
