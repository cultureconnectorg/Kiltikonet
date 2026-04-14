import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, MessageSquare, Share2, ShieldCheck, ArrowLeft, Send, X, Plus, Loader2, Trash2, MoreVertical, Image, Bookmark, MapPin } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;
const LIMIT = 10;

export default function FeedView({ onBack, onNavigate, auth }) {
  const [posts, setPosts] = useState([]);
  const [eclairLoading, setEclairLoading] = useState(null);
  const [showComments, setShowComments] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [viewMode, setViewMode] = useState('feed'); // 'feed' or 'reels'
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [postingNew, setPostingNew] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, name }
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);

  const fetchPosts = useCallback(async (p = 1, append = false) => {
    if (p > 1) setLoadingMore(true);
    try {
      const skip = (p - 1) * LIMIT;
      const res = await fetch(`${API}/api/pro/feed?skip=${skip}&limit=${LIMIT}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const newPosts = data.posts || [];
        setPosts(prev => append ? [...prev, ...newPosts] : newPosts);
        setHasMore(newPosts.length >= LIMIT);
      }
    } catch (e) { console.error("Feed fetch:", e); }
    finally { setLoadingMore(false); }
  }, []);

  useEffect(() => { fetchPosts(1); }, [fetchPosts]);

  // Geolocation — ask once, cache in localStorage
  useEffect(() => {
    const cached = localStorage.getItem('kk_user_location');
    if (cached) { try { setUserLocation(JSON.parse(cached)); } catch {} return; }
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`${API}/api/pro/feed/geo/reverse?lat=${latitude}&lng=${longitude}`);
        if (res.ok) {
          const data = await res.json();
          const loc = { lat: latitude, lng: longitude, name: data.location_name || '' };
          setUserLocation(loc);
          localStorage.setItem('kk_user_location', JSON.stringify(loc));
        }
      } catch {}
    }, () => {}, { enableHighAccuracy: false, timeout: 5000 });
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        setPage(p => {
          const next = p + 1;
          fetchPosts(next, true);
          return next;
        });
      }
    }, { threshold: 0.1 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, fetchPosts]);

  const formatTime = (ts) => {
    if (!ts) return '';
    const diff = (Date.now() - new Date(ts).getTime()) / 60000;
    if (diff < 1) return 'maintenant';
    if (diff < 60) return `${Math.floor(diff)}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}j`;
  };

  const handleEclair = async (postId) => {
    if (eclairLoading) return;
    setEclairLoading(postId);
    try {
      const frekId = auth?.user?.frek_id || auth?.frekId || '';
      const res = await fetch(`${API}/api/pro/feed/posts/${postId}/eclair`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frek_id: frekId }), credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, eclairs_count: data.eclairs_count } : p));
        if (window.__KILTI_TOAST) window.__KILTI_TOAST('Eclair envoye !');
      } else {
        const err = await res.json().catch(() => ({}));
        if (window.__KILTI_TOAST) window.__KILTI_TOAST(err.detail || 'Erreur');
      }
    } catch {}
    finally { setEclairLoading(null); }
  };

  const loadComments = async (postId) => {
    try {
      const res = await fetch(`${API}/api/pro/feed/posts/${postId}/comments`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCommentsList(data.commentaires || data.comments || []);
      }
    } catch {}
  };

  const openComments = (postId) => {
    setShowComments(postId);
    setCommentsList([]);
    loadComments(postId);
  };

  const handleComment = async () => {
    if (!newComment.trim() || !showComments) return;
    setCommentLoading(true);
    const prenom = auth?.user?.name || auth?.user?.full_name || 'Anonyme';
    try {
      const res = await fetch(`${API}/api/pro/feed/posts/${showComments}/comment`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: newComment, prenom }), credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setCommentsList(prev => [...prev, data.comment]);
          setNewComment("");
          setPosts(prev => prev.map(p =>
            p.id === showComments ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
          ));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        if (window.__KILTI_TOAST) window.__KILTI_TOAST(err.detail || 'Erreur commentaire');
      }
    } catch (e) {
      console.error("Comment error:", e);
    }
    finally { setCommentLoading(false); }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/api/builder/upload`, { method: 'POST', body: fd, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNewPostImage(data.url || data.file_url || '');
      }
    } catch {}
    finally { setUploadingImage(false); }
  };

  const handleNewPost = async () => {
    if (!newPostContent.trim()) return;
    setPostingNew(true);
    try {
      const authorId = auth?.user?.id || auth?.user?.frek_id || auth?.user?.email || '';
      const res = await fetch(`${API}/api/pro/feed/post`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_id: authorId,
          content: newPostContent,
          thumbnail_url: newPostImage || '',
          post_type: 'insight',
          dimension: 'Culture',
          location_lat: userLocation?.lat || null,
          location_lng: userLocation?.lng || null,
          location_name: userLocation?.name || null,
        }), credentials: 'include',
      });
      if (res.ok) {
        setNewPostContent(""); setNewPostImage(null); setShowNewPost(false);
        fetchPosts(1);
      }
    } catch {}
    finally { setPostingNew(false); }
  };

  const handleDelete = async (postId) => {
    setDeletingPostId(postId);
    try {
      const authorId = auth?.user?.id || auth?.user?.frek_id || '';
      const res = await fetch(`${API}/api/pro/feed/posts/${postId}?author_id=${authorId}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch {}
    finally { setDeletingPostId(null); setOpenMenuPostId(null); }
  };

  const handleShare = (post) => {
    const url = `${window.location.origin}/pro?feed=${post.id}`;
    if (navigator.share) navigator.share({ title: post.author_name, text: post.content?.substring(0, 100), url });
    else { navigator.clipboard.writeText(url); if (window.__KILTI_TOAST) window.__KILTI_TOAST('Lien copie !'); }
  };

  const isOwnPost = (post) => {
    const userId = auth?.user?.id || '';
    const frekId = auth?.user?.frek_id || '';
    return post.author_id === userId || post.author_id === frekId || post.author_email === auth?.user?.email;
  };

  // Initials avatar
  const Avatar = ({ name, src, size = 40 }) => {
    const initials = (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    if (src) return <img src={src} alt="" className="rounded-full object-cover" style={{ width: size, height: size, border: '2px solid rgba(242,202,80,0.4)' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }} />;
    return <div className="rounded-full flex items-center justify-center font-bold" style={{ width: size, height: size, background: 'rgba(242,202,80,0.15)', color: '#f2ca50', fontSize: size * 0.35, border: '2px solid rgba(242,202,80,0.3)' }}>{initials}</div>;
  };

  return (
    <div className="flex flex-col h-screen w-full text-white" style={{ background: '#050505' }} data-testid="feed-view">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 shrink-0 z-50" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#050505' }}>
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-gray-400 hover:text-[#f2ca50]" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="feed-back-btn">
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          {/* Mode toggle */}
          <div className="flex rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setViewMode('feed')} className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold transition-colors" style={{ background: viewMode === 'feed' ? '#f2ca50' : 'transparent', color: viewMode === 'feed' ? 'black' : '#888' }} data-testid="feed-mode-feed">Feed</button>
            <button onClick={() => setViewMode('reels')} className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold transition-colors" style={{ background: viewMode === 'reels' ? '#f2ca50' : 'transparent', color: viewMode === 'reels' ? 'black' : '#888' }} data-testid="feed-mode-reels">Reels</button>
          </div>
          <span className="text-[10px] tracking-wider text-gray-500 uppercase">{posts.length}</span>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNewPost(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#f2ca50', color: 'black' }} data-testid="feed-new-post-btn">
          <Plus className="w-4 h-4" />
        </motion.button>
      </header>

      {/* Feed / Reels Content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto" style={viewMode === 'reels' ? { scrollSnapType: 'y mandatory' } : {}} data-testid="feed-scroll">
        {viewMode === 'feed' ? (
        <div className="max-w-lg mx-auto">
          {posts.length === 0 && !loadingMore && (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 20 }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'rgba(242,202,80,0.08)', border: '1px solid rgba(242,202,80,0.15)' }}>
                <Zap className="w-8 h-8" style={{ color: 'rgba(242,202,80,0.5)' }} />
              </motion.div>
              <motion.h3 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                className="text-base font-bold text-white mb-2">Bienvenue dans le Feed</motion.h3>
              <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                className="text-xs text-gray-500 leading-relaxed mb-6 max-w-[260px]">
                Le contenu vit grâce à la communauté. Soyez le premier à partager et à inspirer.
              </motion.p>
              <motion.button initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowNewPost(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-2"
                style={{ background: '#f2ca50', color: '#0a0a0b' }}
                data-testid="feed-first-post-btn">
                <Plus className="w-3.5 h-3.5" /> Publier en premier
              </motion.button>
            </div>
          )}
          {posts.map((post, idx) => (
            <article key={post.id || idx} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {/* Post header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={post.author_name} src={post.author_image} size={36} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white">{post.author_name}</span>
                      {!post.is_ghost && <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#f2ca50' }} />}
                    </div>
                    <div className="flex items-center gap-2">
                      {post.author_title && <span className="text-[11px] text-gray-500">{post.author_title}</span>}
                      {post.location_name && <span className="text-[11px] text-gray-600 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{post.location_name}</span>}
                      <span className="text-[11px] text-gray-600">{formatTime(post.created_at)}</span>
                    </div>
                  </div>
                </div>
                {/* Menu for own posts */}
                {isOwnPost(post) && !post.is_ghost && (
                  <div className="relative">
                    <button onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)} className="p-2 rounded-full hover:bg-white/5">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    <AnimatePresence>
                      {openMenuPostId === post.id && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute right-0 top-9 rounded-xl overflow-hidden shadow-xl z-30" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', minWidth: 140 }}>
                          <button onClick={() => handleDelete(post.id)} disabled={deletingPostId === post.id} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-40">
                            {deletingPostId === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Supprimer
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Post image — only show if URL exists and is non-empty */}
              {(post.thumbnail_url || post.media_url) && (post.thumbnail_url || post.media_url).length > 5 && (
                <div className="w-full aspect-square bg-gray-900 relative overflow-hidden">
                  <img src={post.thumbnail_url || post.media_url} alt="" className="w-full h-full object-cover" loading="lazy" onError={e => { e.target.parentElement.style.display = 'none'; }} />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-4">
                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleEclair(post.id)} disabled={eclairLoading === post.id} className="flex items-center gap-1.5" data-testid={`eclair-btn-${idx}`}>
                    {eclairLoading === post.id ? <Loader2 className="w-5 h-5 animate-spin text-[#f2ca50]" /> : <Zap className="w-5 h-5" style={{ color: post.eclairs_count > 0 ? '#f2ca50' : '#888' }} />}
                    {post.eclairs_count > 0 && <span className="text-xs font-bold" style={{ color: '#f2ca50' }}>{post.eclairs_count}</span>}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => openComments(post.id)} className="flex items-center gap-1.5" data-testid={`comment-btn-${idx}`}>
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    {post.comments_count > 0 && <span className="text-xs text-gray-400">{post.comments_count}</span>}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleShare(post)}>
                    <Share2 className="w-5 h-5 text-gray-400" />
                  </motion.button>
                </div>
                <Bookmark className="w-5 h-5 text-gray-500" />
              </div>

              {/* Content text */}
              <div className="px-4 pb-3">
                <p className="text-sm text-white/90 leading-relaxed">
                  <span className="font-semibold mr-1.5">{post.author_name}</span>
                  {post.content}
                </p>
                {post.dimension && (
                  <span className="text-xs mt-1.5 inline-block px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(242,202,80,0.12)', color: '#f2ca50' }}>#{post.dimension}</span>
                )}
                {post.comments_count > 0 && (
                  <button onClick={() => openComments(post.id)} className="block text-xs text-gray-500 mt-1.5">
                    Voir les {post.comments_count} commentaire{post.comments_count > 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </article>
          ))}

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-16 flex items-center justify-center">
            {loadingMore && <Loader2 className="w-5 h-5 animate-spin text-[#f2ca50]" />}
          </div>
        </div>
        ) : (
        /* ===== REELS MODE ===== */
        <div className="w-full">
          {posts.map((post, idx) => (
            <div key={post.id || idx} className="w-full relative flex items-end" style={{ height: 'calc(100vh - 56px)', scrollSnapAlign: 'start', background: '#000' }}>
              {/* Background image or gradient */}
              {(post.thumbnail_url || post.media_url) && (post.thumbnail_url || post.media_url).length > 5 ? (
                <img src={post.thumbnail_url || post.media_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, hsl(${(idx * 37) % 360}, 40%, 12%), hsl(${(idx * 37 + 120) % 360}, 30%, 8%))` }} />
              )}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.85) 100%)' }} />
              {/* Content overlay */}
              <div className="relative z-10 w-full px-4 pb-6 flex">
                <div className="flex-1 pr-12">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={post.author_name} src={post.author_image} size={32} />
                    <span className="text-sm font-bold text-white">{post.author_name}</span>
                    {!post.is_ghost && <ShieldCheck className="w-3.5 h-3.5 text-[#f2ca50]" />}
                    <span className="text-[10px] text-gray-400">{formatTime(post.created_at)}</span>
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed line-clamp-4">{post.content}</p>
                  {post.dimension && <span className="text-[10px] mt-2 inline-block px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(242,202,80,0.2)', color: '#f2ca50' }}>#{post.dimension}</span>}
                </div>
                {/* Side actions */}
                <div className="flex flex-col items-center gap-5 pt-4">
                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleEclair(post.id)} className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm">
                      {eclairLoading === post.id ? <Loader2 className="w-5 h-5 animate-spin text-[#f2ca50]" /> : <Zap className="w-5 h-5" style={{ color: post.eclairs_count > 0 ? '#f2ca50' : '#fff' }} />}
                    </div>
                    <span className="text-[10px] text-white font-bold">{post.eclairs_count || 0}</span>
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => openComments(post.id)} className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] text-white font-bold">{post.comments_count || 0}</span>
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleShare(post)} className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm">
                      <Share2 className="w-5 h-5 text-white" />
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          ))}
          <div ref={sentinelRef} className="h-16 flex items-center justify-center">
            {loadingMore && <Loader2 className="w-5 h-5 animate-spin text-[#f2ca50]" />}
          </div>
        </div>
        )}
      </div>

      {/* Comments Modal */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl flex flex-col" style={{ height: '60vh', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)' }} data-testid="comments-modal">
            <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-sm font-bold tracking-wider uppercase" style={{ color: '#f2ca50' }}>Commentaires</span>
              <button onClick={() => setShowComments(null)} data-testid="comments-close"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
              {commentsList.length === 0 && <p className="text-xs text-gray-600 text-center py-8">Aucun commentaire. Soyez le premier !</p>}
              {commentsList.map((c, i) => (
                <div key={c.id || i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: 'rgba(242,202,80,0.15)', color: '#f2ca50' }}>{(c.prenom || '?')[0]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{c.prenom || 'Anonyme'}</span>
                      <span className="text-[10px] text-gray-600">{formatTime(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-300 mt-0.5">{c.contenu}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t flex gap-2 shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }} placeholder="Ajouter un commentaire..." className="flex-1 bg-white/5 text-sm px-4 py-2.5 rounded-full outline-none text-white placeholder-gray-600" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="comment-input" />
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleComment} disabled={commentLoading || !newComment.trim()} className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30" style={{ background: '#f2ca50', color: 'black' }} data-testid="comment-submit-btn">
                {commentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Post Modal */}
      <AnimatePresence>
        {showNewPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => { setShowNewPost(false); setNewPostImage(null); }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()} className="w-full rounded-t-3xl p-5" style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)' }} data-testid="new-post-modal">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold tracking-wider uppercase" style={{ color: '#f2ca50' }}>Nouveau Post</span>
                <button onClick={() => { setShowNewPost(false); setNewPostImage(null); }}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} placeholder="Partagez avec la communaute..." rows={4} className="w-full bg-white/5 text-sm px-4 py-3 rounded-xl outline-none text-white resize-none" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="new-post-textarea" />
              {newPostImage && (
                <div className="relative mt-3 rounded-xl overflow-hidden" style={{ maxHeight: 160 }}>
                  <img src={newPostImage} alt="" className="w-full h-40 object-cover rounded-xl" />
                  <button onClick={() => setNewPostImage(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}><X className="w-3 h-3 text-white" /></button>
                </div>
              )}
              <div className="flex items-center gap-3 mt-3">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" />}
                  Photo
                </button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleNewPost} disabled={postingNew || !newPostContent.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold tracking-widest uppercase disabled:opacity-40" style={{ background: '#f2ca50', color: 'black' }} data-testid="new-post-submit-btn">
                  {postingNew ? 'Publication...' : 'Publier'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
