import React, { useState, useEffect } from 'react';
import { Zap, X, ChevronRight, Minus, Plus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const G = '#E8D5A0';

const AMOUNTS = [1, 5, 10, 25, 50];

const SoutenirSheet = ({ targetName, targetId, userId, onClose }) => {
  const [balance, setBalance] = useState(null);
  const [amount, setAmount] = useState(5);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (userId) {
      axios.get(`${API}/wallet/${userId}`)
        .then(r => setBalance(r.data.balance || 0))
        .catch(() => setBalance(0));
    }
  }, [userId]);

  const handleSend = async () => {
    if (balance === null || balance < amount) {
      toast.error('Solde insuffisant', { description: 'Achetez des Kilti-Tokens dans le Shop' });
      return;
    }
    setSending(true);
    try {
      await axios.post(`${API}/wallet/transfer`, {
        from_user_id: userId,
        to_user_id: targetId,
        amount: amount,
        reason: `Soutien a ${targetName}`,
        channel: 'app',
      });
      setSent(true);
      toast.success(`${amount} JCC envoyes a ${targetName} !`);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      toast.error('Erreur lors du transfert');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Sheet */}
      <div className="relative w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: '#141414', border: '1px solid #1e1e1e', borderBottom: 'none' }}
        onClick={e => e.stopPropagation()}
        data-testid="soutenir-sheet">

        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: '#333' }} />
        </div>

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }} data-testid="close-soutenir">
          <X size={16} style={{ color: '#72727a' }} />
        </button>

        {/* Content */}
        <div className="px-6 pt-4 pb-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(232,213,160,0.12)', border: '1px solid rgba(232,213,160,0.25)' }}>
              <Zap size={22} style={{ color: G }} />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>Soutenir</h3>
              <p className="text-xs" style={{ color: '#72727a' }}>{targetName}</p>
            </div>
          </div>

          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(232,213,160,0.15)' }}>
                <Zap size={32} style={{ color: G }} />
              </div>
              <p className="text-lg font-bold" style={{ color: '#fff' }}>{amount} JCC envoyes !</p>
              <p className="text-sm mt-1" style={{ color: '#72727a' }}>Merci pour votre soutien</p>
            </div>
          ) : (
            <>
              {/* Balance */}
              <div className="rounded-2xl p-4 mb-5" style={{ background: '#0a0a0b', border: '1px solid #1e1e1e' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#72727a' }}>Votre solde</span>
                  <div className="flex items-center gap-1.5">
                    <Zap size={14} style={{ color: G }} />
                    <span className="text-lg font-black tabular-nums" style={{ color: G, fontFamily: "'DM Sans', sans-serif" }}>
                      {balance !== null ? balance : '...'}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: G }}>JCC</span>
                  </div>
                </div>
              </div>

              {/* Amount selector */}
              <div className="mb-5">
                <p className="text-xs font-medium mb-3" style={{ color: '#72727a' }}>Montant du soutien</p>
                <div className="flex gap-2 flex-wrap">
                  {AMOUNTS.map(a => (
                    <button key={a} onClick={() => setAmount(a)}
                      className="flex-1 min-w-[56px] py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: amount === a ? G : 'rgba(255,255,255,0.04)',
                        color: amount === a ? '#0a0a0b' : '#72727a',
                        border: `1px solid ${amount === a ? G : '#1e1e1e'}`,
                      }}
                      data-testid={`amount-${a}`}>
                      {a}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="flex items-center justify-center gap-4 mt-3">
                  <button onClick={() => setAmount(Math.max(1, amount - 1))}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1e1e1e' }}>
                    <Minus size={16} style={{ color: '#72727a' }} />
                  </button>
                  <div className="flex items-center gap-1">
                    <span className="text-3xl font-black tabular-nums" style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>{amount}</span>
                    <span className="text-xs font-bold" style={{ color: G }}>JCC</span>
                  </div>
                  <button onClick={() => setAmount(amount + 1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1e1e1e' }}>
                    <Plus size={16} style={{ color: '#72727a' }} />
                  </button>
                </div>
              </div>

              {/* Send button */}
              {balance !== null && balance >= amount ? (
                <button onClick={handleSend} disabled={sending}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                  style={{ background: G, color: '#0a0a0b', fontFamily: "'DM Sans', sans-serif" }}
                  data-testid="confirm-soutenir">
                  <Zap size={16} /> {sending ? 'Envoi...' : `Envoyer ${amount} JCC`}
                </button>
              ) : (
                <div>
                  <button disabled
                    className="w-full py-3.5 rounded-2xl text-sm font-bold opacity-40 mb-2"
                    style={{ background: G, color: '#0a0a0b' }}>
                    Solde insuffisant
                  </button>
                  <a href="/espace-pro?section=shop&category=jetons"
                    className="flex items-center justify-center gap-2 text-xs font-semibold py-2"
                    style={{ color: G }}
                    data-testid="buy-jetons-link">
                    Acheter des Jetons CC <ChevronRight size={14} />
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoutenirSheet;
