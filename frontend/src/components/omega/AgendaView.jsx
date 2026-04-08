import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, CalendarDays, Clock, MapPin, User, Music, Mic2, Code, ChefHat, Palette, Award, Users, Loader2, Star, CheckCircle } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const TYPE_ICONS = {
  concert: Music, conference: Mic2, hackathon: Code, masterclass: Mic2,
  atelier: Palette, ceremonie: Award, networking: Users, pitch: Star,
  exposition: Palette,
};

export default function AgendaView({ onBack, auth }) {
  const [days, setDays] = useState([]);
  const [activeDay, setActiveDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchAgenda = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/planning/cc2026`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDays(data.days || []);
      }
    } catch (e) { console.error("Agenda fetch error:", e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAgenda(); }, [fetchAgenda]);

  const currentDay = days[activeDay] || {};

  return (
    <div className="flex flex-col h-screen w-full text-white overflow-hidden" style={{ background: '#050505' }} data-testid="agenda-view">
      {/* Header */}
      <header className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-gray-400 hover:text-[#f2ca50]" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="agenda-back-btn">
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div>
            <span className="italic text-base uppercase tracking-wider" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>Agenda CC2026</span>
            <span className="text-[8px] tracking-[0.3em] text-gray-600 uppercase block">20 — 23 Mai 2026 | Martinique</span>
          </div>
        </div>

        {/* Day tabs */}
        <div className="flex gap-2">
          {days.map((day, idx) => (
            <motion.button key={day.jour} whileTap={{ scale: 0.95 }} onClick={() => setActiveDay(idx)} className="flex-1 py-2.5 px-3 rounded-xl text-center transition-all" style={{
              background: activeDay === idx ? '#f2ca50' : 'rgba(255,255,255,0.03)',
              color: activeDay === idx ? 'black' : '#999',
              border: `1px solid ${activeDay === idx ? '#f2ca50' : 'rgba(255,255,255,0.06)'}`,
            }} data-testid={`day-tab-${idx}`}>
              <div className="text-[10px] font-bold uppercase tracking-wider">J{idx + 1}</div>
              <div className="text-[8px] tracking-wider mt-0.5">{day.jour?.slice(8)}/{day.jour?.slice(5, 7)}</div>
            </motion.button>
          ))}
        </div>
      </header>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#f2ca50]" /></div>
        ) : (
          <>
            <div className="text-xs text-gray-500 mb-4 font-bold tracking-widest uppercase">{currentDay.label}</div>
            <div className="space-y-3">
              {(currentDay.events || []).map((evt, idx) => {
                const Icon = TYPE_ICONS[evt.type] || CalendarDays;
                return (
                  <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} onClick={() => setSelectedEvent(evt)} className="p-4 rounded-2xl cursor-pointer group transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} data-testid={`event-${idx}`}>
                    <div className="flex gap-3">
                      {/* Time */}
                      <div className="shrink-0 text-center w-14">
                        <div className="text-lg font-bold" style={{ color: '#f2ca50' }}>{evt.heure}</div>
                        <div className="text-[8px] text-gray-600 tracking-wider uppercase">{evt.type}</div>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: '#f2ca50' }} />
                          <h3 className="text-sm font-bold text-white truncate">{evt.titre}</h3>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{evt.artiste}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{evt.lieu}</span>
                        </div>
                        {evt.confirme && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[8px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                            <CheckCircle className="w-2.5 h-2.5" /> Confirme
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEvent(null)} className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-3xl p-6" style={{ background: '#0e0e0e', border: '1px solid rgba(242,202,80,0.15)' }} data-testid="event-detail-modal">
              <div className="text-3xl font-bold mb-1" style={{ color: '#f2ca50' }}>{selectedEvent.heure}</div>
              <h2 className="text-lg font-bold text-white mb-3">{selectedEvent.titre}</h2>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2"><User className="w-4 h-4 text-[#f2ca50]" />{selectedEvent.artiste}</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#f2ca50]" />{selectedEvent.lieu}</div>
                <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-[#f2ca50]" />{selectedEvent.type?.toUpperCase()}</div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSelectedEvent(null)} className="w-full mt-5 py-3 rounded-xl text-sm font-bold tracking-widest uppercase" style={{ background: '#f2ca50', color: 'black' }}>
                Fermer
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
