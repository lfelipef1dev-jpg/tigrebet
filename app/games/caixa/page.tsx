'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import {
  Lock, Unlock, TrendingUp, Trophy, Users, Zap, Clock,
  ChevronRight, Info, RefreshCw, Shield, Hash
} from 'lucide-react';
import Link from 'next/link';
import { caixaAPI } from '../../lib/api';

interface BetOption {
  amount: number;
  winChance: number;
  label: string;
}

interface RecentWinner {
  amount: number;
  betAmount: number;
  time: string;
  multiplier: number;
}

interface StatusData {
  currentPot: number;
  seedAmount: number;
  betOptions: BetOption[];
  lastWonAt: string | null;
  lastWonAmount: number | null;
  totalBetsAllTime: number;
  totalPaidOut: number;
  recentWinners: RecentWinner[];
}

interface PlayResult {
  won: boolean;
  roll: number;
  winChance: number;
  winAmount: number;
  potBefore: number;
  potAfter: number;
  contribution: number;
  balance: number;
  vipPoints: number;
  provablyFairHash: string;
}

type Coin = 'ETC' | 'ETH' | 'BTC';

function VaultDoor({ isOpen, isWinning }: { isOpen: boolean; isWinning: boolean }) {
  return (
    <div className="relative w-48 h-48 mx-auto select-none">
      {/* Vault body */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-4 border-slate-600 shadow-2xl" />

      {/* Inner ring */}
      <div className="absolute inset-3 rounded-full border-2 border-slate-500/50" />

      {/* Bolts */}
      {[0, 90, 180, 270].map((deg) => (
        <div
          key={deg}
          className="absolute w-4 h-4 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 border border-slate-400/30"
          style={{
            top: `calc(50% - 8px + ${Math.sin((deg * Math.PI) / 180) * 70}px)`,
            left: `calc(50% - 8px + ${Math.cos((deg * Math.PI) / 180) * 70}px)`,
          }}
        />
      ))}

      {/* Door that swings open */}
      <motion.div
        className="absolute inset-4 rounded-full overflow-hidden"
        animate={{ rotateY: isOpen ? -120 : 0 }}
        transition={{ type: 'spring', stiffness: 60, damping: 15 }}
        style={{ transformOrigin: 'left center', perspective: 400 }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 border-2 border-slate-500" />
        {/* Handle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-700 border-2 border-yellow-400/50 shadow-lg flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-yellow-300/30" />
          </div>
        </div>
      </motion.div>

      {/* Win glow overlay */}
      <AnimatePresence>
        {isWinning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 1, 0.8], scale: [0.8, 1.2, 1.1] }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(16,185,129,0.8) 0%, rgba(6,182,212,0.4) 50%, transparent 70%)',
              boxShadow: '0 0 60px rgba(16,185,129,0.8)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          {isWinning ? (
            <motion.span
              key="win"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              className="text-5xl"
            >
              💰
            </motion.span>
          ) : isOpen ? (
            <motion.div key="open" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Unlock className="w-10 h-10 text-emerald-400" />
            </motion.div>
          ) : (
            <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Lock className="w-10 h-10 text-slate-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AnimatedPot({ value }: { value: number }) {
  const motionVal = useMotionValue(value);
  const springVal = useSpring(motionVal, { stiffness: 100, damping: 20 });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  useEffect(() => {
    const unsub = springVal.on('change', (v) => setDisplay(v));
    return unsub;
  }, [springVal]);

  return (
    <span className="tabular-nums">
      R$ {display.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

function WinParticles({ active }: { active: boolean }) {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    angle: (i / 24) * 360,
    distance: 80 + Math.random() * 80,
    size: 4 + Math.random() * 8,
    color: ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899'][i % 5],
    delay: Math.random() * 0.3,
  }));

  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                opacity: 0,
                scale: 0,
              }}
              transition={{ duration: 1.2, delay: p.delay, ease: 'easeOut' }}
              className="absolute rounded-full"
              style={{ width: p.size, height: p.size, background: p.color }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

const COIN_OPTIONS: { value: Coin; label: string; color: string }[] = [
  { value: 'ETC', label: 'ETC', color: 'text-emerald-400' },
  { value: 'ETH', label: 'ETH', color: 'text-blue-400' },
  { value: 'BTC', label: 'BTC', color: 'text-amber-400' },
];

export default function CaixaPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [selectedBet, setSelectedBet] = useState<BetOption | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<Coin>('ETC');
  const [result, setResult] = useState<PlayResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [winning, setWinning] = useState(false);
  const [showFairHash, setShowFairHash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [potDisplay, setPotDisplay] = useState(500);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await caixaAPI.status();
      const data: StatusData = res.data.data;
      setStatus(data);
      setPotDisplay(data.currentPot);
      if (!selectedBet && data.betOptions.length > 0) {
        setSelectedBet(data.betOptions[0]);
      }
    } catch {
      // silent — pot polling shouldn't interrupt the UX
    }
  }, [selectedBet]);

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchStatus]);

  const handlePlay = async () => {
    if (!selectedBet || loading) return;
    setError(null);
    setLoading(true);
    setVaultOpen(false);
    setWinning(false);
    setResult(null);

    try {
      const res = await caixaAPI.play({ amount: selectedBet.amount, coin: selectedCoin });
      const data: PlayResult = res.data.data;
      setResult(data);

      // Animate vault opening
      await new Promise(r => setTimeout(r, 300));
      setVaultOpen(true);

      if (data.won) {
        await new Promise(r => setTimeout(r, 400));
        setWinning(true);
        setPotDisplay(data.potAfter);
        await new Promise(r => setTimeout(r, 3000));
        setWinning(false);
      } else {
        setPotDisplay(data.potAfter);
        await new Promise(r => setTimeout(r, 1200));
        setVaultOpen(false);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg || 'Erro ao jogar. Tente novamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const winChancePercent = selectedBet
    ? (selectedBet.winChance * 100).toFixed(1)
    : '0';

  const growthBonus = status
    ? Math.min(((status.currentPot / status.seedAmount - 1) * 0.08), 0.25)
    : 0;

  const effectiveChance = selectedBet
    ? Math.min(selectedBet.winChance + growthBonus, 0.80)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Link>
            <span className="text-2xl">💰</span>
            <div>
              <h1 className="font-bold text-white leading-none">Caixa Premiada</h1>
              <p className="text-xs text-emerald-400">Primeiro a ganhar leva tudo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium">
                {(status?.totalBetsAllTime ?? 0).toLocaleString()} apostas
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Vault + Pot */}
          <div className="lg:col-span-2 space-y-6">

            {/* Pot Card */}
            <motion.div
              className="relative rounded-2xl overflow-hidden border border-emerald-500/20"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,182,212,0.06) 100%)',
              }}
              animate={{
                boxShadow: winning
                  ? ['0 0 40px rgba(16,185,129,0.8)', '0 0 80px rgba(16,185,129,0.5)', '0 0 40px rgba(16,185,129,0.8)']
                  : '0 0 20px rgba(16,185,129,0.1)',
              }}
              transition={{ duration: 0.8, repeat: winning ? Infinity : 0 }}
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'radial-gradient(ellipse at 30% 30%, rgba(16,185,129,0.2) 0%, transparent 70%)',
                }}
              />

              <div className="relative p-8 flex flex-col items-center gap-6">
                {/* Vault */}
                <div className="relative">
                  <VaultDoor isOpen={vaultOpen} isWinning={winning} />
                  <WinParticles active={winning} />
                </div>

                {/* Pot value */}
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-1 uppercase tracking-widest font-medium">Pote atual</p>
                  <motion.div
                    className="text-4xl md:text-5xl font-black text-transparent bg-clip-text"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, #10b981, #06b6d4, #f59e0b)',
                    }}
                    animate={{ scale: winning ? [1, 1.08, 1] : 1 }}
                    transition={{ duration: 0.5, repeat: winning ? 3 : 0 }}
                  >
                    <AnimatedPot value={potDisplay} />
                  </motion.div>
                  {status?.lastWonAt && (
                    <p className="text-xs text-slate-500 mt-2 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      Último ganho: {new Date(status.lastWonAt).toLocaleDateString('pt-BR')}
                      {status.lastWonAmount && ` — R$ ${status.lastWonAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </p>
                  )}
                </div>

                {/* Result overlay */}
                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`w-full rounded-xl p-4 border text-center ${
                        result.won
                          ? 'bg-emerald-500/20 border-emerald-500/40'
                          : 'bg-slate-800/60 border-slate-700/40'
                      }`}
                    >
                      {result.won ? (
                        <>
                          <p className="text-2xl font-black text-emerald-400">
                            VOCÊ GANHOU!
                          </p>
                          <p className="text-3xl font-black text-white mt-1">
                            +R$ {result.winAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-emerald-300 mt-1">
                            {result.vipPoints} pontos VIP ganhos
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-bold text-slate-300">Não foi dessa vez...</p>
                          <p className="text-sm text-slate-400 mt-1">
                            Chance: {(result.winChance * 100).toFixed(1)}% — Rolagem: {result.roll.toFixed(4)}
                          </p>
                          <p className="text-xs text-emerald-400 mt-1">
                            +R$ {result.contribution.toFixed(2)} adicionados ao pote
                          </p>
                        </>
                      )}

                      {/* Provably Fair */}
                      <button
                        onClick={() => setShowFairHash(!showFairHash)}
                        className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors mx-auto"
                      >
                        <Shield className="w-3 h-3" />
                        Provably Fair
                      </button>
                      <AnimatePresence>
                        {showFairHash && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 p-2 bg-slate-900/80 rounded-lg flex items-start gap-2 text-left">
                              <Hash className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                              <p className="text-xs text-slate-400 break-all font-mono">
                                {result.provablyFairHash}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Bet grid */}
            <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
                Escolha sua aposta
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(status?.betOptions ?? []).map((opt) => {
                  const isSelected = selectedBet?.amount === opt.amount;
                  const bonus = Math.min(((status?.currentPot ?? 500) / (status?.seedAmount ?? 500) - 1) * 0.08, 0.25);
                  const effective = Math.min(opt.winChance + bonus, 0.80);

                  return (
                    <motion.button
                      key={opt.amount}
                      onClick={() => setSelectedBet(opt)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative rounded-xl p-3 border transition-all text-left ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                          : 'bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50'
                      }`}
                    >
                      <p className={`text-base font-black ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {(effective * 100).toFixed(1)}% chance
                      </p>
                      {isSelected && (
                        <motion.div
                          layoutId="bet-select"
                          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Coin selector + Play button */}
            <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                  Moeda
                </h3>
                <div className="flex gap-2">
                  {COIN_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setSelectedCoin(c.value)}
                      className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all ${
                        selectedCoin === c.value
                          ? `bg-slate-700 border-slate-500 ${c.color}`
                          : 'bg-slate-800/40 border-slate-700/30 text-slate-400 hover:border-slate-600/50'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stats row */}
              {selectedBet && (
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-slate-800/40 rounded-xl p-2.5">
                    <p className="text-slate-500 mb-0.5">Chance efetiva</p>
                    <p className="font-bold text-emerald-400">{(effectiveChance * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-2.5">
                    <p className="text-slate-500 mb-0.5">Pote ao ganhar</p>
                    <p className="font-bold text-amber-400">
                      R$ {(status?.currentPot ?? 500).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-2.5">
                    <p className="text-slate-500 mb-0.5">Contribuição</p>
                    <p className="font-bold text-cyan-400">
                      R$ {((selectedBet.amount * 0.7)).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Play button */}
              <motion.button
                onClick={handlePlay}
                disabled={!selectedBet || loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.97 }}
                className={`w-full py-4 rounded-xl font-black text-lg tracking-wide transition-all relative overflow-hidden ${
                  !selectedBet || loading
                    ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)]'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    >
                      <RefreshCw className="w-5 h-5" />
                    </motion.div>
                    Abrindo a caixa...
                  </span>
                ) : selectedBet ? (
                  `Apostar ${selectedBet.label} — Abrir Caixa`
                ) : (
                  'Selecione uma aposta'
                )}

                {/* Shimmer */}
                {!loading && selectedBet && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                )}
              </motion.button>
            </div>
          </div>

          {/* RIGHT: Info + Recent Winners */}
          <div className="space-y-5">

            {/* How it works */}
            <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Como funciona</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex-shrink-0 flex items-center justify-center text-xs text-emerald-400 font-bold mt-0.5">1</span>
                  O pote começa em <span className="text-white font-semibold">R$ 500</span> e cresce com cada aposta
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex-shrink-0 flex items-center justify-center text-xs text-emerald-400 font-bold mt-0.5">2</span>
                  <span><span className="text-white font-semibold">70%</span> de cada aposta vai direto pro pote</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex-shrink-0 flex items-center justify-center text-xs text-emerald-400 font-bold mt-0.5">3</span>
                  O <span className="text-white font-semibold">primeiro</span> a ganhar leva o pote inteiro
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex-shrink-0 flex items-center justify-center text-xs text-emerald-400 font-bold mt-0.5">4</span>
                  Quanto maior o pote, <span className="text-white font-semibold">maior a chance</span> de vencer
                </li>
              </ul>
            </div>

            {/* Pot growth indicator */}
            <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">Crescimento do pote</h3>
                </div>
                <span className="text-xs text-emerald-400 font-mono">
                  +{(growthBonus * 100).toFixed(1)}% bônus
                </span>
              </div>
              <div className="relative h-3 rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                  }}
                  animate={{
                    width: `${Math.min(((status?.currentPot ?? 500) / 5000) * 100, 100)}%`,
                  }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-slate-500">
                <span>R$ 500</span>
                <span>R$ 5.000</span>
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Estatísticas</h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Total apostas', value: (status?.totalBetsAllTime ?? 0).toLocaleString('pt-BR') },
                  { label: 'Total pago', value: `R$ ${(status?.totalPaidOut ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
                  { label: 'Último ganho', value: status?.lastWonAmount ? `R$ ${status.lastWonAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-xs text-slate-500">{s.label}</span>
                    <span className="text-xs font-semibold text-white">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent winners */}
            <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-semibold text-white">Últimos ganhadores</h3>
              </div>
              <div className="space-y-2.5">
                {(status?.recentWinners ?? []).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    Seja o primeiro a ganhar!
                  </p>
                ) : (
                  status?.recentWinners.map((w, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">
                            R$ {w.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-slate-500">
                            {w.multiplier.toFixed(1)}x — apostou R$ {w.betAmount}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-600">
                        {new Date(w.time).toLocaleDateString('pt-BR')}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Provably fair badge */}
            <div className="rounded-2xl bg-slate-900/60 border border-emerald-500/10 p-4 flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Provably Fair</p>
                <p className="text-xs text-slate-400">Cada resultado é verificável via HMAC-SHA256</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
