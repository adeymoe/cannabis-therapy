import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';

const METHODS = [
  { id: 'joint',    label: 'Joint',    icon: '🚬', unit: 'g' },
  { id: 'vape',     label: 'Vape',     icon: '💨', unit: 'puffs' },
  { id: 'edible',   label: 'Edible',   icon: '🍪', unit: 'mg' },
  { id: 'tincture', label: 'Tincture', icon: '💧', unit: 'ml' },
  { id: 'bong',     label: 'Bong',     icon: '🫧', unit: 'g' },
  { id: 'dab',      label: 'Dab',      icon: '🔥', unit: 'g' },
];

const safetyColor = (score) => {
  if (score >= 8) return { bar: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 border-green-200',  label: 'Safe' };
  if (score >= 5) return { bar: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', label: 'Caution' };
  return              { bar: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-50 border-red-200',      label: 'High Risk' };
};

const formatDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const DosePage = () => {
  const [method, setMethod]         = useState('joint');
  const [thcPotency, setThcPotency] = useState('');
  const [cbdPotency, setCbdPotency] = useState('');
  const [amount, setAmount]         = useState('');
  const [notes, setNotes]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);
  const [history, setHistory]       = useState([]);
  const [stats, setStats]           = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeTab, setActiveTab]   = useState('log'); // 'log' | 'history' | 'stats'
  const [error, setError]           = useState('');

  const selectedMethod = METHODS.find((m) => m.id === method);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/dose/history`, { headers });
      setHistory(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/dose/stats`, { headers });
      setStats(res.data.data || null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!thcPotency || !amount) { setError('THC % and amount are required.'); return; }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/dose/log`,
        { method, thcPotency: Number(thcPotency), cbdPotency: Number(cbdPotency) || 0, amount: Number(amount), unit: selectedMethod.unit, notes },
        { headers }
      );
      setResult(res.data.data);
      setThcPotency(''); setCbdPotency(''); setAmount(''); setNotes('');
      fetchHistory(); fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log dose.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/dose/${id}`, { headers });
      setHistory((prev) => prev.filter((l) => l._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] px-4 py-6">
      <Header />

      <div className="max-w-2xl mx-auto">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#2E3A33]">💨 Know Your Dose</h1>
          <p className="text-sm text-[#7A6C58] mt-1">
            Today's cannabis is 5–10× stronger than decades ago. Track your consumption to stay safe.
          </p>
        </div>

        {/* Stats Bar */}
        {stats && stats.totalSessions > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Sessions (7d)', value: stats.totalSessions },
              { label: 'Avg Safety', value: `${stats.avgSafetyScore}/10` },
              { label: 'Avg THC%', value: `${stats.avgThc}%` },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-[#e1ddd3] p-3 text-center shadow-sm">
                <p className="text-lg font-bold text-[#2E3A33]">{s.value}</p>
                <p className="text-[11px] text-[#7A6C58]">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[['log', '📝 Log Dose'], ['history', '📋 History'], ['stats', '📊 Trends']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                activeTab === id ? 'bg-[#6CB28E] text-white shadow-sm' : 'bg-white border border-[#e1ddd3] text-[#2E3A33] hover:bg-[#EAF5EF]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB: LOG ── */}
        {activeTab === 'log' && (
          <div className="bg-white rounded-2xl border border-[#e1ddd3] shadow-sm p-6">
            <h2 className="font-semibold text-[#2E3A33] mb-4">Log a Session</h2>

            {/* Method Picker */}
            <p className="text-xs text-[#7A6C58] mb-2 font-medium uppercase tracking-wide">Consumption Method</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-medium transition ${
                    method === m.id
                      ? 'bg-[#6CB28E] border-[#6CB28E] text-white shadow-sm'
                      : 'bg-[#f9f7f3] border-[#e1ddd3] text-[#2E3A33] hover:border-[#6CB28E]'
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* THC + CBD */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#7A6C58] font-medium block mb-1">THC % <span className="text-red-400">*</span></label>
                  <input
                    type="number" min="0" max="100" step="0.1"
                    value={thcPotency}
                    onChange={(e) => setThcPotency(e.target.value)}
                    placeholder="e.g. 22"
                    className="w-full border border-[#e1ddd3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB28E]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#7A6C58] font-medium block mb-1">CBD % (optional)</label>
                  <input
                    type="number" min="0" max="100" step="0.1"
                    value={cbdPotency}
                    onChange={(e) => setCbdPotency(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full border border-[#e1ddd3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB28E]"
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs text-[#7A6C58] font-medium block mb-1">
                  Amount ({selectedMethod?.unit}) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number" min="0" step="0.1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Amount in ${selectedMethod?.unit}`}
                  className="w-full border border-[#e1ddd3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB28E]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-[#7A6C58] font-medium block mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How are you feeling? Any context..."
                  rows={2}
                  className="w-full border border-[#e1ddd3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB28E] resize-none"
                />
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#6CB28E] text-white py-2.5 rounded-xl font-semibold hover:bg-[#5a9a7a] transition disabled:opacity-50"
              >
                {submitting ? 'Logging & Analysing...' : '💾 Log Dose'}
              </button>
            </form>

            {/* Result Card */}
            {result && (() => {
              const c = safetyColor(result.safetyScore);
              return (
                <div className={`mt-5 rounded-2xl border p-4 ${c.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`font-bold text-sm ${c.text}`}>Safety Score: {result.safetyScore}/10 — {c.label}</p>
                    <span className="text-xs text-[#7A6C58]">{METHODS.find(m => m.id === result.method)?.icon} {result.method}</span>
                  </div>
                  {/* Safety bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div className={`h-2 rounded-full ${c.bar} transition-all`} style={{ width: `${result.safetyScore * 10}%` }} />
                  </div>
                  <div className="flex gap-2 bg-white rounded-xl p-3 border border-gray-100">
                    <span className="text-lg flex-shrink-0">🤖</span>
                    <p className="text-xs text-[#4a5568] leading-relaxed">{result.aiFeedback}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── TAB: HISTORY ── */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-[#e1ddd3] shadow-sm p-6">
            <h2 className="font-semibold text-[#2E3A33] mb-4">Session History</h2>
            {loadingHistory ? (
              <p className="text-sm text-[#7A6C58]">Loading...</p>
            ) : history.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm">No sessions logged yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((log) => {
                  const c = safetyColor(log.safetyScore);
                  const m = METHODS.find((x) => x.id === log.method);
                  return (
                    <div key={log._id} className="rounded-xl border border-[#e1ddd3] p-4 bg-[#f9f7f3] flex gap-3">
                      <span className="text-2xl flex-shrink-0">{m?.icon || '🌿'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm text-[#2E3A33] capitalize">{log.method}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.text} border`}>
                            {log.safetyScore}/10
                          </span>
                        </div>
                        <p className="text-xs text-[#7A6C58] mt-0.5">
                          THC {log.thcPotency}% · {log.amount} {log.unit}
                          {log.cbdPotency > 0 && ` · CBD ${log.cbdPotency}%`}
                        </p>
                        {log.aiFeedback && (
                          <p className="text-xs text-[#4a5568] mt-1 italic line-clamp-2">{log.aiFeedback}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">{formatDate(log.createdAt)}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(log._id)}
                        className="text-gray-300 hover:text-red-400 transition text-lg flex-shrink-0 self-start"
                        title="Delete log"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: STATS ── */}
        {activeTab === 'stats' && (
          <div className="bg-white rounded-2xl border border-[#e1ddd3] shadow-sm p-6">
            <h2 className="font-semibold text-[#2E3A33] mb-4">7-Day Safety Trend</h2>
            {!stats || stats.totalSessions === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-sm">Log at least one session to see trends.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl bg-[#EAF5EF] border border-[#c3e6cb] p-3 text-center">
                    <p className="text-lg font-bold text-[#2E3A33]">{stats.mostUsedMethod}</p>
                    <p className="text-[11px] text-[#7A6C58]">Most Used Method</p>
                  </div>
                  <div className="rounded-xl bg-[#EAF5EF] border border-[#c3e6cb] p-3 text-center">
                    <p className="text-lg font-bold text-[#2E3A33]">{stats.avgThc}%</p>
                    <p className="text-[11px] text-[#7A6C58]">Avg THC Potency</p>
                  </div>
                </div>

                {/* Safety trend bars */}
                <p className="text-xs text-[#7A6C58] font-medium uppercase tracking-wide mb-3">Safety Score Per Session</p>
                <div className="space-y-2">
                  {stats.safetyTrend.map((entry, i) => {
                    const c = safetyColor(entry.safetyScore);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[10px] text-[#7A6C58] w-20 flex-shrink-0">{entry.date}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${c.bar} transition-all`}
                            style={{ width: `${entry.safetyScore * 10}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold w-8 text-right ${c.text}`}>{entry.safetyScore}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Education note */}
                <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs text-amber-800">
                    📚 <strong>Did you know?</strong> Stanford researchers found today's cannabis is 5–10× stronger than decades ago.
                    Tracking your potency helps you stay within safe limits and avoid accidental overconsumption.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-[10px] text-[#7A6C58] mt-5">
          🔒 For harm reduction purposes only. This is not medical advice. Consult a healthcare professional.
        </p>
      </div>
    </div>
  );
};

export default DosePage;