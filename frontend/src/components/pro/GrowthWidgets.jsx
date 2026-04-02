import React, { useState, useEffect } from 'react';
import { Users, Zap, ChevronRight, Check, Lock } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const G = '#E8D5A0';

/**
 * ProofOfLife — Indicateur d'activité en temps réel
 * Affiché dans le header: "X en ligne"
 */
export const ProofOfLifeBadge = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API}/growth/engine/proof-of-life`);
        setData(res.data);
      } catch (e) { /* silent in production */ }
    };
    load();
    const interval = setInterval(load, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (!data) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full"
      style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.15)' }}
      data-testid="proof-of-life-badge">
      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#2DD4BF' }} />
      <span className="text-[10px] font-bold tabular-nums" style={{ color: '#2DD4BF' }}>
        {data.online_now}
      </span>
      <Users size={10} style={{ color: '#2DD4BF' }} />
    </div>
  );
};

/**
 * OnboardingWidget — Petites Victoires gamification
 * Affiché dans la sidebar ou comme card dans le feed
 */
export const OnboardingWidget = ({ userId }) => {
  const [data, setData] = useState(null);
  const [completing, setCompleting] = useState(null);

  useEffect(() => {
    if (!userId) return;
    axios.get(`${API}/growth/engine/onboarding/${userId}`)
      .then(r => setData(r.data))
      .catch(() => {});
  }, [userId]);

  if (!data || data.progress_pct >= 100) return null;

  const completeStep = async (step) => {
    setCompleting(step);
    try {
      const res = await axios.post(`${API}/growth/engine/onboarding/complete`, { user_id: userId, step });
      if (res.data.rewarded > 0) {
        setData(prev => ({
          ...prev,
          steps: prev.steps.map(s => s.step === step ? { ...s, done: true } : s),
          completed: prev.completed + 1,
          progress_pct: Math.round((prev.completed + 1) / prev.total * 100),
          total_earned: prev.total_earned + res.data.rewarded,
        }));
      }
    } catch { /* silent */ }
    setCompleting(null);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid #1e1e1e' }}
      data-testid="onboarding-widget">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold" style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
            Tes premiers pas
          </h3>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(232,213,160,0.1)' }}>
            <Zap size={10} style={{ color: G }} />
            <span className="text-[10px] font-bold" style={{ color: G }}>{data.total_earned} JCC</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full mb-3" style={{ background: '#1e1e1e' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${data.progress_pct}%`, background: `linear-gradient(90deg, ${G}, #F0E4C4)` }} />
        </div>

        {/* Steps */}
        <div className="space-y-1.5">
          {data.steps.map(step => (
            <button key={step.step} disabled={step.done || completing === step.step}
              onClick={() => !step.done && completeStep(step.step)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all"
              style={{
                background: step.done ? 'rgba(232,213,160,0.06)' : 'rgba(255,255,255,0.02)',
                opacity: step.done ? 0.5 : 1,
              }}
              data-testid={`onboarding-step-${step.step}`}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: step.done ? G : 'rgba(255,255,255,0.06)',
                  border: step.done ? 'none' : '1px solid #333',
                }}>
                {step.done ? <Check size={10} style={{ color: '#0a0a0b' }} /> :
                  <Lock size={8} style={{ color: '#555' }} />}
              </div>
              <span className="text-[11px] flex-1" style={{
                color: step.done ? '#72727a' : '#fff',
                textDecoration: step.done ? 'line-through' : 'none',
              }}>
                {step.label}
              </span>
              <span className="text-[10px] font-bold" style={{ color: step.done ? '#333' : G }}>
                +{step.reward}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * CreationNudge — Nudge de création vs consommation
 */
export const CreationNudge = ({ userId }) => {
  const [nudge, setNudge] = useState(null);

  useEffect(() => {
    if (!userId) return;
    axios.get(`${API}/growth/engine/creation-nudge/${userId}`)
      .then(r => { if (r.data.nudge) setNudge(r.data.nudge); })
      .catch(() => {});
  }, [userId]);

  if (!nudge) return null;

  return (
    <div className="rounded-2xl p-3 flex items-start gap-3"
      style={{ background: 'rgba(232,213,160,0.06)', border: '1px solid rgba(232,213,160,0.15)' }}
      data-testid="creation-nudge">
      <Zap size={16} className="flex-shrink-0 mt-0.5" style={{ color: G }} />
      <div>
        <p className="text-xs" style={{ color: '#fff' }}>{nudge.message}</p>
        {nudge.reward_hint && (
          <p className="text-[10px] mt-1 font-bold" style={{ color: G }}>{nudge.reward_hint}</p>
        )}
      </div>
    </div>
  );
};
