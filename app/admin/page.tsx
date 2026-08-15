'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const ADMIN_KEY = 'tigrebet-admin-2026';
const H = { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY };

const GAME_LABELS: Record<string, { label: string; emoji: string }> = {
  tiger:   { label: 'Fortune Tiger', emoji: '🐯' },
  crash:   { label: 'Crash',         emoji: '🚀' },
  mines:   { label: 'Mines',         emoji: '💣' },
  plinko:  { label: 'Plinko',        emoji: '🎯' },
  slots:   { label: 'Slots',         emoji: '🎰' },
  wingo:   { label: 'Wingo',         emoji: '🎲' },
  scratch: { label: 'Raspadinha',    emoji: '🎟️' },
  double:  { label: 'Double',        emoji: '🎡' },
  caixa:   { label: 'Caixa Premiada', emoji: '🎁' },
};

type GameSetting = { game: string; rtp: number; isOpen: boolean };
type Stat = { depositedToday: number; withdrawnToday: number; netToday: number; totalUsers: number; activeToday: number; pendingWithdrawals: number };
type Tx = { id: string; type: string; amount: string; status: string; paymentMethod: string; createdAt: string; user?: { mobile: string } };
type KycDocs = { fullName?: string; documentType?: string; documentNumber?: string; birthDate?: string; address?: string; city?: string; state?: string; zipCode?: string; submittedAt?: string; rejectionReason?: string };
type UserRow = { id: string; mobile: string; balanceETC: string; vipLevel: number; kycStatus: string; kycDocuments: KycDocs | null; totalDeposited: string; createdAt: string };

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function safeFetch(url: string) {
  try {
    const r = await fetch(url, { headers: H });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    console.error('[admin] fetch error', url, e);
    return null;
  }
}

