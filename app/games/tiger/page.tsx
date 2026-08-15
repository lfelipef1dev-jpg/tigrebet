'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { tigerAPI } from '../../lib/api';
import { sounds } from '../../lib/sounds';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import TigerSplashModal from '../../components/TigerSplashModal';

const SYMBOLS: Record<string, { color: string; name: string; value: number; img: string }> = {
  '🍊': { color: '#FF8C00', name: 'Laranja',  value: 3,   img: '/symbols/orange.svg'   },
  '🔔': { color: '#FFD700', name: 'Sino',     value: 5,   img: '/symbols/bell.svg'     },
  '🧧': { color: '#FF2222', name: 'Envelope', value: 10,  img: '/symbols/envelope.svg' },
  '💰': { color: '#FFD700', name: 'Ouro',     value: 20,  img: '/symbols/ingot.svg'    },
  '💎': { color: '#00E5FF', name: 'Diamante', value: 50,  img: '/symbols/diamond.svg'  },
  '🐯': { color: '#FF8C00', name: 'Tigre',    value: 100, img: '/tiger-icon.svg'       },
};

const WIN_LINES = [
  [[0,0],[1,0],[2,0]],
  [[0,1],[1,1],[2,1]],
  [[0,2],[1,2],[2,2]],
  [[0,0],[1,1],[2,2]],
  [[0,2],[1,1],[2,0]],
];

const BET_AMOUNTS = [1, 2, 5, 10, 20, 50, 100, 500];
const SPIN_CYCLE  = ['🍊', '💎', '🧧', '💰', '🔔', '🐯'];

function getWinCells(wl: number[]): Set<string> {
  const s = new Set<string>();
  for (const li of wl) for (const [c, r] of WIN_LINES[li]) s.add(`${c}-${r}`);
  return s;
}

