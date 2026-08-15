'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Crown, Wallet, Menu, X, TrendingUp, Gift,
  ShieldCheck, LogOut, Settings, ChevronDown, User,
  Home, Gamepad2, Trophy, Star, Zap
} from 'lucide-react';
import Link from 'next/link';
import { useStore } from '../store';

interface PremiumHeaderProps {
  user?: {
    username: string;
    balance: number;
    vipLevel: number;
    avatar?: string;
  };
}

const NAV_ITEMS = [
  { name: 'Início', icon: Home, href: '/' },
  { name: 'Jogos', icon: Gamepad2, href: '/games/tiger' },
  { name: 'Depósito', icon: Gift, href: '/deposit' },
  { name: 'Perfil', icon: Crown, href: '/profile' },
];

const VIP_BADGES = {
  1: { name: 'Bronze', gradient: 'from-amber-700 to-amber-900', text: '#CD7F32', emoji: '🥉' },
  2: { name: 'Silver', gradient: 'from-gray-400 to-gray-600', text: '#C0C0C0', emoji: '🥈' },
  3: { name: 'Gold', gradient: 'from-yellow-400 to-yellow-600', text: '#FFD700', emoji: '🥇' },
  4: { name: 'Platinum', gradient: 'from-purple-400 to-purple-700', text: '#E5E4E2', emoji: '💎' },
  5: { name: 'Diamond', gradient: 'from-blue-400 to-cyan-600', text: '#B9F2FF', emoji: '👑' },
};

export default function PremiumHeader({ user }: PremiumHeaderProps) {
  const { logout } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  const badge = VIP_BADGES[(user?.vipLevel || 1) as keyof typeof VIP_BADGES];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-[60]"
        style={{
          background: 'linear-gradient(90deg, #FFD700, #FF8C00)',
          scaleX: scrollYProgress,
          transformOrigin: 'left'
        }}
      />

      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(8, 8, 18, 0.95)'
            : 'rgba(8, 8, 18, 0.7)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: scrolled ? '1px solid rgba(255,215,0,0.12)' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.4)' : 'none'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)' }}>
                  <span className="text-lg">🐯</span>
                </div>
                <span
                  className="text-xl font-black hidden sm:block"
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    background: 'linear-gradient(135deg, #FFD700, #FF8C00)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  TigreBet
                </span>
              </motion.div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ y: -1 }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/8 transition-all duration-200 cursor-pointer"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </motion.div>
                </Link>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Security indicator */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-400 font-medium">SSL</span>
              </div>

              {/* Balance */}
              {user && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/25 transition-all duration-200 cursor-pointer"
                >
                  <Wallet className="w-4 h-4 text-yellow-400" />
                  <div>
                    <p className="text-[10px] text-gray-500 leading-none mb-0.5">Saldo</p>
                    <p
                      className="text-sm font-bold leading-none"
                      style={{
                        background: 'linear-gradient(135deg, #FFD700, #FF8C00)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      R$ {(Number(user.balance) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* VIP Badge */}
              {user && (
                <div
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: `linear-gradient(135deg, ${badge.text}22, ${badge.text}44)`, color: badge.text, border: `1px solid ${badge.text}44` }}
                >
                  <span>{badge.emoji}</span>
                  {badge.name}
                </div>
              )}

              {/* User Menu */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/25 transition-all duration-200"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)' }}>
                      <User className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-sm font-medium text-gray-300 hidden sm:block max-w-[90px] truncate">
                      {user.username}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden shadow-2xl"
                        style={{ background: 'rgba(12, 12, 24, 0.98)', border: '1px solid rgba(255,215,0,0.15)', backdropFilter: 'blur(20px)' }}
                      >
                        <div className="p-4 border-b border-white/8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)' }}>
                              <User className="w-5 h-5 text-black" />
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{user.username}</p>
                              <p className="text-xs" style={{ color: badge.text }}>{badge.emoji} {badge.name}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          {[
                            { icon: User, label: 'Meu Perfil', href: '/profile' },
                            { icon: Wallet, label: 'Carteira', href: '/wallet' },
                            { icon: Gift, label: 'Bônus', href: '/bonuses' },
                            { icon: TrendingUp, label: 'Estatísticas', href: '/stats' },
                            { icon: Settings, label: 'Configurações', href: '/settings' },
                          ].map((item) => (
                            <Link key={item.label} href={item.href}>
                              <motion.div
                                whileHover={{ x: 4, backgroundColor: 'rgba(255,215,0,0.08)' }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-gray-300 hover:text-white"
                              >
                                <item.icon className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm">{item.label}</span>
                              </motion.div>
                            </Link>
                          ))}
                          <div className="border-t border-white/8 mt-1 pt-1">
                            <motion.div
                              whileHover={{ x: 4, backgroundColor: 'rgba(239,68,68,0.08)' }}
                              onClick={() => { logout(); window.location.href = '/login'; }}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-red-400"
                            >
                              <LogOut className="w-4 h-4" />
                              <span className="text-sm">Sair</span>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    >
                      Entrar
                    </motion.button>
                  </Link>
                  <Link href="/register">
                    <motion.button
                      whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(255,165,0,0.4)' }}
                      whileTap={{ scale: 0.97 }}
                      className="px-5 py-2 rounded-xl text-sm font-bold text-black"
                      style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)' }}
                    >
                      Cadastrar
                    </motion.button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setMenuOpen(v => !v)}
                className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/25 transition-all"
              >
                {menuOpen
                  ? <X className="w-5 h-5 text-yellow-400" />
                  : <Menu className="w-5 h-5 text-gray-400" />
                }
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden border-t border-white/8"
            >
              <nav className="px-4 py-4 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <motion.div
                      whileHover={{ x: 6 }}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-yellow-400 hover:bg-yellow-500/8 transition-all cursor-pointer"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </motion.div>
                  </Link>
                ))}
              </nav>

              {user && (
                <div className="px-4 pb-4 flex items-center gap-3">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                    <Wallet className="w-4 h-4 text-yellow-400" />
                    <div>
                      <p className="text-[10px] text-gray-500">Saldo</p>
                      <p className="text-sm font-bold text-yellow-400">R$ {(Number(user.balance) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <Zap className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
