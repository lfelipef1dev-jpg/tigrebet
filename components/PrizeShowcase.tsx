'use client'

import { motion } from 'framer-motion'
import { Gift } from 'lucide-react'

interface Prize {
  name: string
  value: number
  image: string
}

interface PrizeShowcaseProps {
  prizes: Prize[]
}

export default function PrizeShowcase({ prizes }: PrizeShowcaseProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
      <motion.h2
        className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-3"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring" }}
      >
        <motion.span
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          🎁
        </motion.span>
        Prêmios em Destaque
        <motion.span
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          🎁
        </motion.span>
      </motion.h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {prizes.map((prize, index) => (
          <motion.div
            key={index}
            className="relative group cursor-pointer"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -10 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-2xl p-4 border border-yellow-400/30 overflow-hidden">
              <motion.div
                className="relative aspect-square rounded-xl overflow-hidden mb-3"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={prize.image}
                  alt={prize.name}
                  className="w-full h-full object-cover"
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
              <motion.h3
                className="text-white font-semibold text-sm mb-1 truncate"
                whileHover={{ color: '#fbbf24' }}
              >
                {prize.name}
              </motion.h3>
              <motion.p
                className="text-yellow-400 font-bold"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                R$ {prize.value.toLocaleString('pt-BR')}
              </motion.p>
              
              {/* Glow effect on hover */}
              <motion.div
                className="absolute inset-0 bg-yellow-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0, 0.3, 0],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