// ── Ambient Particles ─────────────────────────────────────────────────────────
function AmbientCanvas({ spinning }: { spinning: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const spRef = useRef(spinning);
  spRef.current = spinning;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    type P = { x:number;y:number;vx:number;vy:number;sz:number;rot:number;rs:number;op:number;coin:boolean;hue:number };
    const ps: P[] = Array.from({ length: 32 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4, vy: 0.25 + Math.random() * 0.55,
      sz: 3 + Math.random() * 7, rot: Math.random() * Math.PI * 2, rs: (Math.random() - 0.5) * 0.04,
      op: 0.12 + Math.random() * 0.28, coin: Math.random() > 0.55, hue: 338 + Math.random() * 28,
    }));

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const sp = spRef.current;
      for (const p of ps) {
        ctx.save(); ctx.globalAlpha = sp ? p.op * 1.9 : p.op;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        if (p.coin) {
          ctx.fillStyle = '#f0c040'; ctx.beginPath(); ctx.arc(0,0,p.sz*0.55,0,Math.PI*2); ctx.fill();
          ctx.strokeStyle='#9a6e00'; ctx.lineWidth=1; ctx.stroke();
        } else {
          ctx.fillStyle = `hsl(${p.hue},72%,78%)`;
          ctx.beginPath(); ctx.ellipse(0,0,p.sz,p.sz*0.52,0,0,Math.PI*2); ctx.fill();
          ctx.strokeStyle=`hsl(${p.hue},55%,88%)`; ctx.lineWidth=0.5;
          ctx.beginPath(); ctx.moveTo(-p.sz*0.7,0); ctx.lineTo(p.sz*0.7,0); ctx.stroke();
        }
        ctx.restore();
        p.x += p.vx + (sp ? Math.sin(Date.now()/800 + p.y*0.01)*0.7 : 0);
        p.y += sp ? p.vy*1.8 : p.vy; p.rot += p.rs;
        if (p.y > canvas.height+20) { p.y=-20; p.x=Math.random()*canvas.width; }
        if (p.x < -20) p.x = canvas.width+20;
        if (p.x > canvas.width+20) p.x = -20;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0" />;
}

// ── Coin Rain ─────────────────────────────────────────────────────────────────
function CoinRain() {
  const items = Array.from({ length: 44 }, (_, i) => ({
    icon: ['🧧','🪙','💰','🪙','🧧','🪙'][i%6],
    x: 3+(i*2.2)%94, drift:(i%2===0?1:-1)*(16+(i%10)*17),
    dur:.75+(i%8)*.13, delay:i*.03, rot:(i%2===0?1:-1)*(200+(i%4)*90), sz:16+(i%4)*8,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {items.map((p,i)=>(
        <motion.span key={i} className="absolute select-none"
          style={{ left:`${p.x}%`, top:'40%', fontSize:p.sz }}
          initial={{ y:0,x:0,opacity:1,scale:.3,rotate:0 }}
          animate={{ y:[0,-(85+i*4),-(255+i*6)], x:[0,p.drift*.4,p.drift], opacity:[1,1,0], scale:[.3,1.35,.7], rotate:[0,p.rot*.5,p.rot] }}
          transition={{ duration:p.dur, delay:p.delay, ease:'easeOut' }}>
          {p.icon}
        </motion.span>
      ))}
    </div>
  );
}

// ── Tiger Mascot ──────────────────────────────────────────────────────────────
function TigerMascot({ spinning, win, tigerLuck }: { spinning:boolean; win:boolean; tigerLuck:boolean }) {
  return (
    <div className="relative flex items-center justify-center" style={{ height:182 }}>
      <motion.div className="absolute rounded-full"
        style={{ width:300,height:300, background:'radial-gradient(circle, rgba(255,80,0,0.07) 0%, transparent 62%)' }}
        animate={{ scale:[1,1.2,1], opacity:[0.4,0.9,0.4] }}
        transition={{ duration:3.5, repeat:Infinity }} />
      <AnimatePresence>
        {spinning && (
          <motion.div key="fire" className="absolute rounded-full"
            style={{ width:200,height:200, background:'radial-gradient(circle, rgba(255,120,0,0.22) 0%, transparent 58%)' }}
            initial={{ scale:.8,opacity:0 }} animate={{ scale:[.9,1.35,.9], opacity:[.3,.8,.3] }} exit={{ opacity:0 }}
            transition={{ duration:.45, repeat:Infinity }} />
        )}
      </AnimatePresence>
      {[164,130,96].map((sz,i)=>(
        <motion.div key={sz} className="absolute rounded-full"
          style={{ width:sz,height:sz, border:`${i===2?2:1}px solid rgba(255,215,0,${0.06+i*.05})` }}
          animate={{ rotate: i%2===0?[0,360]:[0,-360], borderColor: win?['rgba(255,215,0,.35)','rgba(255,80,0,.65)','rgba(255,215,0,.35)']:undefined }}
          transition={{ duration: win?.4 : 18+i*5, repeat:Infinity, ease:'linear' }} />
      ))}
      <motion.span className="absolute select-none opacity-40" style={{ left:-2, top:'50%', transform:'translateY(-50%)', fontSize:30 }}
        animate={{ y:[-4,4,-4] }} transition={{ duration:3, repeat:Infinity }}>🐲</motion.span>
      <motion.span className="absolute select-none opacity-40" style={{ right:-2, top:'50%', transform:'translateY(-50%) scaleX(-1)', fontSize:30 }}
        animate={{ y:[4,-4,4] }} transition={{ duration:3, repeat:Infinity, delay:1.5 }}>🐲</motion.span>
      <motion.span className="absolute select-none text-xl opacity-60" style={{ left:16, top:6 }}
        animate={{ y:[-2,2,-2], rotate:[-5,5,-5] }} transition={{ duration:2.5, repeat:Infinity }}>🏮</motion.span>
      <motion.span className="absolute select-none text-xl opacity-60" style={{ right:16, top:6 }}
        animate={{ y:[2,-2,2], rotate:[5,-5,5] }} transition={{ duration:2.5, repeat:Infinity, delay:1.2 }}>🏮</motion.span>

      <motion.img src="/tiger-icon.svg" alt="Fortune Tiger" className="relative z-10 select-none"
        style={{ width:122, height:122 }}
        animate={
          tigerLuck&&win ? { scale:[1,1.44,.88,1.38,1], filter:['drop-shadow(0 0 20px #FFD700)','drop-shadow(0 0 72px #FF4500)','drop-shadow(0 0 110px #FF0000)','drop-shadow(0 0 52px #FFD700)'] }
          : spinning   ? { scale:[1,1.12,.94,1.1,1], rotate:[-6,6,-6,6,0], filter:['drop-shadow(0 0 18px #FF8C00)','drop-shadow(0 0 44px #FF4500)','drop-shadow(0 0 18px #FF8C00)'] }
                       : { scale:[1,1.05,1], y:[0,-5,0], filter:['drop-shadow(0 0 14px rgba(255,180,0,.5))','drop-shadow(0 0 30px rgba(255,100,0,.7))','drop-shadow(0 0 14px rgba(255,180,0,.5))'] }
        }
        transition={
          tigerLuck&&win ? { duration:.55, repeat:5, ease:'easeInOut' }
          : spinning     ? { duration:.38, repeat:Infinity, ease:'easeInOut' }
                         : { duration:3.6, repeat:Infinity, ease:'easeInOut' }
        }
      />
      <AnimatePresence>
        {tigerLuck&&win && (
          <motion.div className="absolute -bottom-3 z-20 px-5 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap tracking-[.15em]"
            style={{ background:'linear-gradient(90deg,#b8860b,#FFD700,#FF4500,#FFD700,#b8860b)', color:'#0d0200', boxShadow:'0 0 24px rgba(255,80,0,.6)' }}
            initial={{ opacity:0,scale:.5,y:10 }} animate={{ opacity:1,scale:1,y:0 }} exit={{ opacity:0 }}>
            🐯 TIGER LUCK ×10!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Symbol Cell ───────────────────────────────────────────────────────────────
function Cell({ emoji,spinning,colIdx,rowIdx,isWin }:{ emoji:string;spinning:boolean;colIdx:number;rowIdx:number;isWin:boolean }) {
  const sym = SYMBOLS[emoji];
  const isTiger = emoji==='🐯';
  return (
    <motion.div className="relative flex items-center justify-center overflow-hidden"
      style={{
        height:74, borderRadius:15,
        background: isWin?`linear-gradient(145deg,rgba(180,80,0,.4),rgba(60,10,0,.92))`:'linear-gradient(145deg,#1e0300,#0e0100)',
        border: isWin?`2px solid ${sym?.color||'#FFD700'}`:'2px solid rgba(200,140,10,.2)',
        boxShadow: isWin?`0 0 22px ${sym?.color||'#FFD700'}55,inset 0 0 16px rgba(255,120,0,.1)`:'inset 0 0 14px rgba(0,0,0,.85)',
        transition:'background .2s,border-color .2s,box-shadow .2s',
      }}>
      <div className="absolute top-0 left-0 right-0 h-[38%] rounded-t-2xl pointer-events-none"
        style={{ background:'linear-gradient(180deg,rgba(255,255,255,.07),transparent)' }} />
      {sym&&<div className="absolute inset-0 pointer-events-none opacity-[.13]"
        style={{ background:`radial-gradient(circle at center,${sym.color},transparent 62%)` }} />}

      {spinning ? (
        <motion.img className="select-none" src={SYMBOLS[SPIN_CYCLE[(colIdx*3+rowIdx)%SPIN_CYCLE.length]].img} alt=""
          style={{ width:40, height:40, filter:'blur(2px)', opacity:.5 }}
          animate={{ y:[0,-16,0], scale:[1,.85,1] }}
          transition={{ repeat:Infinity, duration:.065+colIdx*.013, ease:'linear' }} />
      ):(
        <motion.div key={`${emoji}-${colIdx}-${rowIdx}`} className="relative z-10"
          initial={{ scale:.08,rotate:-18,opacity:0 }}
          animate={{ scale:isTiger?1.16:1, rotate:0, opacity:1 }}
          transition={{ type:'spring',stiffness:430,damping:22, delay:colIdx*.1+rowIdx*.05 }}>
          <motion.img src={sym?.img} alt={sym?.name} className="select-none"
            style={{ width:isTiger?46:46, height:isTiger?46:46, filter:`drop-shadow(0 0 9px ${sym?.color||'#fff'}) drop-shadow(0 2px 4px rgba(0,0,0,.8))` }}
            animate={isWin?{ filter:[`drop-shadow(0 0 9px ${sym?.color||'#fff'})`,`drop-shadow(0 0 26px ${sym?.color||'#FFD700'})`,`drop-shadow(0 0 9px ${sym?.color||'#fff'})`], scale:[1,1.1,1] }:{}}
            transition={{ duration:.5, repeat:Infinity }} />
        </motion.div>
      )}

      {isWin&&!spinning&&[0,1,2,3].map(i=>(
        <motion.div key={i} className="absolute w-[5px] h-[5px] rounded-full"
          style={{ background:sym?.color||'#FFD700', top:`${i<2?13:77}%`, left:`${i%2===0?10:80}%`, boxShadow:`0 0 5px ${sym?.color}` }}
          animate={{ opacity:[0,1,0], scale:[0,1.8,0] }}
          transition={{ duration:.7, repeat:Infinity, delay:i*.18 }} />
      ))}
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TigerPage() {
  const { game, setBalance } = useStore();
  const [betAmount, setBetAmount] = useState(1);
  const [soundOn, setSoundOn]     = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState<string[][]>([['🍊','🐯','💰'],['🧧','💎','🔔'],['💰','🍊','🐯']]);
  const [lastWin, setLastWin]     = useState(0);
  const [isTigerLuck, setIsTigerLuck] = useState(false);
  const [winLines, setWinLines]   = useState<number[]>([]);
  const [history, setHistory]     = useState<{win:number}[]>([]);
  const [winKey, setWinKey]       = useState(0);
  const [autoSpin, setAutoSpin]   = useState(false);
  const [featureSymbol, setFeatureSymbol] = useState<string | null>(null);

  const spin = useCallback(async () => {
    if (isSpinning) return;
    if (game.balance[game.selectedCoin] < betAmount) { toast.error('Saldo insuficiente'); return; }
    setIsSpinning(true); setLastWin(0); setIsTigerLuck(false); setWinLines([]); setFeatureSymbol(null);
    sounds.spin();
    try {
      const res = await tigerAPI.playTiger({ coin:game.selectedCoin, amount:betAmount });
      if (res.data.code===200) {
        const r = res.data.data;
        await new Promise(resolve=>setTimeout(resolve,1500));
        setReels(r.reels); setLastWin(r.win); setIsTigerLuck(r.isTigerLuck); setWinLines(r.winLines||[]); setFeatureSymbol(r.featureSymbol || null);
        setBalance(game.selectedCoin, r.balance);
        setHistory(prev=>[{win:r.win},...prev.slice(0,9)]);
        if (r.win>0) {
          setWinKey(k=>k+1);
          r.isTigerLuck ? sounds.tigerLuck() : sounds.win();
          confetti({ particleCount:290, spread:115, origin:{y:.45}, colors:['#FFD700','#FFA500','#FF4500','#FF0000','#fff'] });
          toast.success(`🐯 +R$ ${r.win.toFixed(2)}`, { duration:5000 });
        } else { sounds.loss(); }
        if (r.jackpotWin>0) { sounds.bigWin(); toast.success(`🏆 JACKPOT! +R$ ${r.jackpotWin.toFixed(2)}`,{duration:8000}); }
      } else { toast.error(res.data.msg||'Erro'); }
    } catch(err:unknown) {
      const e = err as {response?:{data?:{msg?:string}};message?:string};
      toast.error(e?.response?.data?.msg||e?.message||'Erro de conexão');
    } finally { setIsSpinning(false); }
  }, [isSpinning,betAmount,game.selectedCoin,game.balance,setBalance]);

  useEffect(() => {
    if (autoSpin && !isSpinning) {
      setAutoSpin(false);
      spin();
    }
  }, [autoSpin, isSpinning, spin]);

  const winCells = getWinCells(winLines);
  const showWin  = lastWin>0 && !isSpinning;

  return (
    <div className="min-h-screen text-white font-sans select-none"
      style={{ background:'linear-gradient(175deg,#180202 0%,#3d0505 22%,#5c0808 48%,#3d0505 75%,#180202 100%)' }}>

      <AmbientCanvas spinning={isSpinning} />

      {/* Atmospheric layers */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ background:'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,80,0,.055) 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-2/5" style={{ background:'linear-gradient(0deg,rgba(160,25,0,.12),transparent)' }} />
        {/* Bamboo silhouettes */}
        {[4,12,22].map(left=>(
          <div key={left} className="absolute top-0 bottom-0 opacity-[.05]"
            style={{ left, width:5, background:'linear-gradient(90deg,#2d6a1e,#4a9632,#2d6a1e)', borderRadius:3 }}>
            {[0,1,2,3,4,5,6,7].map(j=>(
              <div key={j} style={{ position:'absolute', top:`${j*12.5}%`, left:-3, right:-3, height:2, background:'#1e4a12', borderRadius:2 }} />
            ))}
          </div>
        ))}
        {[4,12,22].map(right=>(
          <div key={right} className="absolute top-0 bottom-0 opacity-[.05]"
            style={{ right, width:5, background:'linear-gradient(90deg,#2d6a1e,#4a9632,#2d6a1e)', borderRadius:3 }}>
            {[0,1,2,3,4,5,6,7].map(j=>(
              <div key={j} style={{ position:'absolute', top:`${j*12.5}%`, left:-3, right:-3, height:2, background:'#1e4a12', borderRadius:2 }} />
            ))}
          </div>
        ))}
        <div className="absolute top-0 left-0 right-0 h-28" style={{ background:'linear-gradient(180deg,rgba(0,0,0,.55),transparent)' }} />
      </div>

      <TigerSplashModal onPlay={() => setAutoSpin(true)} />

      <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl px-4 py-3.5"
          style={{ background:'rgba(8,2,0,.78)', borderBottom:'1px solid rgba(200,140,10,.18)' }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/" className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-75 text-base"
                style={{ background:'rgba(255,140,0,.1)', border:'1px solid rgba(255,140,0,.2)' }}>🔙</Link>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight"
                  style={{ background:'linear-gradient(90deg,#FF8C00,#FFD700,#FF4500)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  Fortune Tiger
                </h1>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color:'rgba(200,140,10,.55)' }}>O Tigrinho Original</p>
              </div>
            </div>
            <div className="rounded-2xl px-4 py-2 text-right" style={{ background:'rgba(255,140,0,.08)', border:'1px solid rgba(255,140,0,.14)' }}>
              <span className="text-[9px] font-black uppercase tracking-widest block" style={{ color:'rgba(200,140,10,.55)' }}>Saldo Disponível</span>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-yellow-400 text-xs">💰</span>
                <span className="text-sm font-black font-mono text-yellow-400">
                  R$ {(Number(game.balance[game.selectedCoin])||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-3 pb-36">
          <TigerMascot spinning={isSpinning} win={showWin} tigerLuck={isTigerLuck} />

          {/* Slot Machine */}
          <div className="relative mb-4">
            {showWin && <CoinRain key={winKey} />}

            {/* Gradient border wrapper */}
            <div className="relative rounded-[34px] p-[3px]"
              style={{ background:'linear-gradient(180deg,#c8a80e 0%,#6b4800 45%,#c8a80e 100%)', boxShadow:'0 0 55px rgba(180,130,10,.17),0 0 100px rgba(0,0,0,.55)' }}>
              <div className="relative rounded-[32px] overflow-hidden"
                style={{ background:'linear-gradient(160deg,#6b0a0a 0%,#2d0000 45%,#160000 100%)', padding:'22px 16px 28px' }}>

                {/* Inner gold inset */}
                <div className="absolute inset-2 rounded-[26px] pointer-events-none"
                  style={{ border:'1px solid rgba(200,168,14,.1)' }} />

                {/* Corners */}
                <span className="absolute top-2.5 left-2.5 text-xl opacity-30 select-none">🐲</span>
                <span className="absolute top-2.5 right-2.5 text-xl opacity-30 select-none" style={{ transform:'scaleX(-1)' }}>🐲</span>
                <span className="absolute bottom-6 left-3 text-base opacity-20 select-none">🌸</span>
                <span className="absolute bottom-6 right-3 text-base opacity-20 select-none">🌸</span>

                {/* Top badge */}
                <div className="absolute -top-[15px] left-1/2 -translate-x-1/2 z-20 px-8 py-1.5 rounded-full text-[11px] font-black tracking-[.22em] uppercase whitespace-nowrap"
                  style={{ background:'linear-gradient(90deg,#7a4e00,#FFD700,#c8a00e,#FFD700,#7a4e00)', color:'#0d0200', boxShadow:'0 0 18px rgba(255,200,0,.35)' }}>
                  ✦ FORTUNE TIGER ✦
                </div>

                {/* Win line dots */}
                <div className="flex gap-1.5 mb-3 mt-1">
                  {[0,1,2,3,4].map(i=>(
                    <motion.div key={i} className="h-[3px] flex-1 rounded-full"
                      animate={{ backgroundColor: winLines.includes(i)&&!isSpinning?'#FFD700':'rgba(200,168,14,.09)', boxShadow: winLines.includes(i)&&!isSpinning?'0 0 8px #FFD700':'none' }} />
                  ))}
                </div>

                {/* 3×3 grid */}
                <div className="flex gap-2">
                  {reels.map((reel,ci)=>(
                    <div key={ci} className="flex-1 flex flex-col gap-2">
                      {reel.map((em,ri)=>(
                        <Cell key={`${ci}-${ri}`} emoji={em} spinning={isSpinning} colIdx={ci} rowIdx={ri}
                          isWin={!isSpinning&&winCells.has(`${ci}-${ri}`)} />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Center payline */}
                <div className="absolute left-5 right-5 pointer-events-none" style={{ top:'calc(50% + 8px)', height:2 }}>
                  <motion.div className="w-full h-full rounded-full"
                    animate={{ backgroundColor: winLines.includes(1)&&!isSpinning?'#FFD700':'rgba(255,200,0,.1)', boxShadow: winLines.includes(1)&&!isSpinning?'0 0 10px #FFD700':'none' }} />
                </div>

                {/* Bottom badge */}
                <div className="absolute -bottom-[15px] left-1/2 -translate-x-1/2 z-20 px-8 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap"
                  style={{ background:'linear-gradient(90deg,#7a4e00,#FFD700,#c8a00e,#FFD700,#7a4e00)', color:'#0d0200', boxShadow:'0 0 18px rgba(255,200,0,.35)' }}>
                  ★ 5 LINHAS DE PAGAMENTO ★
                </div>
              </div>
            </div>
          </div>

          {/* Win display */}
          <AnimatePresence>
            {showWin && (
              <motion.div className="relative overflow-hidden rounded-3xl py-6 px-6 mb-4 text-center"
                style={{ background:'linear-gradient(135deg,#7c1500,#3a0800,#7c1500)', border:'2px solid rgba(255,215,0,.55)', boxShadow:'0 0 60px rgba(255,80,0,.2)' }}
                initial={{ opacity:0,scale:.4,y:40 }} animate={{ opacity:1,scale:1,y:0 }} exit={{ opacity:0,scale:.8 }}
                transition={{ type:'spring',stiffness:300,damping:18 }}>
                <motion.div className="absolute inset-0 opacity-[.18] pointer-events-none"
                  animate={{ backgroundPosition:['0% 0%','100% 100%','0% 0%'] }}
                  transition={{ duration:2.5, repeat:Infinity }}
                  style={{ background:'radial-gradient(circle at 30% 50%,rgba(255,215,0,.7),transparent 55%)' }} />
                <div className="relative z-10">
                  <div className="text-[10px] font-black uppercase tracking-[.3em] mb-2" style={{ color:'rgba(255,215,0,.8)' }}>
                    {featureSymbol ? `🎴 CARTINHA ${featureSymbol} ×10!` : isTigerLuck ? '🐯 TIGER LUCK ×10!' : '⚡ VITÓRIA!'}
                  </div>
                  <motion.div className="text-5xl font-black"
                    animate={{ scale:[1,1.06,1] }} transition={{ duration:.8, repeat:Infinity }}
                    style={{ background:'linear-gradient(135deg,#FFD700,#FF8C00)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                    +R$ {lastWin.toFixed(2)}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bet panel */}
          <div className="rounded-[32px] p-5 mb-4"
            style={{ background:'rgba(12,4,0,.88)', border:'1px solid rgba(200,140,10,.16)', boxShadow:'inset 0 0 30px rgba(0,0,0,.5)' }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.25em] mb-1" style={{ color:'rgba(200,140,10,.55)' }}>Aposta</div>
                <div className="text-2xl font-black font-mono text-yellow-400">R$ {betAmount.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-3">
                <motion.button whileTap={{ scale:.9 }} onClick={()=>{const on=sounds.toggle();setSoundOn(on);}}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all text-lg"
                  style={{ background:soundOn?'rgba(255,200,0,.1)':'rgba(255,255,255,.04)', borderColor:soundOn?'rgba(255,200,0,.28)':'rgba(255,255,255,.08)', color:soundOn?'#FFD700':'#6b7280' }}>
                  {soundOn?'🔊':'🔇'}
                </motion.button>
                <div className="text-right">
                  <div className="text-[9px] font-black uppercase tracking-[.25em] mb-1" style={{ color:'rgba(200,140,10,.55)' }}>Status</div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <motion.div className={`w-2 h-2 rounded-full ${isSpinning?'bg-yellow-400':'bg-green-400'}`}
                      animate={isSpinning?{scale:[1,1.7,1]}:{scale:1}} transition={{ repeat:Infinity, duration:.45 }} />
                    <span className="text-xs font-black">{isSpinning?'Girando...':'Pronto'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {BET_AMOUNTS.map(amt=>(
                <motion.button key={amt} whileTap={{ scale:.86 }} onClick={()=>setBetAmount(amt)}
                  className="py-4 rounded-2xl font-black text-sm transition-all border"
                  style={{
                    background: betAmount===amt?'#FFD700':'rgba(255,255,255,.04)',
                    borderColor: betAmount===amt?'#ffc107':'transparent',
                    color: betAmount===amt?'#0d0200':'rgba(180,140,60,.65)',
                    boxShadow: betAmount===amt?'0 0 16px rgba(255,200,0,.4)':'none',
                  }}>
                  {amt}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Pay table */}
          <div className="rounded-[24px] p-5" style={{ background:'rgba(70,10,0,.3)', border:'1px solid rgba(180,100,10,.18)' }}>
            <div className="text-[9px] font-black uppercase tracking-[.25em] text-center mb-4" style={{ color:'rgba(200,140,10,.55)' }}>
              ✦ Tabela de Pagamento ✦
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {Object.entries(SYMBOLS).map(([emoji,s])=>(
                <div key={emoji} className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background:`${s.color}0d`, border:`1px solid ${s.color}1f` }}>
                  <img src={s.img} alt={s.name} className="w-7 h-7" />
                  <div>
                    <div className="text-[9px] font-bold" style={{ color:'rgba(180,140,100,.65)' }}>{s.name}</div>
                    <div className="font-black text-xs" style={{ color:s.color }}>×{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length>0&&(
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1" style={{ background:'rgba(200,140,10,.12)' }} />
                <span className="text-[10px] font-black uppercase tracking-[.2em]" style={{ color:'rgba(200,140,10,.38)' }}>Histórico</span>
                <div className="h-px flex-1" style={{ background:'rgba(200,140,10,.12)' }} />
              </div>
              <div className="grid grid-cols-5 gap-2">
                {history.map((h,i)=>(
                  <div key={i} className="rounded-xl p-2 text-center font-black text-xs border"
                    style={{ background:h.win>0?'rgba(255,140,0,.14)':'rgba(255,255,255,.04)', borderColor:h.win>0?'rgba(255,140,0,.28)':'rgba(255,255,255,.05)', color:h.win>0?'#FF8C00':'#4b5563' }}>
                    {h.win>0?`+${h.win.toFixed(0)}`:'✕'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Fixed action bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4"
          style={{ background:'linear-gradient(0deg,rgba(8,2,0,.97) 60%,transparent)' }}>
          <div className="max-w-lg mx-auto flex flex-col gap-3">
            <div className="flex justify-between items-center px-5 py-2 rounded-full backdrop-blur-sm"
              style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(200,140,10,.1)' }}>
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color:'rgba(180,120,20,.45)' }}>Resultado Anterior</span>
              <span className="text-sm font-black" style={{ color:showWin?'#4ade80':'rgba(100,80,40,.65)' }}>
                {showWin?`VITÓRIA +R$${lastWin.toFixed(2)}`:'———'}
              </span>
            </div>
            <motion.button
              whileTap={!isSpinning?{scale:.96}:{}}
              onClick={spin} disabled={isSpinning}
              className="w-full py-5 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all"
              style={{
                background: isSpinning?'rgba(40,20,0,.8)':'linear-gradient(135deg,#c87500,#FFD700,#FF8C00)',
                color: isSpinning?'rgba(180,130,40,.45)':'#0d0200',
                boxShadow: isSpinning?'none':'0 8px 32px rgba(255,140,0,.38)',
                cursor: isSpinning?'not-allowed':'pointer',
              }}>
              <img src="/tiger-icon.svg" alt="" style={{ width:28,height:28, opacity:isSpinning?.4:1, filter:'drop-shadow(0 0 4px #FF4500)' }} />
              {isSpinning?'🐯 GIRANDO...':'⚡ GIRAR'}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
