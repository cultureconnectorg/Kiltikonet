import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const POST_TYPE_ICONS = {
  insight: 'lightbulb', question: 'help', announcement: 'campaign',
  story: 'auto_stories', tip: 'school', debate: 'forum',
  video: 'play_circle', interview: 'mic', repost: 'repeat',
  institution: 'account_balance', extrait: 'auto_stories', default: 'article',
};
const POST_TYPE_LABELS = {
  debate: 'Debat', video: 'Video', interview: 'Interview',
  repost: 'Repost', institution: 'Institution', extrait: 'Extrait',
};
const POST_TYPE_COLORS = {
  debate: '#f87171', video: '#818cf8', interview: '#2DD4BF',
  repost: '#5B9BD5', institution: '#4A5D4E', extrait: '#C4714A',
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const d = (Date.now() - new Date(iso)) / 1000;
  if (d < 60) return "à l'instant";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  if (d < 604800) return `${Math.floor(d / 86400)}j`;
  return `${Math.floor(d / 604800)}sem`;
};

const PostSkeleton = () => (
  <div className="p-5 space-y-3" style={{ background: '#131314' }}>
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-full kn-skeleton-shimmer" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-32 rounded kn-skeleton-shimmer" />
        <div className="h-2.5 w-48 rounded kn-skeleton-shimmer" />
      </div>
    </div>
    <div className="h-3 w-full rounded kn-skeleton-shimmer" />
    <div className="h-3 w-3/4 rounded kn-skeleton-shimmer" />
    <div className="h-3 w-1/2 rounded kn-skeleton-shimmer" />
  </div>
);

