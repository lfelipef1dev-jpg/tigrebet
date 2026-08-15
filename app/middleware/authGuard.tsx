'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useStore();

  useEffect(() => {
    if (!user.token) {
      router.push('/login');
    }
  }, [user.token, router]);

  if (!user.token) {
    return null;
  }

  return <>{children}</>;
}
