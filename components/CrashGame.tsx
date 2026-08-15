'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Play, X, Coins } from 'lucide-react'
import confetti from 'canvas-confetti'

interface CrashGameProps {
  balance: number
  onWin: (amount: number) => void
  onPlay: (cost: number) => void
}

const MIN_BET = 5
const MAX_MULTIPLIER = 100

export default function CrashGame({ balance, onWin, onPlay }: CrashGameProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [multiplier, setMultiplier] = useState(1.00)
  const [betAmount, setBetAmount] = useState(MIN_BET)
  const [hasBet, setHasBet] = useState(false)
  const [crashed, setCrashed] = useState(false)
  const [winAmount, setWinAmount] = useState(0)
  const [history, setHistory] = useState<number[]>([])
  const animationRef = useRef<number>()
  const crashPointRef = useRef<number>(1)

  const triggerConfetti = () => {
    const duration = 2000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) return clearInterval(interval)

      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)
  }

  const generateCrashPoint = () => {
    // Algoritmo similar ao Aviator - RTP de 97%
    const rand = Math.random()
    
    // 3% de chance de crashar instantaneamente (1.00x)
    if (rand < 0.03) return 1.00
    
    // Distribuição exponencial para multiplicadores mais altos
    // 50% chance de crashar entre 1.00x e 2.00x
    if (rand < 0.53) return 1 + Math.random()
    
    // 30% chance de crashar entre 2.00x e 5.00x
    if (rand < 0.83) return 2 + Math.random() * 3
    
    // 15% chance de crashar entre 5.00x e 20.00x
    if (rand < 0.98) return 5 + Math.random() * 15
    
    // 2% chance de multiplicadores altos (20x+)
    return 20 + Math.random() * 80
  }

  const startGame = () => {
    if (balance < betAmount) {
      alert('Saldo insuficiente!')
      return
    }
    
    onPlay(betAmount)
    setIsPlaying(true)
    setHasBet(true)
    setCrashed(false)
    setMultiplier(1.00)
    setWinAmount(0)
    
    crashPointRef.current = generateCrashPoint()
    
    const startTime = Date.now()
    const duration = Math.min(crashPointRef.current * 1000, 10000) // Max 10 segundos
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / duration
      
      if (progress >= 1) {
        crash()
        return
      }
      
      // Curva de crescimento exponencial
      const newMultiplier = 1 + (crashPointRef.current - 1) * progress
      setMultiplier(newMultiplier)
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }

  const cashOut = () => {
    if (!isPlaying || !hasBet || crashed) return
    
    cancelAnimationFrame(animationRef.current!)
    setIsPlaying(false)
    
    const win = betAmount * multiplier
    setWinAmount(win)
    onWin(win)
    triggerConfetti()
    
    setHistory(prev => [multiplier, ...prev].slice(0, 10))
  }

  const crash = () => {
    cancelAnimationFrame(animationRef.current!)
    setIsPlaying(false)
    setCrashed(true)
    setMultiplier(crashPointRef.current)
    
    setHistory(prev => [crashPointRef.current, ...prev].slice(0, 10))
    
    setTimeout(() => {
      setHasBet(false)
      setCrashed(false)
      setMultiplier(1.00)
    }, 3000)
  }

  const placeBet = () => {
    if (balance < betAmount) {
      alert('Saldo insuficiente!')
      return
    }
    setHasBet(true)
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Histórico */}
      <div className="flex gap-2 flex-wrap justify-center">
        {history.map((mult, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`px-3 py-1 rounded-full text-sm font-bold ${
              mult >= 2 ? 'bg-green-500 text-white' : 
              mult >= 1.5 ? 'bg-yellow-500 text-white' : 
              'bg-red-500 text-white'
            }`}
          >
            {mult.toFixed(2)}x
          </motion.div>
        ))}
      </div>

      {/* Área do Jogo */}
      <div className="relative w-full max-w-2xl aspect-video bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden border-4 border-gray-700">
        {/* Background animado */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            backgroundSize: '200% 200%',
          }}
        />

        {/* Multiplicador */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            key={multiplier}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <motion.p
              className={`text-7xl font-black ${
                crashed ? 'text-red-500' : 'text-green-400'
              }`}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: isPlaying && !crashed ? Infinity : 0,
              }}
            >
              {crashed ? 'CRASHED' : `${multiplier.toFixed(2)}x`}
            </motion.p>
            {winAmount > 0 && (
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl text-yellow-400 font-bold mt-4"
              >
                Ganhou R$ {winAmount.toFixed(2)}!
              </motion.p>
            )}
          </motion.div>
        </div>

        {/* Gráfico do multiplicador */}
        {isPlaying && !crashed && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-blue-500"
            initial={{ width: '0%' }}
            animate={{ width: `${(multiplier / MAX_MULTIPLIER) * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        )}
      </div>

      {/* Controles */}
      <div className="w-full max-w-2xl bg-gray-800 rounded-2xl p-6">
        <div className="flex gap-4 items-center justify-between">
          {/* Valor da aposta */}
          <div className="flex-1">
            <label className="text-white text-sm mb-2 block">Valor da Aposta</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBetAmount(Math.max(MIN_BET, betAmount - 5))}
                className="w-10 h-10 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(MIN_BET, Number(e.target.value)))}
                className="flex-1 bg-gray-700 text-white text-center rounded-lg px-4 py-2"
                disabled={isPlaying}
              />
              <button
                onClick={() => setBetAmount(betAmount + 5)}
                className="w-10 h-10 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2">
            {!isPlaying && !hasBet && (
              <motion.button
                onClick={startGame}
                disabled={balance < betAmount}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-xl rounded-xl hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-6 h-6" />
                Apostar
              </motion.button>
            )}

            {isPlaying && hasBet && !crashed && (
              <motion.button
                onClick={cashOut}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-xl rounded-xl hover:shadow-lg hover:shadow-yellow-500/50 transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Coins className="w-6 h-6" />
                Retirar ({(betAmount * multiplier).toFixed(2)})
              </motion.button>
            )}

            {crashed && (
              <motion.button
                onClick={startGame}
                disabled={balance < betAmount}
                className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-xl rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <TrendingUp className="w-6 h-6" />
                Tentar Novamente
              </motion.button>
            )}
          </div>
        </div>

        {/* Informações */}
        <div className="mt-4 text-center text-gray-400 text-sm">
          <p>RTP: 97% | Multiplicador máximo: {MAX_MULTIPLIER}x</p>
          <p className="mt-1">Retire antes do crash para ganhar!</p>
        </div>
      </div>
    </div>
  )
}