const LinkedInFeed = ({ session, onOpenInbox }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proofOfLife, setProofOfLife] = useState(null);
  const [expandedPost, setExpandedPost] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const sentinelRef = useRef(null);

  const loadPosts = useCallback(async (pageNum = 0, append = false) => {
    try {
      const res = await axios.get(`${API}/pro/feed`, { params: { limit: 15, skip: pageNum * 15 } });
      const data = res.data;
      setPosts(prev => append ? [...prev, ...data.posts] : data.posts);
      setHasMore(data.has_more);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadPosts();
    // Proof of life
    axios.get(`${API}/growth/engine/proof-of-life`).then(r => setProofOfLife(r.data)).catch(() => {});
    const interval = setInterval(() => {
      axios.get(`${API}/growth/engine/proof-of-life`).then(r => setProofOfLife(r.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [loadPosts]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        const next = page + 1;
        setPage(next);
        loadPosts(next, true);
      }
    }, { threshold: 0.1 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, page, loadPosts]);

  const handleLike = async (postId) => {
    if (!session?.id) return;
    try {
      const res = await axios.post(`${API}/pro/feed/like`, { post_id: postId, user_id: session.id });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: res.data.likes_count, liked: res.data.action === 'liked' } : p));
    } catch { /* silent */ }
  };

  return (
    <div className="max-w-2xl mx-auto" data-testid="linkedin-feed">
      {/* Live Activity Bar */}
      {proofOfLife && (
        <div className="flex items-center justify-between px-5 py-2.5" style={{ background: 'rgba(232,213,160,0.03)', borderBottom: '1px solid rgba(75,70,59,0.08)' }}
          data-testid="proof-of-life">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#4ade80' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#4ade80' }} />
            </span>
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 600, color: '#72727a' }}>
              <strong style={{ color: '#e5e2e3' }}>{proofOfLife.online_now}</strong> en ligne
            </span>
            {proofOfLife.typing_now > 0 && (
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#555' }}>
                · {proofOfLife.typing_now} écrit{proofOfLife.typing_now > 1 ? 'vent' : ''}...
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 600, color: '#555' }}>
              +{proofOfLife.new_today} aujourd'hui
            </span>
          </div>
        </div>
      )}

      {/* Create Post Bar */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(75,70,59,0.08)' }} data-testid="create-post-bar">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(232,213,160,0.15), rgba(200,168,75,0.1))', border: '1px solid rgba(232,213,160,0.2)' }}>
          <span className="material-symbols-outlined" style={{ color: '#E8D5A0', fontSize: 18, fontVariationSettings: "'FILL' 1" }}>person</span>
        </div>
        <div className="flex-1 px-4 py-2.5 rounded-full cursor-pointer hover:bg-white/[0.02] transition-colors"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(75,70,59,0.12)' }}>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: '#555' }}>
            Partager une perspective culturelle...
          </span>
        </div>
        <button className="p-2 rounded-lg hover:bg-white/[0.03] transition-colors" style={{ color: '#E8D5A0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>image</span>
        </button>
      </div>

      {/* Posts */}
      {loading ? (
        <div>{[1,2,3].map(i => <PostSkeleton key={i} />)}</div>
      ) : posts.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#2a2a2b' }}>dynamic_feed</span>
          <p className="mt-3" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, color: '#555' }}>Le feed se prépare...</p>
        </div>
      ) : (
        <div>
          {posts.map((post, idx) => (
            <article key={post.id} className="fade-slide-in"
              style={{ borderBottom: '1px solid rgba(75,70,59,0.06)', animationDelay: `${Math.min(idx, 5) * 50}ms` }}
              data-testid={`feed-post-${post.id}`}>
              <div className="px-5 pt-4 pb-3">
                {/* Author */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, rgba(232,213,160,0.12), rgba(200,168,75,0.08))', border: '1px solid rgba(232,213,160,0.15)' }}>
                    {post.author_image ? (
                      <img
                        src={post.author_image}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
                      />
                    ) : null}
                    <span
                      className="material-symbols-outlined"
                      style={{ color: '#E8D5A0', fontSize: 18, display: post.author_image ? 'none' : 'flex' }}
                    >person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>{post.author_name}</span>
                      {post.is_ghost && <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#E8D5A0', fontVariationSettings: "'FILL' 1" }}>verified</span>}
                    </div>
                    <p className="truncate" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, color: '#72727a', lineHeight: 1.3 }}>{post.author_title}</p>
                    <div className="flex items-center gap-1">
                      <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: '#555' }}>{timeAgo(post.created_at)}</span>
                      <span style={{ color: '#555', fontSize: 10 }}>·</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 10, color: '#555' }}>public</span>
                    </div>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#555' }}>more_horiz</span>
                  </button>
                </div>

                {/* Content */}
                <div className="mt-3">
                  {/* Post type badge for special types */}
                  {POST_TYPE_LABELS[post.post_type] && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mb-2"
                      style={{ background: `${POST_TYPE_COLORS[post.post_type] || '#555'}15`, border: `1px solid ${POST_TYPE_COLORS[post.post_type] || '#555'}25` }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 11, color: POST_TYPE_COLORS[post.post_type] || '#555' }}>
                        {POST_TYPE_ICONS[post.post_type] || 'article'}
                      </span>
                      <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, fontWeight: 700, color: POST_TYPE_COLORS[post.post_type] || '#555', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {POST_TYPE_LABELS[post.post_type]}
                      </span>
                    </span>
                  )}

                  <p style={{
                    fontFamily: "'Manrope', sans-serif", fontSize: 13, lineHeight: 1.65, color: '#ccc',
                    whiteSpace: 'pre-line',
                    display: expandedPost === post.id ? 'block' : '-webkit-box',
                    WebkitLineClamp: expandedPost === post.id ? 'unset' : 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: expandedPost === post.id ? 'visible' : 'hidden',
                  }}>
                    {post.content}
                  </p>
                  {post.content.length > 200 && expandedPost !== post.id && (
                    <button onClick={() => setExpandedPost(post.id)}
                      style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, fontWeight: 700, color: '#E8D5A0', marginTop: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                      ...voir plus
                    </button>
                  )}

                  {/* Thumbnail for video/interview/extrait posts */}
                  {post.thumbnail_url && (
                    <div className="mt-3 rounded-xl overflow-hidden relative cursor-pointer group" data-testid={`post-thumbnail-${post.id}`}>
                      <img
                        src={post.thumbnail_url}
                        alt=""
                        className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                        style={{ filter: 'brightness(0.8)' }}
                        onError={(e) => { e.target.onerror = null; e.target.closest('[data-testid]')?.style.setProperty('display', 'none'); }}
                      />
                      {post.video_url && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '2px solid rgba(232,213,160,0.3)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#E8D5A0', fontVariationSettings: "'FILL' 1", marginLeft: 2 }}>play_arrow</span>
                          </div>
                        </div>
                      )}
                      {post.post_type === 'interview' && !post.video_url && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#2DD4BF' }}>mic</span>
                          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, color: '#e5e2e3' }}>Interview exclusive</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Engagement Stats */}
                <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: '1px solid rgba(75,70,59,0.06)' }}>
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#E8D5A0', border: '1px solid #0a0a0b' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 8, color: '#3a2f09', fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                      </span>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#ef4444', border: '1px solid #0a0a0b' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 8, color: '#fff', fontVariationSettings: "'FILL' 1" }}>favorite</span>
                      </span>
                    </div>
                    <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, color: '#72727a', marginLeft: 4 }}>{post.likes_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, color: '#72727a' }}>{post.comments_count || 0} commentaire{(post.comments_count || 0) > 1 ? 's' : ''}</span>
                    <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, color: '#72727a' }}>{post.shares_count || 0} partage{(post.shares_count || 0) > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Action Bar — LinkedIn style */}
                <div className="flex items-center justify-around mt-1 -mx-1 pt-1" style={{ borderTop: '1px solid rgba(75,70,59,0.06)' }}>
                  {[
                    { icon: 'thumb_up', label: "J'aime", action: () => handleLike(post.id), active: post.liked },
                    { icon: 'chat_bubble', label: 'Commenter' },
                    { icon: 'repeat', label: 'Republier' },
                    { icon: 'send', label: 'Envoyer' },
                  ].map(btn => (
                    <button key={btn.label} onClick={btn.action}
                      className="flex items-center gap-1.5 py-2.5 px-3 rounded-lg hover:bg-white/[0.03] transition-all active:scale-95"
                      data-testid={`post-${btn.label.toLowerCase()}-${post.id}`}>
                      <span className="material-symbols-outlined" style={{
                        fontSize: 18,
                        color: btn.active ? '#E8D5A0' : '#72727a',
                        fontVariationSettings: btn.active ? "'FILL' 1" : "'FILL' 0",
                      }}>{btn.icon}</span>
                      <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 600, color: btn.active ? '#E8D5A0' : '#72727a' }}>{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
          {hasMore && <div ref={sentinelRef} className="py-4"><PostSkeleton /></div>}
        </div>
      )}
    </div>
  );
};

export default LinkedInFeed;
