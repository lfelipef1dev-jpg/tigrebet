'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trophy } from 'lucide-react'

interface Winner {
  name: string
  prize: string
  value: string
  image?: string
}

interface RecentWinnersProps {
  winners: Winner[]
}

export default function RecentWinners({ winners }: RecentWinnersProps) {
  return (
    <div className="space-y-3">
      <AnimatePresence>
        {winners.map((winner, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 5 }}
            className="bg-gradient-to-r from-white/10 to-white/5 rounded-2xl p-4 border border-white/20 hover:border-yellow-400/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <motion.div
                className="relative flex-shrink-0"
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: "spring" }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full bg-yellow-400/30 blur-xl"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              
              {winner.image && (
                <motion.img
                  src={winner.image}
                  alt={winner.prize}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-yellow-400/30"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                />
              )}
              
              <div className="flex-1 min-w-0">
                <motion.p
                  className="text-white font-bold text-base"
                  whileHover={{ color: '#fbbf24' }}
                >
                  {winner.name}
                </motion.p>
                <p className="text-white/70 text-sm mt-1">{winner.prize}</p>
                <motion.p
                  className="text-yellow-400 font-black text-lg mt-2"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {winner.value}
                </motion.p>
              </div>
              
              <motion.div
                className="text-2xl"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
              >
                🎉
              </motion.div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
