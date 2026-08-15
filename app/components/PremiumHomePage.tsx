'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import {
  Play, Trophy, TrendingUp, Users, ShieldCheck, Zap, Crown, Gift,
  Star, Flame, Eye, Clock, ChevronRight, ArrowUp, Sparkles,
  Target, Percent, Award, Bolt
} from 'lucide-react';
import Link from 'next/link';

interface Game {
  id: string;
  name: string;
  description: string;
  multiplier: string;
  rtp: number;
  volatility: string;
  category: string;
  isNew?: boolean;
  isHot?: boolean;
  isExclusive?: boolean;
  players?: number;
  jackpot?: number;
  href: string;
  gradient: string;
  glowColor: string;
  emoji: string;
  bgPattern: string;
  svgSrc?: string;
}

interface Winner {
  id: string;
  username: string;
  game: string;
  amount: number;
  time: string;
}

const GAMES: Game[] = [
  {
    id: 'fortune-tiger',
    name: 'Fortune Tiger',
    description: 'O lendário tigre dourado com jackpot progressivo e multiplicadores épicos',
    multiplier: 'x5000',
    rtp: 96.5,
    volatility: 'Alta',
    category: 'tiger',
    isExclusive: true,
    players: 2847,
    jackpot: 1250000,
    href: '/games/tiger',
    gradient: 'from-orange-600 via-red-700 to-yellow-600',
    glowColor: 'rgba(251,146,60,0.4)',
    emoji: '🐯',
    bgPattern: 'radial-gradient(circle at 30% 40%, rgba(251,146,60,0.55) 0%, transparent 60%), radial-gradient(circle at 70% 60%, rgba(234,179,8,0.4) 0%, transparent 50%)',
    svgSrc: '/tiger-icon.svg',
  },
  {
    id: 'crash-rocket',
    name: 'Crash Rocket',
    description: 'Multiplique antes da explosão — leia o gráfico, faça cashout na hora certa',
    multiplier: 'x10000',
    rtp: 97.0,
    volatility: 'Extrema',
    category: 'crash',
    isHot: true,
    players: 3521,
    jackpot: 750000,
    href: '/games/crash',
    gradient: 'from-purple-600 via-indigo-700 to-blue-600',
    glowColor: 'rgba(139,92,246,0.4)',
    emoji: '🚀',
    bgPattern: 'radial-gradient(circle at 20% 50%, rgba(139,92,246,0.55) 0%, transparent 60%), radial-gradient(circle at 80% 30%, rgba(59,130,246,0.4) 0%, transparent 50%)'
  },
  {
    id: 'double',
    name: 'Double',
    description: 'Roda ao vivo — aposte no Vermelho, Preto ou Branco e multiplique até 14×',
    multiplier: 'x14',
    rtp: 96.7,
    volatility: 'Média',
    category: 'double',
    isHot: true,
    players: 2134,
    href: '/games/double',
    gradient: 'from-red-700 via-gray-900 to-yellow-600',
    glowColor: 'rgba(239,68,68,0.45)',
    emoji: '🎡',
    bgPattern: 'radial-gradient(circle at 30% 50%, rgba(239,68,68,0.5) 0%, transparent 55%), radial-gradient(circle at 70% 50%, rgba(251,191,36,0.35) 0%, transparent 50%)',
  },
  {
    id: 'plinko-supreme',
    name: 'Plinko Supreme',
    description: 'Física avançada com prêmios multiplicadores — deixe a bola decidir seu destino',
    multiplier: 'x1000',
    rtp: 95.8,
    volatility: 'Média',
    category: 'plinko',
    isNew: true,
    players: 1923,
    href: '/games/plinko',
    gradient: 'from-cyan-600 via-teal-700 to-emerald-600',
    glowColor: 'rgba(6,182,212,0.4)',
    emoji: '🔵',
    bgPattern: 'radial-gradient(circle at 50% 20%, rgba(6,182,212,0.55) 0%, transparent 60%), radial-gradient(circle at 40% 80%, rgba(16,185,129,0.4) 0%, transparent 50%)'
  },
  {
    id: 'mines-elite',
    name: 'Mines Elite',
    description: 'Campo minado profissional — quanto mais longe, maior o multiplicador',
    multiplier: 'x500',
    rtp: 96.2,
    volatility: 'Alta',
    category: 'mines',
    players: 2156,
    jackpot: 500000,
    href: '/games/mines',
    gradient: 'from-green-600 via-lime-700 to-yellow-600',
    glowColor: 'rgba(34,197,94,0.4)',
    emoji: '💎',
    bgPattern: 'radial-gradient(circle at 60% 30%, rgba(34,197,94,0.55) 0%, transparent 60%), radial-gradient(circle at 30% 70%, rgba(234,179,8,0.4) 0%, transparent 50%)'
  },
  {
    id: 'slots-royale',
    name: 'Slots Royale',
    description: 'Máquinas premium com 25 linhas de pagamento e bônus especiais',
    multiplier: 'x2500',
    rtp: 96.8,
    volatility: 'Média-Alta',
    category: 'slots',
    isHot: true,
    players: 4123,
    jackpot: 2000000,
    href: '/games/slots',
    gradient: 'from-yellow-500 via-amber-600 to-orange-700',
    glowColor: 'rgba(234,179,8,0.4)',
    emoji: '🎰',
    bgPattern: 'radial-gradient(circle at 40% 40%, rgba(234,179,8,0.55) 0%, transparent 60%), radial-gradient(circle at 70% 70%, rgba(251,146,60,0.4) 0%, transparent 50%)'
  },
  {
    id: 'wingo',
    name: 'Win Go',
    description: 'Adivinhe a cor e o número — rodadas relâmpago a cada 3 minutos',
    multiplier: 'x9',
    rtp: 95.5,
    volatility: 'Baixa',
    category: 'slots',
    isNew: true,
    players: 5210,
    href: '/games/wingo',
    gradient: 'from-pink-600 via-rose-700 to-red-600',
    glowColor: 'rgba(236,72,153,0.4)',
    emoji: '🎡',
    bgPattern: 'radial-gradient(circle at 30% 60%, rgba(236,72,153,0.55) 0%, transparent 60%), radial-gradient(circle at 70% 30%, rgba(239,68,68,0.4) 0%, transparent 50%)'
  },
  {
    id: 'caixa-premiada',
    name: 'Caixa Premiada',
    description: 'Primeiro a ganhar leva tudo — o pote cresce a cada aposta, só um vencedor',
    multiplier: 'x∞',
    rtp: 97.0,
    volatility: 'Jackpot',
    category: 'jackpot',
    isNew: true,
    isHot: true,
    players: 1847,
    jackpot: 500,
    href: '/games/caixa',
    gradient: 'from-emerald-500 via-green-600 to-teal-700',
    glowColor: 'rgba(16,185,129,0.4)',
    emoji: '💰',
    bgPattern: 'radial-gradient(circle at 40% 30%, rgba(16,185,129,0.6) 0%, transparent 60%), radial-gradient(circle at 70% 70%, rgba(6,182,212,0.4) 0%, transparent 50%)'
  },
  {
    id: 'raspadinha',
    name: 'Raspadinha',
    description: 'Raspe e ganhe motos e dinheiro — 3 símbolos iguais e o prêmio é seu',
    multiplier: 'x1000',
    rtp: 95.0,
    volatility: 'Baixa',
    category: 'scratch',
    isNew: true,
    players: 3102,
    jackpot: 100000,
    href: '/games/raspadinha',
    gradient: 'from-lime-500 via-green-600 to-emerald-700',
    glowColor: 'rgba(132,204,22,0.4)',
    emoji: '🏍️',
    bgPattern: 'radial-gradient(circle at 30% 50%, rgba(132,204,22,0.55) 0%, transparent 60%), radial-gradient(circle at 70% 40%, rgba(34,197,94,0.4) 0%, transparent 50%)'
  }
];

