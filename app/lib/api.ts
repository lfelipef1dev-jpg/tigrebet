import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

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
  playSlots: (data: Record<string, unknown>) => api.post('/slots/play', data),
};

// ===== TIGER =====
export const tigerAPI = {
  playTiger: (data: Record<string, unknown>) => api.post('/tiger/play', data),
};

// ===== CRASH =====
export const crashAPI = {
  playCrash: (data: Record<string, unknown>) => api.post('/crash/play', data),
};

// ===== PLINKO =====
export const plinkoAPI = {
  playPlinko: (data: Record<string, unknown>) => api.post('/plinko/play', data),
};

// ===== DOUBLE =====
export const doubleAPI = {
  status: () => api.get('/double/status'),
  placeBet: (data: { color: string; amount: number; coin: string }) => api.post('/double/bet', data),
};

// ===== MINESWEEPER =====
export const minesweeperAPI = {
  createOrder: (data: Record<string, unknown>) => api.post('/minesweeper/order', data),
  revealCell: (data: Record<string, unknown>) => api.post('/minesweeper/reveal', data),
  getReward: (data: Record<string, unknown>) => api.post('/minesweeper/reward', data),
};

// ===== SCRATCH (RASPADINHA) =====
export const scratchAPI = {
  play: (data: Record<string, unknown>) => api.post('/scratch/play', data),
};

// ===== ENVELOPES =====
export const envelopeAPI = {
  getInfo: () => api.get('/redenvelope/info'),
  getList: () => api.get('/redenvelope/list'),
  orderEnvelope: (data: Record<string, unknown>) => api.post('/redenvelope/order', data),
};

// ===== VIP =====
export const vipAPI = {
  getPrivilege: (level?: number) => api.get('/vip/privilege', { params: { level } }),
  getLevelInfo: () => api.get('/vip/level_info'),
  getVipInfo: () => api.get('/vip/info'),
  upgradeLevel: () => api.post('/vip/upgrade', {}),
  claimWeekly: () => api.post('/vip/claim_weekly', {}),
  claimMonthly: () => api.post('/vip/claim_monthly', {}),
};

// ===== COMMISSION =====
export const commissionAPI = {
  getCommission: () => api.get('/commission'),
};

// ===== REFERRAL =====
export const referralAPI = {
  getReferralInfo: () => api.get('/referral'),
};

// ===== PAYMENT =====
export const paymentAPI = {
  createDeposit: (data: Record<string, unknown>) => api.post('/payment/deposit', data),
  checkDepositStatus: (txId: string) => api.get(`/payment/deposit/${txId}/status`),
  withdraw: (data: Record<string, unknown>) => api.post('/payment/withdraw', data),
  history: (params?: Record<string, unknown>) => api.get('/payment/history', { params }),
};

// ===== KYC =====
export const kycAPI = {
  submit: (data: Record<string, unknown>) => api.post('/kyc/submit', data),
  status: () => api.get('/kyc/status'),
};

// ===== MISSIONS =====
export const missionAPI = {
  daily: () => api.get('/missions/daily'),
  claim: (missionId: string) => api.post(`/missions/${missionId}/claim`, {}),
  history: () => api.get('/missions/history'),
};

// ===== CAIXA PREMIADA =====
export const caixaAPI = {
  status: () => api.get('/caixa/status'),
  play: (data: { amount: number; coin: string }) => api.post('/caixa/play', data),
};

export default api;
