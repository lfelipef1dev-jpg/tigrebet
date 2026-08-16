import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface BetHistoryItem {
  period: string;
  select: string;
  amount: number;
  result: number;
  goal: number;
  time: Date;
}

export interface User {
  uid: string | null;
  token: string | null;
  mobile?: string;
  username?: string;
  balance: {
    ETC: number;
    ETH: number;
    BTC: number;
  };
  vipLevel: number;
  refCode?: string;
  userPayPwd?: string;
}

export interface App {
  sdkUrl: string;
  system: number; // 0 = iOS, 1 = Android
  shareUrl: string;
  isback: boolean;
  apkurl: string | null;
  homeData: Record<string, unknown> | null;
  commonData: {
    app: string;
    vip: string;
  };
  isLoad: boolean;
  lasturl: string | null;
}

export interface Game {
  selectedCoin: 'ETC' | 'ETH' | 'BTC';
  balance: {
    ETC: number;
    ETH: number;
    BTC: number;
  };
  currentPeriod: string;
  lastResult: number;
  trend: number[];
  betHistory: BetHistoryItem[];
}

export interface VIP {
  level: number;
  points: number;
  privileges: string[];
  commissionRate: number;
}

export interface Commission {
  totalEarnings: number;
  todayEarnings: number;
  teamCount: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
}

interface StoreState {
  user: User;
  app: App;
  game: Game;
  vip: VIP;
  commission: Commission;
  loading: boolean;
  
  // User actions
  setUser: (user: Partial<User>) => void;
  setToken: (token: string) => void;
  logout: () => void;
  
  // App actions
  setApp: (app: Partial<App>) => void;
  setSdkUrl: (url: string) => void;
  setIsback: (isback: boolean) => void;
  setLastUrl: (url: string) => void;
  
  // Game actions
  setGame: (game: Partial<Game>) => void;
  setSelectedCoin: (coin: 'ETC' | 'ETH' | 'BTC') => void;
  setBalance: (coin: 'ETC' | 'ETH' | 'BTC', amount: number) => void;
  addBetHistory: (bet: BetHistoryItem) => void;
  updateTrend: (result: number) => void;
  
  // VIP actions
  setVIP: (vip: Partial<VIP>) => void;
  
  // Commission actions
  setCommission: (commission: Partial<Commission>) => void;
  
  // Loading
  setLoading: (loading: boolean) => void;
}

const isDemoInitial = typeof window !== 'undefined' && (window.location.hostname.includes('expostacker.com.br') || window.location.hostname.includes('pages.dev'));
const demoBalance = typeof window !== 'undefined' ? parseFloat(localStorage.getItem('demo_balance') || '10000') : 10000;

const initialState = {
  user: {
    uid: null,
    token: null,
    mobile: undefined,
    username: undefined,
    balance: { ETC: demoBalance, ETH: demoBalance, BTC: demoBalance },
    vipLevel: 0,
    refCode: undefined,
    userPayPwd: undefined,
  },
  app: {
    sdkUrl: '',
    system: typeof window !== 'undefined' && typeof navigator !== 'undefined' && /Android|Linux/i.test(navigator.userAgent) ? 1 : 0,
    shareUrl: '',
    isback: false,
    apkurl: null,
    homeData: null,
    commonData: { app: '', vip: '' },
    isLoad: false,
    lasturl: null,
  },
  game: {
    selectedCoin: 'ETC' as 'ETC' | 'ETH' | 'BTC',
    balance: { ETC: 0, ETH: 0, BTC: 0 },
    currentPeriod: '',
    lastResult: 0,
    trend: [],
    betHistory: [],
  },
  vip: {
    level: 0,
    points: 0,
    privileges: [],
    commissionRate: 0,
  },
  commission: {
    totalEarnings: 0,
    todayEarnings: 0,
    teamCount: 0,
    level1Count: 0,
    level2Count: 0,
    level3Count: 0,
  },
  loading: false,
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      ...initialState,
      
      // User actions
      setUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
      setToken: (token) => {
        localStorage.setItem('cp_token', token);
        set((state) => ({ user: { ...state.user, token } }));
      },
      logout: () => {
        localStorage.removeItem('cp_UID');
        localStorage.removeItem('cp_token');
        localStorage.removeItem('cp_userid');
        set({ user: initialState.user });
      },
      
      // App actions
      setApp: (app) => set((state) => ({ app: { ...state.app, ...app } })),
      setSdkUrl: (sdkUrl) => set((state) => ({ app: { ...state.app, sdkUrl } })),
      setIsback: (isback) => set((state) => ({ app: { ...state.app, isback } })),
      setLastUrl: (lasturl) => set((state) => ({ app: { ...state.app, lasturl } })),
      
      // Game actions
      setGame: (game) => set((state) => ({ game: { ...state.game, ...game } })),
      setSelectedCoin: (selectedCoin: 'ETC' | 'ETH' | 'BTC') => set((state) => ({ game: { ...state.game, selectedCoin } })),
      setBalance: (coin, amount) => set((state) => {
        const value = parseFloat(String(amount)) || 0;
        if (typeof window !== 'undefined' && (window.location.hostname.includes('expostacker.com.br') || window.location.hostname.includes('pages.dev'))) {
          localStorage.setItem('demo_balance', String(value));
        }
        return {
          game: {
            ...state.game,
            balance: { ...state.game.balance, [coin]: value }
          }
        };
      }),
      addBetHistory: (bet) => set((state) => ({
        game: {
          ...state.game,
          betHistory: [bet, ...state.game.betHistory]
        }
      })),
      updateTrend: (result) => set((state) => ({
        game: {
          ...state.game,
          lastResult: result,
          trend: [result, ...state.game.trend].slice(0, 100)
        }
      })),
      
      // VIP actions
      setVIP: (vip) => set((state) => ({ vip: { ...state.vip, ...vip } })),
      
      // Commission actions
      setCommission: (commission) => set((state) => ({ commission: { ...state.commission, ...commission } })),
      
      // Loading
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'raspadinha-storage',
      partialize: (state) => ({
        user: state.user,
        game: state.game,
        vip: state.vip,
        commission: state.commission,
      }),
    }
  )
);
