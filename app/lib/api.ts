import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Demo mode: quando o backend nao esta disponivel (ex: deploy estatico no portfolio)
const isDemo = typeof window !== 'undefined' && (window.location.hostname.includes('expostacker.com.br') || window.location.hostname.includes('pages.dev'));

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('cp_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('cp_token');
      localStorage.removeItem('cp_UID');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ===== MOCK HELPERS (DEMO) =====
const SYMBOLS = ['🍊', '🔔', '🧧', '💰', '💎', '🐯'];
const WEIGHTS = [22, 18, 14, 10, 6, 2]; // tigre e diamante sao mais raros

function randomReels() {
  const reels: string[][] = [];
  for (let c = 0; c < 3; c++) {
    const col: string[] = [];
    for (let r = 0; r < 3; r++) {
      const total = WEIGHTS.reduce((a, b) => a + b, 0);
      let pick = Math.floor(Math.random() * total);
      for (let i = 0; i < SYMBOLS.length; i++) {
        pick -= WEIGHTS[i];
        if (pick < 0) { col.push(SYMBOLS[i]); break; }
      }
    }
    reels.push(col);
  }
  return reels;
}

function calcWin(reels: string[][], amount: number) {
  const lines = [
    [[0,0],[1,0],[2,0]],
    [[0,1],[1,1],[2,1]],
    [[0,2],[1,2],[2,2]],
    [[0,0],[1,1],[2,2]],
    [[0,2],[1,1],[2,0]],
  ];
  const values: Record<string, number> = { '🍊': 3, '🔔': 5, '🧧': 10, '💰': 20, '💎': 50, '🐯': 100 };
  let win = 0;
  const winLines: number[] = [];
  let isTigerLuck = false;
  let featureSymbol: string | null = null;

  lines.forEach((line, li) => {
    const [a, b, c] = line.map(([col, row]) => reels[col][row]);
    if (a === b && b === c) {
      win += amount * (values[a] || 1);
      winLines.push(li);
      if (a === '🐯') { isTigerLuck = true; featureSymbol = '🐯'; }
    }
  });
  // tres tigres em qualquer posicao = tiger luck x10
  const tigers = reels.flat().filter(s => s === '🐯').length;
  if (tigers >= 3) { isTigerLuck = true; featureSymbol = '🐯'; win *= 10; }

  return { reels, win, winLines, isTigerLuck, featureSymbol, jackpotWin: 0 };
}

// ===== AUTH =====
export const authAPI = {
  register: (data: Record<string, unknown>) => api.post('/register', data),
  login: (data: Record<string, unknown>) => api.post('/login', data),
  registerCheck: (data: Record<string, unknown>) => api.post('/register_check', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.post('/auth/change-password', data),
};

// ===== WINGO =====
export const wingoAPI = {
  getCommonData: () => api.get('/wingo/common_data'),
  gameFetch: (data: Record<string, unknown>) => api.post('/wingo/game_fetch', data),
  wingoBet: (data: Record<string, unknown>) => api.post('/wingo/bet', data),
  betOrders: (data: Record<string, unknown>) => api.post('/wingo/bet_orders', data),
  trend: (coin: string) => api.get('/wingo/trend', { params: { coin } }),
  balance: (coin: string) => api.get('/wingo/balance', { params: { coin } }),
};

// ===== SLOTS =====
export const slotsAPI = {
  playSlots: (data: Record<string, unknown>) => isDemo
    ? Promise.resolve({ data: { code: 200, data: { reels: randomReels(), win: 0, winLines: [], isTigerLuck: false, featureSymbol: null, balance: 1000 } } })
    : api.post('/slots/play', data),
};

// ===== TIGER =====
export const tigerAPI = {
  playTiger: (data: Record<string, unknown>) => {
    if (!isDemo) return api.post('/tiger/play', data);
    const { amount } = data as { amount: number };
    const result = calcWin(randomReels(), amount as number);
    const balance = parseFloat(localStorage.getItem('demo_balance') || '10000') - (amount as number) + result.win;
    localStorage.setItem('demo_balance', String(balance));
    return Promise.resolve({
      data: {
        code: 200,
        data: { ...result, balance }
      }
    });
  },
};

// ===== CRASH =====
export const crashAPI = {
  playCrash: (data: Record<string, unknown>) => {
    if (!isDemo) return api.post('/crash/play', data);
    const { amount, autoCashout } = data as { amount: number; autoCashout: number };
    const crashPoint = +(1.01 + Math.random() * 4.99).toFixed(2);
    const win = crashPoint >= autoCashout ? amount * autoCashout : 0;
    const balance = 10000 - amount + win;
    return Promise.resolve({ data: { code: 200, data: { crashPoint, win, balance, autoCashout } } });
  },
};

// ===== PLINKO =====
export const plinkoAPI = {
  playPlinko: (data: Record<string, unknown>) => isDemo
    ? Promise.resolve({ data: { code: 200, data: { path: Array.from({length: 12}, () => Math.random() > 0.5 ? 'left' : 'right'), multiplier: +(0.2 + Math.random() * 9.8).toFixed(2), balance: 10000 } } })
    : api.post('/plinko/play', data),
};

// ===== DOUBLE =====
export const doubleAPI = {
  status: () => isDemo
    ? Promise.resolve({ data: { code: 200, data: { currentColor: ['red','black','white'][Math.floor(Math.random()*3)], period: 'DEMO001' } } })
    : api.get('/double/status'),
  placeBet: (data: { color: string; amount: number; coin: string }) => isDemo
    ? Promise.resolve({ data: { code: 200, data: { resultColor: ['red','black','white'][Math.floor(Math.random()*3)], win: Math.random() > 0.5 ? data.amount * 2 : 0, balance: 10000 } } })
    : api.post('/double/bet', data),
};

// ===== MINESWEEPER =====
export const minesweeperAPI = {
  createOrder: (data: Record<string, unknown>) => isDemo
    ? Promise.resolve({ data: { code: 200, data: { orderId: 'demo-' + Math.random().toString(36).slice(2), grid: Array.from({length: 25}, () => Math.random() > 0.8 ? 'mine' : 'gem') } } })
    : api.post('/minesweeper/order', data),
  revealCell: (data: Record<string, unknown>) => isDemo
    ? Promise.resolve({ data: { code: 200, data: { value: Math.random() > 0.8 ? 'mine' : 'gem', multiplier: +(1 + Math.random() * 4).toFixed(2) } } })
    : api.post('/minesweeper/reveal', data),
  getReward: (data: Record<string, unknown>) => isDemo
    ? Promise.resolve({ data: { code: 200, data: { reward: +(data.amount as number * (1 + Math.random())).toFixed(2), balance: 10000 } } })
    : api.post('/minesweeper/reward', data),
};

// ===== SCRATCH (RASPADINHA) =====
export const scratchAPI = {
  play: (data: Record<string, unknown>) => isDemo
    ? Promise.resolve({ data: { code: 200, data: { result: Array.from({length: 9}, () => ['🍊','🔔','🧧','💰','💎','🐯'][Math.floor(Math.random()*6)]), win: Math.random() > 0.6 ? (data.amount as number) * 2 : 0, balance: 10000 } } })
    : api.post('/scratch/play', data),
};

// ===== ENVELOPES =====
export const envelopeAPI = {
  getInfo: () => isDemo
    ? Promise.resolve({ data: { code: 200, data: { list: [{ amount: 5 }, { amount: 10 }, { amount: 25 }] } } })
    : api.get('/redenvelope/info'),
  getList: () => isDemo
    ? Promise.resolve({ data: { code: 200, data: { list: [{ id: 1, amount: 5 }, { id: 2, amount: 10 }] } } })
    : api.get('/redenvelope/list'),
  orderEnvelope: (data: Record<string, unknown>) => isDemo
    ? Promise.resolve({ data: { code: 200, data: { win: +(Math.random() * 50).toFixed(2), balance: 10000 } } })
    : api.post('/redenvelope/order', data),
};

// ===== VIP =====
export const vipAPI = {
  getPrivilege: (level?: number) => isDemo
    ? Promise.resolve({ data: { code: 200, data: { level: level || 1, privileges: ['cashback'] } } })
    : api.get('/vip/privilege', { params: { level } }),
  getLevelInfo: () => isDemo
    ? Promise.resolve({ data: { code: 200, data: { level: 1, points: 0, name: 'Bronze' } } })
    : api.get('/vip/level_info'),
  getVipInfo: () => isDemo
    ? Promise.resolve({ data: { code: 200, data: { level: 1, cashback: 1 } } })
    : api.get('/vip/info'),
  upgradeLevel: () => isDemo
    ? Promise.resolve({ data: { code: 200, data: { level: 2 } } })
    : api.post('/vip/upgrade', {}),
  claimWeekly: () => isDemo
    ? Promise.resolve({ data: { code: 200, data: { amount: 10 } } })
    : api.post('/vip/claim_weekly', {}),
  claimMonthly: () => isDemo
    ? Promise.resolve({ data: { code: 200, data: { amount: 30 } } })
    : api.post('/vip/claim_monthly', {}),
};

// ===== COMMISSION =====
export const commissionAPI = {
  getCommission: () => isDemo
    ? Promise.resolve({ data: { code: 200, data: { total: 0, today: 0 } } })
    : api.get('/commission'),
};

// ===== REFERRAL =====
export const referralAPI = {
  getReferralInfo: () => isDemo
    ? Promise.resolve({ data: { code: 200, data: { code: 'DEMO123', count: 0 } } })
    : api.get('/referral'),
};

// ===== PAYMENT =====
export const paymentAPI = {
  createDeposit: (data: Record<string, unknown>) => isDemo
    ? Promise.resolve({ data: { code: 200, data: { txId: 'demo-deposit-' + Math.random().toString(36).slice(2) } } })
    : api.post('/payment/deposit', data),
  checkDepositStatus: (txId: string) => isDemo
    ? Promise.resolve({ data: { code: 200, data: { status: txId.includes('demo') ? 'approved' : 'pending' } } })
    : api.get(`/payment/deposit/${txId}/status`),
  withdraw: (data: Record<string, unknown>) => isDemo
    ? Promise.resolve({ data: { code: 200, data: { status: 'demo' } } })
    : api.post('/payment/withdraw', data),
  history: (params?: Record<string, unknown>) => isDemo
    ? Promise.resolve({ data: { code: 200, data: { list: [] } } })
    : api.get('/payment/history', { params }),
};

// ===== KYC =====
export const kycAPI = {
  submit: (data: Record<string, unknown>) => isDemo
    ? Promise.resolve({ data: { code: 200, data: { status: 'submitted' } } })
    : api.post('/kyc/submit', data),
  status: () => isDemo
    ? Promise.resolve({ data: { code: 200, data: { status: 'not_required' } } })
    : api.get('/kyc/status'),
};

// ===== MISSIONS =====
export const missionAPI = {
  daily: () => isDemo
    ? Promise.resolve({ data: { code: 200, data: { missions: [] } } })
    : api.get('/missions/daily'),
  claim: (missionId: string) => isDemo
    ? Promise.resolve({ data: { code: 200, data: { reward: 5 } } })
    : api.post(`/missions/${missionId}/claim`, {}),
  history: () => isDemo
    ? Promise.resolve({ data: { code: 200, data: { list: [] } } })
    : api.get('/missions/history'),
};

// ===== CAIXA PREMIADA =====
export const caixaAPI = {
  status: () => isDemo
    ? Promise.resolve({ data: { code: 200, data: { total: 1000, players: 5 } } })
    : api.get('/caixa/status'),
  play: (data: { amount: number; coin: string }) => isDemo
    ? Promise.resolve({ data: { code: 200, data: { won: Math.random() > 0.7, prize: data.amount * 10, balance: 10000 } } })
    : api.post('/caixa/play', data),
};

export default api;
