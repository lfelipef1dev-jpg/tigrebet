'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const COMING_SOON = [
  { emoji: '💸', title: 'Cashback Semanal', desc: 'Receba de volta uma % das suas apostas toda semana.' },
  { emoji: '👥', title: 'Indicação de Amigos', desc: 'Ganhe bônus cada vez que um amigo se cadastrar com seu código.' },
  { emoji: '👑', title: 'Bônus VIP', desc: 'Recompensas exclusivas para jogadores de alto nível.' },
];

export default function BonusesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#080810] via-[#0d0d20] to-[#080810] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-yellow-500/6 blur-[120px] rounded-full" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <span className="text-lg">🔙</span>
          </Link>
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent uppercase tracking-tight">Bônus</h1>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Suas recompensas</p>
          </div>
        </div>

        <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-3">Bônus Ativos</div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-yellow-500/20 rounded-[24px] p-5 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-2xl rounded-full pointer-events-none" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/15 flex items-center justify-center text-2xl flex-shrink-0">🎁</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-black text-white text-sm">Bônus de Boas-vindas</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase text-green-400 bg-green-500/15">ATIVO</span>
              </div>
              <p className="text-[10px] text-gray-500 font-bold mb-2">Ao criar sua conta</p>
              <p className="text-xs text-gray-400 leading-relaxed">Receba R$ 10.000 de saldo inicial em cada moeda ao se cadastrar.</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {['ETC', 'ETH', 'BTC'].map(c => (
                  <div key={c} className="bg-yellow-500/8 border border-yellow-500/15 rounded-xl p-2 text-center">
                    <div className="text-[9px] text-yellow-500/70 font-black">{c}</div>
                    <div className="text-sm font-black text-yellow-400">R$ 10.000</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-3">Em Breve</div>
        <div className="space-y-3">
          {COMING_SOON.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="bg-[#111] border border-white/6 rounded-[20px] p-4 flex items-center gap-4 opacity-55">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">{b.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-gray-300 text-sm">{b.title}</span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/8 text-gray-500 uppercase">Em breve</span>
                </div>
                <p className="text-[11px] text-gray-600 mt-0.5">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