export default function AdminPage() {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState('');
  const [settings, setSettings] = useState<GameSetting[]>([]);
  const [stats, setStats] = useState<Stat | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tab, setTab] = useState<'jogos' | 'depositos' | 'usuarios' | 'kyc'>('jogos');
  const [saving, setSaving] = useState<string | null>(null);
  const [newPw, setNewPw] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const countRef = useRef(5);

  const load = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [s, st, t, u] = await Promise.all([
        safeFetch(`${API}/admin/settings`),
        safeFetch(`${API}/admin/stats`),
        safeFetch(`${API}/admin/transactions?limit=100`),
        safeFetch(`${API}/admin/users?limit=100`),
      ]);
      if (!s && !st && !t && !u) {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está online.');
      } else {
        if (s?.data) setSettings(s.data);
        if (st?.data) setStats(st.data);
        if (t?.data) setTxs(t.data);
        if (u?.data) setUsers(u.data);
        setLastUpdate(new Date());
      }
    } finally {
      setLoadingData(false);
      countRef.current = 5;
      setCountdown(5);
    }
  }, []);

  useEffect(() => {
    if (!auth) return;
    load();
    const interval = setInterval(load, 5_000);
    const tick = setInterval(() => {
      countRef.current = Math.max(0, countRef.current - 1);
      setCountdown(countRef.current);
    }, 1000);
    return () => { clearInterval(interval); clearInterval(tick); };
  }, [auth, load]);

  const handleLogin = () => {
    if (pw === ADMIN_KEY) setAuth(true);
    else alert('Senha incorreta');
  };

  const updateGame = async (game: string, patch: Partial<GameSetting>) => {
    setSaving(game);
    try {
      const r = await fetch(`${API}/admin/settings/${game}`, {
        method: 'PUT', headers: H, body: JSON.stringify(patch),
      });
      const d = await r.json();
      if (d.data) setSettings(prev => prev.map(s => s.game === game ? { ...s, ...d.data } : s));
    } finally { setSaving(null); }
  };

  const handleResetPw = async (mobile: string) => {
    const pass = newPw[mobile];
    if (!pass || pass.length < 6) return alert('Mínimo 6 caracteres');
    if (!confirm(`Alterar senha de ${mobile}?`)) return;
    const r = await fetch(`${API}/admin/reset-password`, {
      method: 'POST', headers: H, body: JSON.stringify({ mobile, newPassword: pass }),
    });
    const d = await r.json();
    alert(d.msg);
    setNewPw(prev => ({ ...prev, [mobile]: '' }));
  };

  const [reviewing, setReviewing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const handleReviewKYC = async (userId: string, status: 'approved' | 'rejected', mobile: string) => {
    if (status === 'rejected' && !rejectReason[userId]?.trim()) return alert('Informe o motivo da rejeição');
    if (!confirm(`${status === 'approved' ? 'Aprovar' : 'Rejeitar'} KYC de ${mobile}?`)) return;
    setReviewing(userId);
    try {
      const r = await fetch(`${API}/kyc/review`, {
        method: 'POST', headers: H, body: JSON.stringify({ userId, status, reason: rejectReason[userId] }),
      });
      const d = await r.json();
      alert(d.msg || 'OK');
      if (d.code === 200) setUsers(prev => prev.map(u => u.id === userId ? { ...u, kycStatus: status } : u));
    } finally {
      setReviewing(null);
    }
  };

  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#161b22', borderRadius: 12, padding: 40, width: 340, border: '1px solid #30363d' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 40 }}>🔐</div>
            <h1 style={{ color: '#e6edf3', margin: '8px 0 4px', fontSize: 20 }}>Painel Admin</h1>
            <p style={{ color: '#8b949e', fontSize: 13 }}>TigreBet</p>
          </div>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Senha admin"
            style={{ width: '100%', padding: '10px 12px', background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3', fontSize: 15, boxSizing: 'border-box' }}
          />
          <button
            onClick={handleLogin}
            style={{ width: '100%', marginTop: 12, padding: '11px 0', background: '#f0a500', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#161b22', borderBottom: '1px solid #30363d', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🐯</span>
          <span style={{ fontWeight: 700, fontSize: 17 }}>TigreBet Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastUpdate && (
            <span style={{ fontSize: 12, color: '#484f58' }}>
              Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <span style={{ fontSize: 12, color: loadingData ? '#f0a500' : '#3fb950', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: loadingData ? '#f0a500' : '#3fb950', animation: loadingData ? 'pulse 0.8s infinite' : 'none' }} />
            {loadingData ? 'Atualizando...' : `Ao vivo • ${countdown}s`}
          </span>
          <button
            onClick={() => { countRef.current = 5; setCountdown(5); load(); }}
            disabled={loadingData}
            style={{ background: loadingData ? '#21262d' : '#f0a500', border: 'none', color: loadingData ? '#8b949e' : '#000', borderRadius: 6, padding: '6px 16px', cursor: loadingData ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}
          >
            {loadingData ? '⏳ Carregando...' : '↻ Atualizar'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: '#2d1515', border: '1px solid #f85149', color: '#f85149', padding: '10px 24px', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, padding: '20px 24px 0' }}>
          {[
            { label: 'Depósitos hoje', value: fmt(stats.depositedToday), color: '#3fb950' },
            { label: 'Saques hoje',    value: fmt(stats.withdrawnToday),  color: '#f85149' },
            { label: 'Saldo líquido',  value: fmt(stats.netToday),        color: stats.netToday >= 0 ? '#3fb950' : '#f85149' },
            { label: 'Total usuários', value: stats.totalUsers.toString(), color: '#58a6ff' },
            { label: 'Ativos hoje',    value: stats.activeToday.toString(), color: '#d2a8ff' },
            { label: 'Saques pend.',   value: stats.pendingWithdrawals.toString(), color: '#f0a500' },
          ].map(c => (
            <div key={c.label} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '20px 24px 0' }}>
        {(['jogos', 'depositos', 'usuarios', 'kyc'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: 8, border: '1px solid #30363d', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            background: tab === t ? '#f0a500' : '#161b22', color: tab === t ? '#000' : '#8b949e',
          }}>
            {t === 'jogos' ? '🎮 Jogos' : t === 'depositos' ? '💰 Depósitos' : t === 'usuarios' ? '👥 Usuários' : '🛡️ KYC'}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 24px' }}>

        {/* JOGOS TAB */}
        {tab === 'jogos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {settings.map(s => {
              const info = GAME_LABELS[s.game] || { label: s.game, emoji: '🎮' };
              return (
                <div key={s.game} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 28 }}>{info.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{info.label}</div>
                        <div style={{ fontSize: 12, color: s.isOpen ? '#3fb950' : '#f85149', marginTop: 2 }}>
                          {s.isOpen ? '● Aberto' : '● Fechado'}
                        </div>
                      </div>
                    </div>

                    {/* Open/Close toggle */}
                    <button
                      onClick={() => updateGame(s.game, { isOpen: !s.isOpen })}
                      disabled={saving === s.game}
                      style={{
                        padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                        background: s.isOpen ? '#f85149' : '#3fb950', color: '#fff',
                      }}
                    >
                      {s.isOpen ? 'Fechar Jogo' : 'Abrir Jogo'}
                    </button>
                  </div>

                  {/* RTP Slider */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#8b949e' }}>RTP (retorno ao jogador)</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#f0a500' }}>{s.rtp}%</span>
                    </div>
                    <div style={{ position: 'relative', height: 8, background: '#21262d', borderRadius: 4 }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${s.rtp}%`, background: `hsl(${s.rtp * 1.2}, 70%, 50%)`, borderRadius: 4, transition: 'width 0.1s' }} />
                    </div>
                    <input
                      type="range" min={0} max={100} value={s.rtp}
                      onChange={e => setSettings(prev => prev.map(x => x.game === s.game ? { ...x, rtp: +e.target.value } : x))}
                      onMouseUp={e => updateGame(s.game, { rtp: +(e.target as HTMLInputElement).value })}
                      onTouchEnd={e => updateGame(s.game, { rtp: +(e.currentTarget as HTMLInputElement).value })}
                      disabled={saving === s.game}
                      style={{ width: '100%', marginTop: 6, accentColor: '#f0a500', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#484f58', marginTop: 2 }}>
                      <span>0% (fechado)</span><span>50%</span><span>100% (máximo)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DEPÓSITOS TAB */}
        {tab === 'depositos' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #30363d', color: '#8b949e' }}>
                  {['Usuário', 'Tipo', 'Valor', 'Método', 'Status', 'Data'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txs.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #21262d' }}>
                    <td style={{ padding: '6px 8px' }}>{tx.user?.mobile || '—'}</td>
                    <td style={{ padding: '6px 8px', color: tx.type === 'deposit' ? '#3fb950' : '#f85149' }}>
                      {tx.type === 'deposit' ? '⬇ Depósito' : '⬆ Saque'}
                    </td>
                    <td style={{ padding: '6px 8px', fontWeight: 700 }}>{fmt(parseFloat(tx.amount))}</td>
                    <td style={{ padding: '6px 8px', textTransform: 'uppercase', fontSize: 11 }}>{tx.paymentMethod || '—'}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: tx.status === 'completed' ? '#1c3a2a' : tx.status === 'pending' ? '#2d2600' : '#3a1c1c',
                        color: tx.status === 'completed' ? '#3fb950' : tx.status === 'pending' ? '#f0a500' : '#f85149',
                      }}>
                        {tx.status}
                      </span>
                    </td>
                    <td style={{ padding: '6px 8px', color: '#8b949e' }}>
                      {new Date(tx.createdAt).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
                {txs.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#484f58' }}>Nenhuma transação ainda</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* USUÁRIOS TAB */}
        {tab === 'usuarios' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #30363d', color: '#8b949e' }}>
                  {['Celular', 'Saldo', 'VIP', 'Cadastro', 'Nova senha', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #21262d' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>{u.mobile}</td>
                    <td style={{ padding: '6px 8px' }}>{fmt(parseFloat(u.balanceETC || '0'))}</td>
                    <td style={{ padding: '6px 8px' }}>Nível {u.vipLevel}</td>
                    <td style={{ padding: '6px 8px', color: '#8b949e' }}>{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        placeholder="Nova senha"
                        value={newPw[u.mobile] || ''}
                        onChange={e => setNewPw(prev => ({ ...prev, [u.mobile]: e.target.value }))}
                        style={{ padding: '5px 8px', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', fontSize: 13, width: 130 }}
                      />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <button
                        onClick={() => handleResetPw(u.mobile)}
                        style={{ padding: '5px 12px', background: '#21262d', border: '1px solid #30363d', color: '#e6edf3', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                      >
                        Alterar
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#484f58' }}>Nenhum usuário ainda</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* KYC TAB */}
        {tab === 'kyc' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #30363d', color: '#8b949e' }}>
                  {['Celular', 'Nome', 'Documento', 'Status', 'Depósito total', 'Ações'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(u => u.kycStatus !== 'approved')
                  .sort((a, b) => (a.kycStatus === 'pending' ? -1 : 1))
                  .map(u => {
                    const docs = u.kycDocuments || {};
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid #21262d' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{u.mobile}</td>
                        <td style={{ padding: '6px 8px' }}>{docs.fullName || '—'}</td>
                        <td style={{ padding: '6px 8px' }}>{docs.documentType || '—'} {docs.documentNumber || ''}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                            background: u.kycStatus === 'pending' ? '#2d2600' : u.kycStatus === 'rejected' ? '#3a1c1c' : '#21262d',
                            color: u.kycStatus === 'pending' ? '#f0a500' : u.kycStatus === 'rejected' ? '#f85149' : '#8b949e',
                          }}>
                            {u.kycStatus === 'pending' ? 'Pendente' : u.kycStatus === 'rejected' ? 'Rejeitado' : u.kycStatus === 'not_submitted' ? 'Não enviado' : u.kycStatus}
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px' }}>{fmt(parseFloat(u.totalDeposited || '0'))}</td>
                        <td style={{ padding: '6px 8px' }}>
                          {u.kycStatus !== 'approved' ? (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button
                                onClick={() => handleReviewKYC(u.id, 'approved', u.mobile)}
                                disabled={reviewing === u.id}
                                style={{ padding: '5px 10px', background: '#3fb950', border: 'none', borderRadius: 6, color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                              >
                                Aprovar
                              </button>
                              <input
                                type="text"
                                placeholder="Motivo rejeição"
                                value={rejectReason[u.id] || ''}
                                onChange={e => setRejectReason(prev => ({ ...prev, [u.id]: e.target.value }))}
                                style={{ padding: '5px 8px', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', fontSize: 12, width: 120 }}
                              />
                              <button
                                onClick={() => handleReviewKYC(u.id, 'rejected', u.mobile)}
                                disabled={reviewing === u.id}
                                style={{ padding: '5px 10px', background: '#f85149', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                              >
                                Rejeitar
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#484f58', fontSize: 12 }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                {users.filter(u => u.kycStatus !== 'approved').length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#484f58' }}>Nenhum KYC pendente</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
