'use client';

import PremiumHeader from './components/PremiumHeader';
import PremiumHomePage from './components/PremiumHomePage';
import { useStore } from './store';
import { useEffect } from 'react';

export default function Home() {
  const { user, game, setSelectedCoin } = useStore();

  useEffect(() => {
    // Força moeda principal para BRL (ETC interno)
    setSelectedCoin('ETC');
  }, [setSelectedCoin]);

  return (
    <>
      <PremiumHeader
        user={user.token ? {
          username: user.username || user.mobile || 'Jogador',
          balance: game.balance.ETC,
          vipLevel: user.vipLevel || 1,
        } : undefined}
      />
      <main className="pt-20">
        <PremiumHomePage />
      </main>
    </>
  );
}
