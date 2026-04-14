import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, MessageSquare, Share2, ShieldCheck, ArrowLeft, Send, X, Plus, Loader2, ChevronUp, Trash2, MoreVertical, Image } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;
const LIMIT = 10;

export default function FeedView({ onBack, onNavigate, auth }) {
  const [posts, setPosts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [eclairLoading, setEclairLoading] = useState(null);
  const [showComments, setShowComments] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
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
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Fetch posts from /api/pro/feed
  const fetchPosts = useCallback(async (p = 1, append = false) => {
    if (p > 1) setLoadingMore(true);
    try {
      const skip = (p - 1) * LIMIT;
      const res = await fetch(`${API}/api/pro/feed?skip=${skip}&limit=${LIMIT}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const newPosts = data.posts || [];
        setPosts(prev => append ? [...prev, ...newPosts] : newPosts);
        setHasMore(data.has_more || false);
      }
    } catch (e) { console.error("Feed fetch error:", e); }
    finally { setLoadingMore(false); }
  }, []);

  useEffect(() => { fetchPosts(1); }, [fetchPosts]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          setPage(prev => {
            const next = prev + 1;
            fetchPosts(next, true);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, fetchPosts]);

  // Scroll snap detection
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setActiveIndex(idx);
  }, []);

  // Eclair — debit 1 KT via /api/pro/feed/posts/{id}/eclair
  const handleEclair = async (postId) => {
    setEclairLoading(postId);
    try {
      const res = await fetch(`${API}/api/pro/feed/posts/${postId}/eclair`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frek_id: auth?.frekId || '' }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, eclairs_count: data.eclairs_count } : p
        ));
        auth?.playNotifSound?.();
      } else if (res.status === 402) {
        if (window.__KILTI_TOAST) window.__KILTI_TOAST('Solde KT insuffisant — recharge ton wallet');
      }
    } catch {}
    finally { setEclairLoading(null); }
  };

  // Load comments from /api/pro/feed/posts/{id}/comments
  const loadComments = async (postId) => {
    try {
      const res = await fetch(`${API}/api/pro/feed/posts/${postId}/comments`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCommentsList(data.commentaires || []);
      }
    } catch {}
  };

  const openComments = (postId) => {
    setShowComments(postId);
    loadComments(postId);
  };

  // Submit comment to /api/pro/feed/posts/{id}/comment
  const handleComment = async () => {
    if (!newComment.trim() || !showComments) return;
    setCommentLoading(true);
    const prenom = auth?.user?.name || auth?.userName || 'Anonyme';
    try {
      const res = await fetch(`${API}/api/pro/feed/posts/${showComments}/comment`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: newComment, prenom }), credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCommentsList(prev => [...prev, data.comment]);
        setNewComment("");
        setPosts(prev => prev.map(p =>
          p.id === showComments ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
        ));
      }
    } catch {}
    finally { setCommentLoading(false); }
  };

  // Upload image for new post
  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/api/builder/upload`, { method: 'POST', credentials: 'include', body: fd });
      if (res.ok) {
        const data = await res.json();
        setNewPostImage(data.url || data.file_url || '');
      }
    } catch {}
    finally { setUploadingImage(false); }
  };

  // Native share with error handling
  const handleShare = async (post) => {
    const text = `${post.author_name}: ${post.content?.slice(0, 100)}...`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Kiltikonet Feed", text, url: window.location.href });
      } else {
        await navigator.clipboard?.writeText(text);
        if (window.__KILTI_TOAST) window.__KILTI_TOAST('Lien copié dans le presse-papiers');
      }
    } catch (e) {
      // User cancelled share or clipboard unavailable — silent
      if (e?.name !== 'AbortError') {
        try { await navigator.clipboard?.writeText(text); } catch {}
      }
    }
  };

  // Delete own post
  const handleDelete = async (postId) => {
    if (deletingPostId) return;
    setDeletingPostId(postId);
    setOpenMenuPostId(null);
    try {
      const res = await fetch(`${API}/api/pro/feed/posts/${postId}?author_id=${encodeURIComponent(auth?.user?.id || '')}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch {}
    finally { setDeletingPostId(null); }
  };

  // Create new post via /api/pro/feed/post
  const handleNewPost = async () => {
    if (!newPostContent.trim()) return;
    setPostingNew(true);
    try {
      const res = await fetch(`${API}/api/pro/feed/post`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_id: auth?.user?.id || '',
          content: newPostContent,
          post_type: 'insight',
          dimension: 'Musique',
          thumbnail_url: newPostImage || null,
        }), credentials: 'include',
      });
      if (res.ok) {
        setNewPostContent("");
        setNewPostImage(null);
        setShowNewPost(false);
        setPage(1);
        fetchPosts(1);
      }
    } catch {}
    finally { setPostingNew(false); }
  };

  const formatCount = (n) => {
    if (!n) return "0";
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  return (
    <div className="flex flex-col h-screen w-full text-white overflow-hidden" style={{ background: '#050505' }} data-testid="feed-view">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 backdrop-blur-xl z-50 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.6)' }}>
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-gray-400 hover:text-[#f2ca50]" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="feed-back-btn">
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <span className="italic text-base uppercase tracking-wider" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>Feed</span>
          <span className="text-[7px] tracking-[0.3em] text-gray-600 uppercase ml-1">{posts.length} posts</span>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowNewPost(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#f2ca50', color: 'black' }} data-testid="feed-new-post-btn">
          <Plus className="w-4 h-4" />
        </motion.button>
      </header>

      {/* Feed container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main feed */}
        <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto lg:grid lg:grid-cols-2 lg:gap-4 lg:p-4 lg:auto-rows-min lg:overflow-y-auto" style={{ scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }}>
          {posts.map((post, idx) => (
            <div key={post.id || idx} className="relative w-full flex-shrink-0 lg:rounded-2xl lg:overflow-hidden lg:h-auto lg:min-h-[400px]" style={{ height: 'calc(100vh - 56px)', scrollSnapAlign: 'start' }}>
              {/* Background image */}
              {post.thumbnail_url && (
                <div className="absolute inset-0">
                  <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.4) 100%)' }} />
                </div>
              )}

              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-16 p-5 pb-8 z-10">
                {/* Author */}
                <div className="flex items-center gap-3 mb-3">
                  {post.author_image && (
                    <img src={post.author_image} alt="" className="w-10 h-10 rounded-full object-cover" style={{ border: '2px solid rgba(242,202,80,0.4)' }} onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">{post.author_name}</span>
                      {!post.is_ghost && <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#f2ca50' }} />}
                    </div>
                    {post.author_title && (
                      <span className="text-[10px] text-gray-400">{post.author_title}</span>
                    )}
                  </div>
                </div>

                {/* Text */}
                <p className="text-sm text-white/90 leading-relaxed mb-3 line-clamp-4">{post.content}</p>

                {/* Dimension tag */}
                {post.dimension && (
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider" style={{ background: 'rgba(242,202,80,0.15)', color: '#f2ca50' }}>#{post.dimension}</span>
                  </div>
                )}
              </div>

              {/* 3-dot menu for own posts */}
              {!post.is_ghost && post.author_id === auth?.user?.id && (
                <div className="absolute top-3 right-3 z-20">
                  <button onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
                    <MoreVertical className="w-4 h-4 text-white/70" />
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

              {/* Right actions */}
              <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-20">
                {/* Eclair */}
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleEclair(post.id)} disabled={eclairLoading === post.id} className="flex flex-col items-center gap-1" data-testid={`eclair-btn-${idx}`}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(242,202,80,0.3)' }}>
                    {eclairLoading === post.id ? <Loader2 className="w-5 h-5 animate-spin text-[#f2ca50]" /> : <Zap className="w-5 h-5" style={{ color: '#f2ca50' }} />}
                  </div>
                  <span className="text-[10px] text-white/70 font-bold">{formatCount(post.eclairs_count)}</span>
                </motion.button>

                {/* Comment */}
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => openComments(post.id)} className="flex flex-col items-center gap-1" data-testid={`comment-btn-${idx}`}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <MessageSquare className="w-5 h-5 text-white/80" />
                  </div>
                  <span className="text-[10px] text-white/70 font-bold">{formatCount(post.comments_count)}</span>
                </motion.button>

                {/* Share */}
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleShare(post)} className="flex flex-col items-center gap-1" data-testid={`share-btn-${idx}`}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <Share2 className="w-5 h-5 text-white/80" />
                  </div>
                </motion.button>
              </div>
            </div>
          ))}

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-20 flex items-center justify-center">
            {loadingMore && <Loader2 className="w-5 h-5 animate-spin text-[#f2ca50]" />}
            {!hasMore && posts.length > 0 && (
              <span className="text-xs text-gray-600">Fin du feed</span>
            )}
          </div>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-[280px] shrink-0 overflow-y-auto p-4 space-y-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', scrollbarWidth: 'thin' }}>
          <div className="rounded-xl p-4" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.1)' }}>
            <div className="text-[9px] text-gray-500 tracking-widest uppercase mb-2">Trending</div>
            {['#CC2026', '#Kiltikonet', '#Martinique', '#Culture'].map(t => (
              <div key={t} className="text-xs py-1.5" style={{ color: '#f2ca50' }}>{t}</div>
            ))}
          </div>
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[9px] text-gray-500 tracking-widest uppercase mb-2">Filtres</div>
            {['Tout', 'Posts', 'Reels', 'Audio'].map(f => (
              <button key={f} className="block w-full text-left text-xs text-gray-400 hover:text-[#f2ca50] py-1.5 transition-colors">{f}</button>
            ))}
          </div>
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[9px] text-gray-500 tracking-widest uppercase mb-2">Suggestions</div>
            <p className="text-[10px] text-gray-600">Explore le feed pour decouvrir la communaute CC2026</p>
          </div>
        </aside>
      </div>

      {/* Scroll-to-top */}
      {activeIndex > 2 && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => { containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold" style={{ background: 'rgba(242,202,80,0.9)', color: 'black' }}>
          <ChevronUp className="w-3 h-3" /> Haut
        </motion.button>
      )}

      {/* Comments Modal */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl flex flex-col" style={{ height: '60vh', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)' }} data-testid="comments-modal">
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-sm font-bold tracking-wider uppercase" style={{ color: '#f2ca50' }}>Commentaires</span>
              <button onClick={() => setShowComments(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {commentsList.length === 0 && <p className="text-xs text-gray-600 text-center py-8">Aucun commentaire. Soyez le premier !</p>}
              {commentsList.map((c, i) => (
                <div key={c.id || i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: 'rgba(242,202,80,0.15)', color: '#f2ca50' }}>{(c.prenom || '?')[0]}</div>
                  <div>
                    <span className="text-xs font-bold text-white">{c.prenom || 'Anonyme'}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{c.contenu}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={e => { e.preventDefault(); handleComment(); }} className="px-5 py-3 border-t flex gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Votre commentaire..." className="flex-1 bg-white/5 text-sm px-4 py-2.5 rounded-xl outline-none text-white" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="comment-input" />
              <motion.button whileTap={{ scale: 0.9 }} type="submit" disabled={commentLoading} className="p-2.5 rounded-xl" style={{ background: '#f2ca50', color: 'black' }} data-testid="comment-submit-btn">
                {commentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Post Modal */}
      <AnimatePresence>
        {showNewPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="w-full rounded-t-3xl p-5" style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)' }} data-testid="new-post-modal">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold tracking-wider uppercase" style={{ color: '#f2ca50' }}>Nouveau Post</span>
                <button onClick={() => { setShowNewPost(false); setNewPostImage(null); }}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} placeholder="Partagez avec la communaute..." rows={4} className="w-full bg-white/5 text-sm px-4 py-3 rounded-xl outline-none text-white resize-none" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="new-post-textarea" />
              {/* Image preview */}
              {newPostImage && (
                <div className="relative mt-3 rounded-xl overflow-hidden" style={{ maxHeight: 160 }}>
                  <img src={newPostImage} alt="" className="w-full h-40 object-cover rounded-xl" />
                  <button onClick={() => setNewPostImage(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}><X className="w-3 h-3 text-white" /></button>
                </div>
              )}
              {/* Actions row */}
              <div className="flex items-center gap-3 mt-3">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" />}
                  Photo
                </button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleNewPost} disabled={postingNew || !newPostContent.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold tracking-widest uppercase" style={{ background: postingNew ? '#333' : '#f2ca50', color: 'black' }} data-testid="new-post-submit-btn">
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
