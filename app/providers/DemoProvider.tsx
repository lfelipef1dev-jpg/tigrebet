'use client';

import { useEffect } from 'react';
import { useStore } from '../store';

export default function DemoProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser, game, setGame } = useStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDemo = window.location.hostname.includes('expostacker.com.br') || window.location.hostname.includes('pages.dev');
    if (!isDemo) return;

    const saved = localStorage.getItem('demo_balance');
    const balance = saved ? parseFloat(saved) : 10000;

    // Se ainda nao tem saldo demo, inicializa
    if (user.balance.ETC === 0 && user.balance.ETH === 0 && user.balance.BTC === 0) {
      setUser({
        balance: { ETC: balance, ETH: balance, BTC: balance },
        username: 'Demo Player',
        vipLevel: 3,
      });
      setGame({
        balance: { ETC: balance, ETH: balance, BTC: balance },
      });
      if (!saved) localStorage.setItem('demo_balance', String(balance));
    }
  }, [user.balance.ETC, user.balance.ETH, user.balance.BTC, setUser, setGame]);

  return <>{children}</>;
}