const WINNERS: Winner[] = [
  { id: '1', username: 'Vip***r', game: 'Fortune Tiger', amount: 15420.50, time: 'há 30s' },
  { id: '2', username: 'Luc***n', game: 'Crash Rocket', amount: 8750.00, time: 'há 1min' },
  { id: '3', username: 'Gol***g', game: 'Slots Royale', amount: 12300.75, time: 'há 2min' },
  { id: '4', username: 'Cry***g', game: 'Mines Elite', amount: 6200.25, time: 'há 3min' },
  { id: '5', username: 'Dia***e', game: 'Plinko Supreme', amount: 9450.00, time: 'há 5min' },
  { id: '6', username: 'Tig***o', game: 'Win Go', amount: 3200.00, time: 'há 6min' },
  { id: '7', username: 'Cas***x', game: 'Caixa Premiada', amount: 4750.00, time: 'há 9min' },
];

function AnimatedCounter({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const duration = 1800;
        const step = (timestamp: number) => {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(step);
          else setCount(target);
        };
        requestAnimationFrame(step);
        observer.disconnect();
      }
    }, { threshold: 0.3 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>{prefix}{count.toLocaleString('pt-BR')}{suffix}</span>
  );
}

function TigerFeaturedCard({ game, index }: { game: Game; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: 'easeOut' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group sm:col-span-2 lg:col-span-1"
    >
      <Link href={game.href}>
        <div
          className="relative overflow-hidden rounded-[32px] cursor-pointer transition-all duration-400"
          style={{
            border: '3px solid transparent',
            background: 'linear-gradient(180deg, #8a0a0a 0%, #4a0202 55%, #2a0000 100%)',
            backgroundClip: 'padding-box',
            boxShadow: hovered
              ? `0 0 0 3px #FFD700, 0 24px 64px ${game.glowColor}, 0 0 40px rgba(255,140,0,0.35)`
              : `0 0 0 3px rgba(255,215,0,0.55), 0 6px 24px rgba(0,0,0,0.6)`,
            transform: hovered ? 'translateY(-10px) scale(1.015)' : 'translateY(0) scale(1)',
            transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease',
          }}
        >
          {/* Inner gold border */}
          <div className="absolute inset-[10px] rounded-[24px] pointer-events-none border-2 border-yellow-500/30" />

          {/* Glow behind mascot */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-[55%] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,80,0,0.45) 0%, transparent 70%)' }}
          />

          {/* Visual area */}
          <div className="relative h-[220px] overflow-hidden">
            {/* Background */}
            <div
              className="absolute inset-0 transition-transform duration-700"
              style={{
                background: `${game.bgPattern}, linear-gradient(145deg, #5a0505 0%, #2a0000 100%)`,
                transform: hovered ? 'scale(1.08)' : 'scale(1)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80" />

            {/* Exclusive badge */}
            <div className="absolute top-3 left-3 z-10">
              <span className="text-[9px] font-black px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg flex items-center gap-1">
                <Crown className="w-3 h-3" /> EXCLUSIVO
              </span>
            </div>

            {/* Players online */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-green-400 font-bold">{game.players?.toLocaleString()}</span>
            </div>

            {/* Mascot */}
            <motion.div
              animate={hovered
                ? { scale: 1.12, y: -4, filter: 'drop-shadow(0 0 28px rgba(255,140,0,0.8))' }
                : { scale: [1, 1.04, 1], y: [0, -4, 0], filter: ['drop-shadow(0 0 12px rgba(255,140,0,0.5))', 'drop-shadow(0 0 24px rgba(255,140,0,0.7))', 'drop-shadow(0 0 12px rgba(255,140,0,0.5))'] }
              }
              transition={hovered ? { duration: 0.35 } : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center justify-center pb-2"
            >
              <img src="/tiger-mascot.svg" alt={game.name} width={150} height={150} className="select-none" />
            </motion.div>

            {/* Max win */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
              <span className="text-3xl font-black tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFA500, #FF6B35)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
                }}>
                {game.multiplier} MAX WIN
              </span>
            </div>
          </div>

          {/* Card body */}
          <div className="px-6 pt-4 pb-6 text-center">
            <h3 className="text-[22px] font-black text-white leading-tight mb-1">{game.name}</h3>
            <p className="text-[11px] text-yellow-500/70 mb-4 font-black uppercase tracking-widest">O Tigrinho Original</p>

            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-yellow-300 bg-white/5 border border-yellow-500/20 rounded-full px-3 py-1.5">
                <Sparkles className="w-3 h-3" /> RTP {game.rtp}%
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-orange-300 bg-white/5 border border-orange-500/20 rounded-full px-3 py-1.5">
                <Flame className="w-3 h-3" /> {game.volatility}
              </span>
            </div>

            <motion.div
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl font-black text-base text-center flex items-center justify-center gap-2 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #FFED8A 0%, #FFD700 30%, #FF8C00 70%, #FF6B00 100%)',
                color: '#2a0a00',
                boxShadow: hovered ? '0 8px 28px rgba(255,140,0,0.55)' : '0 4px 14px rgba(255,140,0,0.3)',
              }}
            >
              {hovered && (
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                />
              )}
              <Play className="w-5 h-5 fill-current relative z-10" />
              <span className="relative z-10">JOGAR AGORA</span>
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function GameCard({ game, index }: { game: Game; index: number }) {
  const [hovered, setHovered] = useState(false);

  if (game.id === 'fortune-tiger') {
    return <TigerFeaturedCard game={game} index={index} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: 'easeOut' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group"
    >
      <Link href={game.href}>
        <div
          className="relative overflow-hidden rounded-[28px] cursor-pointer transition-all duration-400 border border-white/8"
          style={{
            boxShadow: hovered
              ? `0 24px 64px ${game.glowColor}, 0 0 0 1px rgba(255,255,255,0.12)`
              : `0 6px 24px rgba(0,0,0,0.5)`,
            transform: hovered ? 'translateY(-10px) scale(1.015)' : 'translateY(0) scale(1)',
            transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease',
          }}
        >
          {/* Visual area */}
          <div className="relative h-[200px] overflow-hidden">
            {/* Background */}
            <div
              className="absolute inset-0 transition-transform duration-700"
              style={{
                background: `${game.bgPattern}, linear-gradient(145deg, #0a0820 0%, #130f28 100%)`,
                transform: hovered ? 'scale(1.08)' : 'scale(1)',
              }}
            />
            {/* Gradient vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80" />

            {/* Particles on hover */}
            {hovered && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{ backgroundColor: game.glowColor, left: `${15 + i * 14}%` }}
                    initial={{ y: '110%', opacity: 0 }}
                    animate={{ y: '-10%', opacity: [0, 0.9, 0] }}
                    transition={{ duration: 1.4 + i * 0.18, repeat: Infinity, delay: i * 0.12, ease: 'easeOut' }}
                  />
                ))}
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
              {game.isExclusive && (
                <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" /> EXCLUSIVO
                </span>
              )}
              {game.isNew && (
                <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-green-500 text-black shadow-lg">NOVO</span>
              )}
              {game.isHot && (
                <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg flex items-center gap-1">
                  <Flame className="w-2.5 h-2.5" /> HOT
                </span>
              )}
            </div>

            {/* Players online */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-green-400 font-bold">{game.players?.toLocaleString()}</span>
            </div>

            {/* Main icon */}
            <motion.div
              animate={hovered
                ? { scale: 1.18, y: -6, filter: `drop-shadow(0 0 28px ${game.glowColor})` }
                : { scale: [1, 1.06, 1], y: [0, -5, 0], filter: [`drop-shadow(0 0 6px ${game.glowColor})`, `drop-shadow(0 0 18px ${game.glowColor})`, `drop-shadow(0 0 6px ${game.glowColor})`] }
              }
              transition={hovered
                ? { duration: 0.35, ease: 'easeOut' }
                : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
              }
              className="absolute inset-0 flex items-center justify-center pb-6"
            >
              {game.svgSrc ? (
                <img src={game.svgSrc} alt={game.name} width={88} height={88} className="select-none" />
              ) : (
                <span className="text-[88px] select-none leading-none">{game.emoji}</span>
              )}
            </motion.div>

            {/* Multiplier */}
            <div className="absolute bottom-3 left-4 z-10">
              <span className={`text-2xl font-black bg-gradient-to-r ${game.gradient} bg-clip-text text-transparent drop-shadow-lg`}>
                {game.multiplier}
              </span>
            </div>

            {/* Jackpot pill */}
            {game.jackpot && (
              <div className="absolute bottom-3 right-4 z-10">
                <span className="text-[9px] font-black px-2 py-1 rounded-full bg-black/70 text-purple-300 border border-purple-500/30">
                  JP R${(game.jackpot / 1000).toFixed(0)}K
                </span>
              </div>
            )}
          </div>

          {/* Card body */}
          <div className="bg-gradient-to-b from-[#111128] to-[#0c0c20] px-5 pt-4 pb-5">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-[17px] font-black text-white leading-tight">{game.name}</h3>
              <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5 flex-shrink-0 ml-2">
                <span className="text-[9px] text-green-400 font-black">{game.rtp}%</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mb-4 line-clamp-2 leading-relaxed">{game.description}</p>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-white/5 rounded-xl p-2 text-center border border-white/5">
                <div className="text-[8px] text-gray-600 uppercase tracking-wider font-black mb-0.5">Tipo</div>
                <div className="text-[10px] font-black text-yellow-400">{game.volatility}</div>
              </div>
              <div className="flex-1 bg-white/5 rounded-xl p-2 text-center border border-white/5">
                <div className="text-[8px] text-gray-600 uppercase tracking-wider font-black mb-0.5">Max</div>
                <div className={`text-[10px] font-black bg-gradient-to-r ${game.gradient} bg-clip-text text-transparent`}>{game.multiplier}</div>
              </div>
              <div className="flex-1 bg-white/5 rounded-xl p-2 text-center border border-white/5">
                <div className="text-[8px] text-gray-600 uppercase tracking-wider font-black mb-0.5">Online</div>
                <div className="text-[10px] font-black text-green-400">{(game.players || 0) > 999 ? `${((game.players || 0)/1000).toFixed(1)}K` : game.players}</div>
              </div>
            </div>

            <motion.div
              whileTap={{ scale: 0.97 }}
              className={`w-full py-3 rounded-2xl font-black text-sm text-center bg-gradient-to-r ${game.gradient} text-white flex items-center justify-center gap-2 relative overflow-hidden`}
              style={{ boxShadow: hovered ? `0 6px 24px ${game.glowColor}` : 'none', transition: 'box-shadow 0.3s ease' }}
            >
              {hovered && (
                <motion.div
                  className="absolute inset-0 bg-white/10"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                />
              )}
              <Play className="w-4 h-4 fill-current relative z-10" />
              <span className="relative z-10">Jogar Agora</span>
              <ChevronRight className="w-4 h-4 relative z-10" />
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function LiveTickerWinner({ winner }: { winner: Winner }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[260px] backdrop-blur-sm"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center flex-shrink-0">
        <Trophy className="w-5 h-5 text-black" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-white text-sm truncate">{winner.username}</span>
          <span className="text-xs text-gray-500 flex-shrink-0">{winner.time}</span>
        </div>
        <p className="text-xs text-gray-400 truncate">{winner.game}</p>
        <p className="text-sm font-bold text-green-400">
          +R$ {winner.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
      <ArrowUp className="w-4 h-4 text-green-400 flex-shrink-0" />
    </motion.div>
  );
}

export default function PremiumHomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [jackpotAmount, setJackpotAmount] = useState(1_987_432.50);
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, 60]);

  const categories = [
    { id: 'all', name: 'Todos', icon: '🎮', count: GAMES.length },
    { id: 'tiger', name: 'Tiger', icon: '🐯', count: 1 },
    { id: 'crash', name: 'Crash', icon: '🚀', count: 1 },
    { id: 'plinko', name: 'Plinko', icon: '🔵', count: 1 },
    { id: 'mines', name: 'Mines', icon: '💎', count: 1 },
    { id: 'slots', name: 'Slots', icon: '🎰', count: 2 },
    { id: 'jackpot', name: 'Jackpot', icon: '💰', count: 1 },
    { id: 'scratch', name: 'Raspa', icon: '🏍️', count: 1 },
  ];

  // Jackpot live counter
  useEffect(() => {
    const interval = setInterval(() => {
      setJackpotAmount(prev => prev + Math.random() * 12.5);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Rotate winners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWinnerIndex(prev => (prev + 1) % WINNERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredGames = selectedCategory === 'all'
    ? GAMES
    : GAMES.filter(g => g.category === selectedCategory);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0e0520 0%, #0a0a1a 40%, #080812 100%)' }}>

      {/* ===== HERO SECTION ===== */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[70vh] flex items-center">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,rgba(140,50,230,0.6),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_85%_60%,rgba(220,90,0,0.45),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_15%_80%,rgba(0,120,230,0.35),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(180,80,255,0.15),transparent)]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,215,0,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,0,0.06)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="container mx-auto px-4 relative z-10 pt-4"
        >
          <div className="text-center max-w-5xl mx-auto">
            {/* Live badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 mb-8 text-sm font-medium text-white"
            >
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>47.892 jogadores online agora</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="text-5xl sm:text-7xl md:text-9xl font-black mb-6 leading-none tracking-tighter"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 30%, #FF6B35 60%, #FFD700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: "'Orbitron', monospace",
                filter: 'drop-shadow(0 0 40px rgba(255,165,0,0.3))'
              }}
            >
              TigreBet
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              A plataforma de jogos mais premium do Brasil.
              Jackpots progressivos, RTP certificado e saques instantâneos.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <Link href="/games/tiger">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255,165,0,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  className="px-10 py-4 rounded-2xl font-bold text-lg text-black flex items-center gap-3"
                  style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)' }}
                >
                  <Play className="w-6 h-6 fill-black" />
                  Jogar Agora
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-4 rounded-2xl font-bold text-lg text-white flex items-center gap-3 border border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <Gift className="w-6 h-6 text-yellow-400" />
                Bônus R$ 500
              </motion.button>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
            >
              {[
                { icon: Users, label: 'Online Agora', value: 47892, suffix: '', color: 'text-green-400' },
                { icon: Trophy, label: 'Prêmios Hoje', value: 2810000, prefix: 'R$', suffix: '', color: 'text-yellow-400' },
                { icon: TrendingUp, label: 'Maior Pag.', value: 154000, prefix: 'R$', suffix: '', color: 'text-purple-400' },
                { icon: ShieldCheck, label: 'RTP Médio', value: 97, suffix: '%', color: 'text-blue-400' }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-center"
                >
                  <stat.icon className={`w-7 h-7 mx-auto mb-2 ${stat.color}`} />
                  <p className={`text-base sm:text-xl font-black leading-tight truncate ${stat.color}`}>
                    <AnimatedCounter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ===== LIVE JACKPOT BANNER ===== */}
      <section className="py-6 px-4 overflow-hidden">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-yellow-500/30"
            style={{ background: 'linear-gradient(135deg, rgba(160,70,0,0.85) 0%, rgba(90,0,150,0.7) 50%, rgba(0,50,140,0.75) 100%)' }}
          >
            {/* Animated glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.15),transparent_70%)] animate-pulse" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 p-8 md:p-10">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-5xl"
                >
                  🏆
                </motion.div>
                <div>
                  <p className="text-sm font-bold text-yellow-400/80 uppercase tracking-widest mb-1">Jackpot Progressivo</p>
                  <div
                    className="text-4xl md:text-6xl font-black tabular-nums"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontFamily: "'Orbitron', monospace"
                    }}
                  >
                    R$ {jackpotAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    Aumentando em tempo real
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span>Último ganhador há 12 min</span>
                </div>
                <Link href="/games/tiger">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255,215,0,0.5)' }}
                    whileTap={{ scale: 0.97 }}
                    className="px-8 py-3 rounded-xl font-bold text-black text-sm"
                    style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)' }}
                  >
                    Disputar Jackpot
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== LIVE WINNERS TICKER ===== */}
      <section className="py-4 px-4 overflow-hidden">
        <div className="container mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Ao Vivo</span>
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="flex gap-4">
                <AnimatePresence>
                  {WINNERS.slice(currentWinnerIndex, currentWinnerIndex + 3).map((winner) => (
                    <LiveTickerWinner key={winner.id + winner.time} winner={winner} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== GAMES SECTION ===== */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-5 py-2 mb-4 text-sm text-yellow-400 font-medium">
              <Sparkles className="w-4 h-4" />
              Jogos Exclusivos
            </div>
            <h2
              className="text-4xl md:text-6xl font-black mb-4"
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: "'Orbitron', monospace"
              }}
            >
              Jogos Premium
            </h2>
            <p className="text-xl text-gray-400 max-w-xl mx-auto">
              Seleção exclusiva com RTP certificado e prêmios massivos
            </p>
          </motion.div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? 'text-black shadow-lg'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:border-yellow-500/30 hover:text-yellow-400'
                }`}
                style={selectedCategory === cat.id ? { background: 'linear-gradient(135deg, #FFD700, #FF8C00)', boxShadow: '0 0 20px rgba(255,165,0,0.4)' } : {}}
              >
                <span>{cat.icon}</span>
                {cat.name}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedCategory === cat.id ? 'bg-black/20' : 'bg-white/10'}`}>{cat.count}</span>
              </motion.button>
            ))}
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredGames.map((game, index) => (
                <GameCard key={game.id} game={game} index={index} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2
              className="text-4xl md:text-5xl font-black mb-4"
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: "'Orbitron', monospace"
              }}
            >
              Por Que TigreBet?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: 'Segurança Máxima', description: 'Criptografia AES-256, SSL e licença internacional garantindo total proteção', color: 'from-blue-500 to-cyan-600', glow: 'rgba(59,130,246,0.3)' },
              { icon: Crown, title: 'Programa VIP', description: '5 níveis de benefícios exclusivos com gerente pessoal e cashback de até 7%', color: 'from-purple-500 to-pink-600', glow: 'rgba(168,85,247,0.3)' },
              { icon: Zap, title: 'Saque Instantâneo', description: 'PIX aprovado em menos de 5 minutos, 24 horas por dia, 7 dias por semana', color: 'from-yellow-500 to-orange-600', glow: 'rgba(234,179,8,0.3)' },
              { icon: Target, title: 'RTP Certificado', description: 'Taxa de retorno ao jogador verificada de até 97% por auditoria independente', color: 'from-green-500 to-emerald-600', glow: 'rgba(34,197,94,0.3)' },
              { icon: Gift, title: 'Bônus Diários', description: 'Rodadas grátis, cashback e missões com recompensas todos os dias', color: 'from-red-500 to-rose-600', glow: 'rgba(239,68,68,0.3)' },
              { icon: Star, title: 'Suporte 24/7', description: 'Time especializado no chat, WhatsApp e e-mail sempre pronto para ajudar', color: 'from-indigo-500 to-blue-600', glow: 'rgba(99,102,241,0.3)' }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -6, boxShadow: `0 20px 40px ${feature.glow}` }}
                className="relative group bg-white/5 border border-white/10 rounded-3xl p-7 overflow-hidden cursor-default transition-all duration-300 hover:border-white/20"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${feature.glow}, transparent 70%)` }}
                />
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 relative z-10 transition-transform duration-300 group-hover:scale-110`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed relative z-10">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== VIP SECTION ===== */}
      <section className="py-16 px-4 overflow-hidden">
        <div className="container mx-auto">
          <div
            className="relative rounded-3xl overflow-hidden border border-yellow-500/20 p-10 md:p-16"
            style={{ background: 'linear-gradient(135deg, #2a1000 0%, #180030 50%, #001428 100%)' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,165,0,0.1),transparent_70%)]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />

            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-7xl mb-6 inline-block"
              >
                👑
              </motion.div>
              <h2
                className="text-4xl md:text-5xl font-black mb-4"
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: "'Orbitron', monospace"
                }}
              >
                Programa VIP
              </h2>
              <p className="text-xl text-gray-300 mb-10 leading-relaxed">
                5 níveis exclusivos com cashback, bônus semanais, gerente pessoal
                e limites de saque aumentados. Quanto mais você joga, mais você ganha.
              </p>

              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {[
                  { name: 'Bronze', color: '#CD7F32', emoji: '🥉', cashback: '1%' },
                  { name: 'Silver', color: '#C0C0C0', emoji: '🥈', cashback: '2%' },
                  { name: 'Gold', color: '#FFD700', emoji: '🥇', cashback: '3%' },
                  { name: 'Platinum', color: '#E5E4E2', emoji: '💎', cashback: '5%' },
                  { name: 'Diamond', color: '#B9F2FF', emoji: '👑', cashback: '7%' }
                ].map((vip, i) => (
                  <motion.div
                    key={vip.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className="flex flex-col items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 cursor-pointer hover:border-white/30 transition-all"
                  >
                    <span className="text-3xl">{vip.emoji}</span>
                    <span className="font-bold text-sm" style={{ color: vip.color }}>{vip.name}</span>
                    <span className="text-xs text-gray-400">Cashback {vip.cashback}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255,165,0,0.5)' }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-4 rounded-2xl font-bold text-black text-lg inline-flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)' }}
              >
                <Crown className="w-6 h-6" />
                Quero ser VIP
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER CTA ===== */}
      <section className="py-12 px-4 border-t border-white/5">
        <div className="container mx-auto text-center">
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            TigreBet é uma plataforma de entretenimento para maiores de 18 anos.
            Jogue com responsabilidade. Se precisar de ajuda, acesse nosso suporte.
          </p>
        </div>
      </section>
    </div>
  );
}
