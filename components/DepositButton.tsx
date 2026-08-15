'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, ArrowUp, X } from 'lucide-react'

interface DepositButtonProps {
  onDeposit: (amount: number) => void
}

export default function DepositButton({ onDeposit }: DepositButtonProps) {
  const [showOptions, setShowOptions] = useState(false)

  const depositOptions = [
    { amount: 10, label: 'R$ 10,00', color: 'from-green-400 to-green-600' },
    { amount: 50, label: 'R$ 50,00', color: 'from-blue-400 to-blue-600' },
    { amount: 100, label: 'R$ 100,00', color: 'from-purple-400 to-purple-600' },
    { amount: 500, label: 'R$ 500,00', color: 'from-pink-400 to-pink-600' },
  ]

  return (
    <div className="flex flex-col items-center gap-4">
      <AnimatePresence mode="wait">
        {!showOptions ? (
          <motion.button
            key="deposit-main"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setShowOptions(true)}
            className="px-10 py-4 bg-white text-red-800 font-black text-xl rounded-full shadow-2xl hover:shadow-white/50 transition-all flex items-center gap-3 relative overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-red-200 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <CreditCard className="w-6 h-6" />
            </motion.span>
            Depositar
          </motion.button>
        ) : (
          <motion.div
            key="deposit-options"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex flex-col gap-3 w-full max-w-sm"
          >
            {depositOptions.map((option, index) => (
              <motion.button
                key={option.amount}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  onDeposit(option.amount)
                  setShowOptions(false)
                }}
                className={`px-8 py-4 bg-gradient-to-r ${option.color} text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 relative overflow-hidden`}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                <ArrowUp className="w-5 h-5" />
                {option.label}
              </motion.button>
            ))}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => setShowOptions(false)}
              className="px-6 py-3 text-white/70 hover:text-white transition-colors text-base font-semibold flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <X className="w-4 h-4" />
              Cancelar
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
