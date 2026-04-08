import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bolt, MessageSquare, Share2, ShieldCheck, ArrowLeft, Zap, ShoppingBag, MapPin, Send, X, Play, Pause, Plus } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const SEED_DATA = [
  { post_id: "seed1", prenom_auteur: "Ben ARRIS", photo_auteur: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100", media_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1920", contenu: "Synchronizing the alchemy of digital gestures with institutional precision.", nb_eclairs: 42800, nb_commentaires: 1200, tags: ["BRUT", "GHANA"], badge_frek: true },
  { post_id: "seed2", prenom_auteur: "Kilti Maker", photo_auteur: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100", media_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=1920", contenu: "New session studio — Beat Zouk available now in the shop.", nb_eclairs: 12500, nb_commentaires: 450, tags: ["MUSIC", "MARTINIQUE"], badge_frek: true },
  { post_id: "seed3", prenom_auteur: "Core Engine", photo_auteur: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100", media_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1920", contenu: "Protocol Omega update successful. Security layers optimized.", nb_eclairs: 8900, nb_commentaires: 120, tags: ["TECH", "CORE"], badge_frek: false },
];

export default function FeedView({ onBack, onNavigate, auth }) {
  const [posts, setPosts] = useState(SEED_DATA);
  const [activeIndex, setActiveIndex] = useState(0);
  const [eclairLoading, setEclairLoading] = useState(null);
  const [showComments, setShowComments] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [followedUsers, setFollowedUsers] = useState([]);
  const [page, setPage] = useState(1);
  const containerRef = useRef(null);

  // Fetch real posts
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/feed/posts?page=1&limit=10`);
        if (res.ok) {
          const data = await res.json();
          if (data.posts && data.posts.length > 0) {
            setPosts(data.posts);
          }
        }
      } catch {}
    })();
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
      if (index !== activeIndex) setActiveIndex(index);
    }
  };

  const handleEclair = async (postId) => {
    setEclairLoading(postId);
    try {
      const res = await fetch(`${API}/api/feed/posts/${postId}/eclair`, {
        method: 'POST', credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => p.post_id === postId ? { ...p, nb_eclairs: data.nb_eclairs, user_a_eclaire: true } : p));
        if (navigator.vibrate) navigator.vibrate(50);
      }
    } catch {} finally { setEclairLoading(null); }
  };

  const handleComment = async (postId) => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${API}/api/feed/posts/${postId}/commentaire`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: newComment }), credentials: 'include',
      });
      if (res.ok) {
        setPosts(prev => prev.map(p => p.post_id === postId ? { ...p, nb_commentaires: (p.nb_commentaires || 0) + 1 } : p));
        setNewComment("");
      }
    } catch {}
  };

  const toggleFollow = (user) => {
    if (followedUsers.includes(user)) setFollowedUsers(followedUsers.filter(u => u !== user));
    else { setFollowedUsers([...followedUsers, user]); }
  };

  const handleShare = async (item) => {
    try { await navigator.share({ title: `Kiltikonet - ${item.prenom_auteur}`, text: item.contenu, url: window.location.href }); } catch (err) { /* share cancelled */ }
  };

  const formatCount = (n) => {
    if (typeof n === 'string') return n;
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  return (
    <div className="flex h-screen w-full bg-black overflow-hidden relative" data-testid="feed-view">
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBack} className="absolute top-6 left-6 z-50 w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md text-white hover:border-[rgba(242,202,80,0.3)] transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <ArrowLeft className="w-5 h-5" />
      </motion.button>
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onNavigate("build")} className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#f2ca50', color: 'black', boxShadow: '0 0 15px rgba(242,202,80,0.4)', border: '1px solid rgba(242,202,80,0.5)' }}>
        <Plus className="w-6 h-6" />
      </motion.button>

      <div ref={containerRef} onScroll={handleScroll} className="flex-1 h-full overflow-y-scroll snap-y snap-mandatory" style={{ scrollbarWidth: 'none' }}>
        {posts.map((item) => (
          <div key={item.post_id} className="h-full w-full snap-start relative flex items-center justify-center">
            <div className="absolute inset-0">
              <img src={item.media_url || item.photo_auteur} alt={item.prenom_auteur} className="w-full h-full object-cover grayscale-[0.2] sepia-[0.1] brightness-[0.7]" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
            </div>

            <div className="absolute right-4 sm:right-10 bottom-24 z-20 flex flex-col items-center gap-6 sm:gap-8">
              <div className="relative flex flex-col items-center gap-2">
                <motion.div whileTap={{ scale: 0.9 }} onClick={() => onNavigate("frek_id")} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 overflow-hidden cursor-pointer" style={{ border: '2px solid #f2ca50' }}>
                  <img src={item.photo_auteur || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"} alt={item.prenom_auteur} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                </motion.div>
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleFollow(item.prenom_auteur)} className="absolute -bottom-2 w-5 h-5 rounded-full flex items-center justify-center transition-all" style={{ background: followedUsers.includes(item.prenom_auteur) ? '#22c55e' : '#f2ca50' }}>
                  {followedUsers.includes(item.prenom_auteur) ? <ShieldCheck className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-black" />}
                </motion.button>
              </div>
              <motion.div whileTap={{ scale: 0.8 }} onClick={() => handleEclair(item.post_id)} className="flex flex-col items-center gap-1 cursor-pointer group">
                <Zap className={`w-8 h-8 sm:w-9 sm:h-9 transition-all ${item.user_a_eclaire ? "fill-[#f2ca50]" : "text-white group-hover:text-[#f2ca50]"}`} style={item.user_a_eclaire ? { color: '#f2ca50', filter: 'drop-shadow(0 0 10px #f2ca50)' } : {}} />
                <span className="text-[10px] sm:text-xs font-bold text-white tracking-widest">{formatCount(item.nb_eclairs)}</span>
              </motion.div>
              <motion.div whileTap={{ scale: 0.8 }} onClick={() => setShowComments(item.post_id)} className="flex flex-col items-center gap-1 cursor-pointer group">
                <MessageSquare className="w-8 h-8 sm:w-9 sm:h-9 text-white group-hover:text-[#f2ca50] transition-colors" />
                <span className="text-[10px] sm:text-xs font-bold text-white tracking-widest">{formatCount(item.nb_commentaires)}</span>
              </motion.div>
              <motion.div whileTap={{ scale: 0.8 }} onClick={() => handleShare(item)} className="flex flex-col items-center gap-1 cursor-pointer group">
                <Share2 className="w-8 h-8 sm:w-9 sm:h-9 text-white group-hover:text-[#f2ca50] transition-colors" />
                <span className="text-[10px] sm:text-xs font-bold text-white tracking-widest uppercase">SHARE</span>
              </motion.div>
              <motion.div whileTap={{ scale: 0.8 }} onClick={() => onNavigate("shop")} className="flex flex-col items-center gap-1 cursor-pointer group">
                <ShoppingBag className="w-8 h-8 sm:w-9 sm:h-9 group-hover:scale-110 transition-all" style={{ color: '#f2ca50' }} />
                <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase" style={{ color: '#f2ca50' }}>SHOP</span>
              </motion.div>
            </div>

            <div className="absolute bottom-12 left-6 sm:left-10 z-20 max-w-[280px] sm:max-w-lg">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 text-[8px] sm:text-[10px] tracking-widest rounded-sm uppercase" style={{ background: 'rgba(242,202,80,0.2)', color: '#f2ca50', border: '1px solid rgba(242,202,80,0.2)' }}>{(item.tags || [])[0] || "FEED"}</span>
                <span className="flex items-center gap-1 text-gray-400 text-[9px] sm:text-[11px] tracking-widest uppercase"><MapPin className="w-3 h-3" />{(item.tags || [])[1] || ""}</span>
              </div>
              <h2 className="italic text-2xl sm:text-4xl text-white leading-tight mb-3 cursor-pointer hover:text-[#f2ca50] transition-colors" style={{ fontFamily: "'Noto Serif', serif", textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>@{(item.prenom_auteur || "").replace(" ", "").toLowerCase()}</h2>
              <p className="text-gray-300 text-xs sm:text-base leading-relaxed opacity-90 mb-4">{item.contenu}</p>
            </div>

            <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
              {posts.map((_, i) => (<div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeIndex === i ? "scale-150" : "bg-white/20"}`} style={activeIndex === i ? { background: '#f2ca50', boxShadow: '0 0 8px #f2ca50' } : {}} />))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showComments !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-4" onClick={() => setShowComments(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
              <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="italic text-lg" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>Comments</span>
                <button onClick={() => setShowComments(null)} className="text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <div className="h-[40vh] sm:h-[50vh] overflow-y-auto p-6 space-y-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: 'rgba(242,202,80,0.2)', color: '#f2ca50' }}>BA</div>
                  <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f2ca50' }}>Ben Arris</span><p className="text-xs text-gray-300 leading-relaxed">This is exactly what the ecosystem needed. Pure sovereignty.</p></div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-gray-400 text-xs">KM</div>
                  <div className="flex flex-col gap-1"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kilti Maker</span><p className="text-xs text-gray-300 leading-relaxed">The audio quality is insane.</p></div>
                </div>
              </div>
              <div className="p-4 bg-black/40 flex items-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <input type="text" placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} className="flex-1 bg-white/5 rounded-full px-4 py-2 text-xs outline-none transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleComment(showComments)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#f2ca50', color: 'black' }}><Send className="w-4 h-4" /></motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
