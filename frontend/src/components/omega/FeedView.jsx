import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, MessageSquare, Share2, ShieldCheck, ArrowLeft, Send, X, Plus, Loader2, ChevronUp, MoreVertical, Pencil, Trash2, Flag, Link2 } from "lucide-react";
import UserAvatar from "./UserAvatar";

const API = process.env.REACT_APP_BACKEND_URL;

export default function FeedView({ onBack, onNavigate, auth }) {
  const [posts, setPosts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [eclairLoading, setEclairLoading] = useState(null);
  const [showComments, setShowComments] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [postingNew, setPostingNew] = useState(false);
  const [moreMenuPost, setMoreMenuPost] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const containerRef = useRef(null);
  const sentinelRef = useRef(null);

  const myFrekId = auth?.frekId || '';
  const myEmail = auth?.user?.email || '';

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Fetch posts from /api/pro/feed
  const fetchPosts = useCallback(async (s = 0, append = false) => {
    try {
      const res = await fetch(`${API}/api/pro/feed?skip=${s}&limit=20`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const newPosts = data.posts || [];
        if (append) setPosts(prev => [...prev, ...newPosts]);
        else setPosts(newPosts);
        setHasMore(data.has_more || false);
      }
    } catch {}
  }, []);

  useEffect(() => { fetchPosts(0); }, [fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore) {
        setLoadingMore(true);
        const nextSkip = skip + 20;
        setSkip(nextSkip);
        fetchPosts(nextSkip, true).finally(() => setLoadingMore(false));
      }
    }, { threshold: 0.1 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, skip, fetchPosts]);

  // Scroll tracking
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / (el.clientHeight || 1));
    setActiveIndex(idx);
  };

  // Eclair — POST /api/pro/feed/posts/{id}/eclair
  const handleEclair = async (postId) => {
    if (!myFrekId) { showToast("FREK-ID requis"); return; }
    setEclairLoading(postId);
    try {
      const res = await fetch(`${API}/api/pro/feed/posts/${postId}/eclair`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frek_id: myFrekId }), credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, eclairs_count: data.eclairs_count } : p
        ));
        auth?.playNotifSound?.();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Erreur eclair");
      }
    } catch {}
    finally { setEclairLoading(null); }
  };

  // Comments
  const loadComments = async (postId) => {
    try {
      const res = await fetch(`${API}/api/feed/posts/${postId}/commentaires`, { credentials: 'include' });
      if (res.ok) { const d = await res.json(); setCommentsList(d.commentaires || []); }
    } catch { setCommentsList([]); }
  };
  const openComments = (postId) => { setShowComments(postId); loadComments(postId); };
  const handleComment = async () => {
    if (!newComment.trim() || !showComments) return;
    setCommentLoading(true);
    try {
      const res = await fetch(`${API}/api/feed/posts/${showComments}/commentaire`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: newComment }), credentials: 'include',
      });
      if (res.ok) {
        const d = await res.json();
        setCommentsList(prev => [...prev, d.comment || { contenu: newComment, prenom: 'Moi' }]);
        setNewComment("");
        setPosts(prev => prev.map(p =>
          p.id === showComments ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
        ));
      }
    } catch {}
    finally { setCommentLoading(false); }
  };

  const handleShare = (post) => {
    const text = `${post.author_name}: ${(post.content || '').slice(0, 100)}`;
    if (navigator.share) navigator.share({ title: "Kiltikonet Feed", text, url: window.location.href });
    else { navigator.clipboard?.writeText(text); showToast("Lien copie"); }
  };

  // New post — POST /api/pro/feed/post
  const handleNewPost = async () => {
    if (!newPostContent.trim()) return;
    setPostingNew(true);
    try {
      const authorId = auth?.user?.id || myFrekId || 'anon';
      const res = await fetch(`${API}/api/pro/feed/post`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_id: authorId, content: newPostContent, post_type: "insight", dimension: "Culture" }),
        credentials: 'include',
      });
      if (res.ok) { setNewPostContent(""); setShowNewPost(false); setSkip(0); fetchPosts(0); showToast("Post publie"); }
      else { const e = await res.json().catch(() => ({})); showToast(e.detail || "Erreur publication"); }
    } catch {}
    finally { setPostingNew(false); }
  };

  // Edit — PUT /api/feed/posts/:id
  const openEditModal = (post) => { setEditModal(post); setEditContent(post.content || ""); setMoreMenuPost(null); };
  const handleEdit = async () => {
    if (!editContent.trim() || !editModal) return;
    setEditLoading(true);
    try {
      const res = await fetch(`${API}/api/feed/posts/${editModal.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: editContent }), credentials: 'include',
      });
      if (res.ok) {
        setPosts(prev => prev.map(p =>
          p.id === editModal.id ? { ...p, content: editContent, modified: true } : p
        ));
        setEditModal(null); showToast("Post modifie");
      }
    } catch {}
    finally { setEditLoading(false); }
  };

  // Delete — DELETE /api/feed/posts/:id
  const openDeleteModal = (post) => { setDeleteModal(post); setMoreMenuPost(null); };
  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API}/api/feed/posts/${deleteModal.id}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== deleteModal.id));
        setDeleteModal(null); showToast("Post supprime");
      }
    } catch {}
    finally { setDeleteLoading(false); }
  };

  // Report — POST /api/feed/posts/:id/report
  const handleReport = async (post) => {
    setMoreMenuPost(null);
    try {
      await fetch(`${API}/api/feed/posts/${post.id}/report`, { method: 'POST', credentials: 'include' });
      showToast("Post signale — merci");
    } catch {}
  };

  const handleCopyLink = (post) => {
    setMoreMenuPost(null);
    navigator.clipboard?.writeText(`${window.location.origin}/pro#feed-${post.id}`);
    showToast("Lien copie");
  };

  const isAuthor = (post) => {
    if (myFrekId && (post.author_id === myFrekId || post.author_frek_id === myFrekId)) return true;
    if (myEmail && post.author_email === myEmail) return true;
    return false;
  };
  const isAdmin = auth?.user?.role === 'admin' || auth?.user?.role === 'founder';

  const formatCount = (n) => {
    if (!n) return "0";
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  const timeAgo = (ts) => {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
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
        <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto lg:grid lg:grid-cols-2 lg:gap-4 lg:p-4 lg:auto-rows-min" style={{ scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }}>
          {posts.map((post, idx) => (
            <div key={post.id || idx} className="relative w-full flex-shrink-0 lg:rounded-2xl lg:overflow-hidden lg:h-auto lg:min-h-[400px]" style={{ height: 'calc(100vh - 56px)', scrollSnapAlign: 'start' }}>
              {/* BG */}
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, hsl(${(idx * 47) % 360}, 15%, 8%) 0%, #0a0a0b 100%)` }} />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-16 p-5 pb-8 z-10">
                <div className="flex items-center gap-3 mb-3">
                  <UserAvatar src={post.author_image} name={post.author_name || "?"} size={40} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">{post.author_name || "Anonyme"}</span>
                      {!post.is_ghost && <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#f2ca50' }} />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/40">{post.author_title}</span>
                      {post.author_country && <span className="text-[10px] text-white/40">{post.author_country}</span>}
                      <span className="text-[10px] text-white/30">{timeAgo(post.created_at)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white/90 leading-relaxed mb-2 line-clamp-5 whitespace-pre-line">{post.content}</p>
                {post.modified && <span className="text-[8px] text-gray-500 italic">Modifie</span>}
                {post.dimension && (
                  <span className="inline-block mt-2 text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider" style={{ background: 'rgba(242,202,80,0.15)', color: '#f2ca50' }}>
                    {post.dimension}
                  </span>
                )}
              </div>

              {/* Right actions */}
              <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-20">
                {/* More */}
                <div className="relative">
                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => setMoreMenuPost(moreMenuPost === post.id ? null : post.id)} data-testid={`more-btn-${idx}`}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <MoreVertical className="w-5 h-5 text-white/80" />
                    </div>
                  </motion.button>
                  <AnimatePresence>
                    {moreMenuPost === post.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute right-12 bottom-0 w-48 rounded-xl py-1 z-50" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }} data-testid={`more-menu-${idx}`}>
                        {(isAuthor(post) || isAdmin) ? (
                          <>
                            <button onClick={() => openEditModal(post)} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white hover:bg-white/5" data-testid="edit-post-btn">
                              <Pencil className="w-3.5 h-3.5 text-gray-400" /> Modifier ce post
                            </button>
                            <button onClick={() => openDeleteModal(post)} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10" data-testid="delete-post-btn">
                              <Trash2 className="w-3.5 h-3.5" /> Supprimer ce post
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleReport(post)} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white hover:bg-white/5" data-testid="report-post-btn">
                              <Flag className="w-3.5 h-3.5 text-gray-400" /> Signaler ce post
                            </button>
                            <button onClick={() => handleCopyLink(post)} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white hover:bg-white/5" data-testid="copy-link-btn">
                              <Link2 className="w-3.5 h-3.5 text-gray-400" /> Copier le lien
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Eclair */}
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleEclair(post.id)} disabled={eclairLoading === post.id} className="flex flex-col items-center gap-1" data-testid={`eclair-btn-${idx}`}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(242,202,80,0.3)' }}>
                    {eclairLoading === post.id ? <Loader2 className="w-5 h-5 animate-spin text-[#f2ca50]" /> : <Zap className="w-5 h-5" style={{ color: '#f2ca50' }} />}
                  </div>
                  <span className="text-[10px] text-white/70 font-bold">{formatCount(post.eclairs_count || post.likes_count)}</span>
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

          {/* Sentinel */}
          <div ref={sentinelRef} className="h-20 flex items-center justify-center lg:col-span-2">
            {loadingMore && <Loader2 className="w-5 h-5 animate-spin text-[#f2ca50]" />}
            {!hasMore && posts.length > 0 && <span className="text-xs text-gray-600">Fin du feed</span>}
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
        </aside>
      </div>

      {/* Scroll-to-top */}
      {activeIndex > 2 && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold" style={{ background: 'rgba(242,202,80,0.9)', color: 'black' }}>
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
              {commentsList.length === 0 && <p className="text-xs text-gray-600 text-center py-8">Aucun commentaire</p>}
              {commentsList.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <UserAvatar src={null} name={c.prenom || c.author_name || "?"} size={28} border={false} />
                  <div>
                    <span className="text-xs font-bold text-white">{c.prenom || c.author_name || 'Anonyme'}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{c.contenu || c.content}</p>
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
                <button onClick={() => setShowNewPost(false)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} placeholder="Partagez avec la communaute..." rows={4} className="w-full bg-white/5 text-sm px-4 py-3 rounded-xl outline-none text-white resize-none" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="new-post-textarea" />
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleNewPost} disabled={postingNew || !newPostContent.trim()} className="w-full mt-3 py-3 rounded-xl text-sm font-bold tracking-widest uppercase" style={{ background: postingNew || !newPostContent.trim() ? '#333' : '#f2ca50', color: postingNew ? '#999' : 'black' }} data-testid="new-post-submit-btn">
                {postingNew ? 'Publication...' : 'Publier'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-md rounded-2xl p-5" style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)' }} data-testid="edit-post-modal">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold tracking-wider uppercase" style={{ color: '#f2ca50' }}>Modifier ce post</span>
                <button onClick={() => setEditModal(null)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={5} className="w-full bg-white/5 text-sm px-4 py-3 rounded-xl outline-none text-white resize-none" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="edit-post-textarea" />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setEditModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>Annuler</button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleEdit} disabled={editLoading || !editContent.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2" style={{ background: '#f2ca50', color: 'black' }} data-testid="edit-post-save-btn">
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Enregistrer
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-sm rounded-2xl p-5" style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)' }} data-testid="delete-post-modal">
              <h3 className="text-sm font-bold text-white text-center mb-2">Supprimer ce post ?</h3>
              <p className="text-xs text-gray-500 text-center mb-5">Cette action est irreversible.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>Annuler</button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleDelete} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2" style={{ background: '#ef4444', color: 'white' }} data-testid="delete-post-confirm-btn">
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Supprimer
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-2.5 rounded-full text-sm font-bold" style={{ background: '#f2ca50', color: 'black' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
