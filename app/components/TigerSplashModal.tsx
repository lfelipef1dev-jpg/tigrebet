'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Play, Sparkles } from 'lucide-react';

interface TigerSplashModalProps {
  onPlay: () => void;
}

export default function TigerSplashModal({ onPlay }: TigerSplashModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = typeof window !== 'undefined' && localStorage.getItem('tiger_splash_seen');
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    setOpen(false);
    if (typeof window !== 'undefined') localStorage.setItem('tiger_splash_seen', '1');
  };

  const handlePlay = () => {
    close();
    onPlay();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={close}
        >
          {/* Floating coins background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(18)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl select-none"
                style={{ left: `${5 + (i * 5.5) % 90}%`, top: `${10 + (i * 7) % 80}%` }}
                initial={{ y: -40, opacity: 0, rotate: 0 }}
                animate={{ y: [0, 18, 0], opacity: [0, 0.7, 0], rotate: 360 }}
                transition={{ duration: 2.5 + (i % 3), repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
              >
                {i % 3 === 0 ? '🪙' : i % 3 === 1 ? '💰' : '🧧'}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.75, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[420px] overflow-hidden rounded-[36px]"
            style={{
              background: 'linear-gradient(180deg, #8a0a0a 0%, #4a0202 55%, #2a0000 100%)',
              border: '3px solid transparent',
              backgroundClip: 'padding-box',
              boxShadow: '0 0 0 3px #FFD700, 0 24px 80px rgba(0,0,0,0.8), 0 0 60px rgba(255,140,0,0.35)',
            }}
          >
            {/* Inner gold border */}
            <div
              className="absolute inset-[8px] rounded-[28px] pointer-events-none"
              style={{ border: '2px solid rgba(255,215,0,0.35)' }}
            />

            {/* Radial glow behind tiger */}
            <div
              className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[90%] h-[55%] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,80,0,0.45) 0%, transparent 70%)' }}
            />

            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,215,0,0.3)' }}
            >
              <X className="w-5 h-5 text-yellow-200" />
            </button>

            {/* Tiger mascot */}
            <div className="relative pt-8 pb-4 flex justify-center">
              <motion.img
                src="/tiger-mascot.svg"
                alt="Fortune Tiger"
                className="relative z-10 select-none w-[200px] h-[200px] md:w-[220px] md:h-[220px]"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                style={{ filter: 'drop-shadow(0 0 28px rgba(255,140,0,0.6))' }}
              />
            </div>

            {/* Content */}
            <div className="relative z-10 px-7 pb-8 text-center">
              {/* Max win badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-black tracking-tight mb-3"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 40%, #FF6B35 70%, #FFD700 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 8px rgba(255,140,0,0.5))',
                }}
              >
                x5000 MAX WIN
              </motion.div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-3 mb-6"
              >
                <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-yellow-300 bg-white/5 border border-yellow-500/20 rounded-full px-3 py-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  RTP 96.5%
                </span>
                <span className="w-1 h-1 rounded-full bg-yellow-500/60" />
                <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-orange-300 bg-white/5 border border-orange-500/20 rounded-full px-3 py-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Alta Volatilidade
                </span>
              </motion.div>

              {/* Play button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(255,215,0,0.55)' }}
                whileTap={{ scale: 0.96 }}
                onClick={handlePlay}
                className="relative w-full py-4.5 rounded-2xl font-black text-lg md:text-xl flex items-center justify-center gap-3 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #FFED8A 0%, #FFD700 30%, #FF8C00 70%, #FF6B00 100%)',
                  color: '#2a0a00',
                  boxShadow: '0 8px 28px rgba(255,140,0,0.45), inset 0 -4px 0 rgba(0,0,0,0.15)',
                }}
              >
                <span
                  className="absolute inset-0 opacity-30"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)' }}
                />
                <Play className="w-5 h-5 fill-current relative z-10" />
                <span className="relative z-10">JOGAR AGORA</span>
              </motion.button>

              <p className="mt-4 text-[10px] text-yellow-500/50 font-bold uppercase tracking-widest">
                Clique para começar a jogar
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
