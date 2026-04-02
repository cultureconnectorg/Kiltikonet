import React from 'react';
import {
  BarChart3, TrendingUp, Map, PieChart, Tag, Sparkles, Users, X
} from 'lucide-react';

const MiniDonut = ({ segments, size = 48 }) => {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  let cumulative = 0;

  const polarToCartesian = (cx2, cy2, r2, angle) => ({
    x: cx2 + r2 * Math.cos((angle - 90) * Math.PI / 180),
    y: cy2 + r2 * Math.sin((angle - 90) * Math.PI / 180)
  });

  return (
    <svg width={size} height={size}>
      {segments.map((seg, i) => {
        const startAngle = (cumulative / total) * 360;
        const sliceAngle = (seg.value / total) * 360;
        cumulative += seg.value;
        const endAngle = startAngle + sliceAngle;
        if (sliceAngle === 0) return null;
        if (sliceAngle >= 359.99) {
          return <circle key={`seg-${i}`} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="6" />;
        }
        const start = polarToCartesian(cx, cy, r, startAngle);
        const end = polarToCartesian(cx, cy, r, endAngle);
        const largeArc = sliceAngle > 180 ? 1 : 0;
        return (
          <path
            key={`seg-${i}`}
            d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
            fill="none" stroke={seg.color} strokeWidth="6"
          />
        );
      })}
    </svg>
  );
};

const AdminInsightsPanel = ({
  stats,
  advancedStats,
  showInsights,
  setShowInsights,
  language,
  getProfileLabel,
  API_V1
}) => {
  if (!stats || !showInsights) return null;

  return (
    <div className="border-b border-lightborder bg-cream px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-terracotta" />
          <h3 className="text-sm font-syne text-charcoal uppercase tracking-wider">
            {language === 'fr' ? 'Insights Management' : 'Management Insights'}
          </h3>
        </div>
        <button onClick={() => setShowInsights(false)} className="text-charcoal/40 hover:text-charcoal">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Conversion Rates */}
        <div className="bg-paper border border-lightborder p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-sage" />
            <span className="text-xs text-charcoal/50 uppercase">
              {language === 'fr' ? 'Taux de conversion' : 'Conversion Rates'}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-charcoal/60">{language === 'fr' ? 'Inscription → Approbation' : 'Registration → Approval'}</span>
              <span className="text-lg font-serif text-sage">{stats.conversion_rates?.registration_to_approval_percent || 0}%</span>
            </div>
            <div className="w-full bg-lightborder h-1.5">
              <div className="bg-sage h-1.5" style={{ width: `${stats.conversion_rates?.registration_to_approval_percent || 0}%` }} />
            </div>
          </div>
        </div>
        
        {/* Profile Distribution */}
        <div className="bg-paper border border-lightborder p-4">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-4 h-4 text-terracotta" />
            <span className="text-xs text-charcoal/50 uppercase">
              {language === 'fr' ? 'Par profil' : 'By Profile'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <MiniDonut 
              segments={Object.entries(stats.by_profile_type || {}).map(([, value], i) => ({
                value,
                color: ['#A65D47', '#4A5D4E', '#1A1A1A', '#8B7355', '#6B8E7B'][i % 5]
              }))}
            />
            <div className="flex-1 space-y-1">
              {Object.entries(stats.by_profile_type || {}).slice(0, 3).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-charcoal/60 truncate">{getProfileLabel(key)}</span>
                  <span className="text-charcoal font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Geographic Distribution */}
        <div className="bg-paper border border-lightborder p-4">
          <div className="flex items-center gap-2 mb-3">
            <Map className="w-4 h-4 text-terracotta" />
            <span className="text-xs text-charcoal/50 uppercase">
              {language === 'fr' ? 'Territoires' : 'Territories'}
            </span>
          </div>
          <div className="space-y-1.5">
            {Object.entries(stats.by_country || {}).slice(0, 4).map(([country, count]) => (
              <div key={country} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-charcoal/60">{country}</span>
                    <span className="text-charcoal">{count}</span>
                  </div>
                  <div className="w-full bg-lightborder h-1">
                    <div 
                      className="bg-terracotta/70 h-1" 
                      style={{ width: `${Math.min((count / (stats.summary?.total_registrations || 1)) * 100, 100)}%` }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Tier Distribution */}
        <div className="bg-paper border border-lightborder p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-sage" />
            <span className="text-xs text-charcoal/50 uppercase">
              {language === 'fr' ? 'Par formule' : 'By Tier'}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-charcoal/60">Emergent</span>
              <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700">{stats.by_tier?.emerging || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-charcoal/60">Professionnel</span>
              <span className="text-xs px-2 py-0.5 bg-sage/10 text-sage">{stats.by_tier?.professional || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-charcoal/60">Institutionnel</span>
              <span className="text-xs px-2 py-0.5 bg-terracotta/10 text-terracotta">{stats.by_tier?.institutional || 0}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Top 5 Interests / Expertise Tags */}
      {stats.by_expertise && Object.keys(stats.by_expertise).length > 0 && (
        <div className="col-span-2 lg:col-span-4 mt-4 pt-4 border-t border-lightborder">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-terracotta" />
            <span className="text-xs text-charcoal/50 uppercase font-syne">
              {language === 'fr' ? 'Top 5 des Interets / Expertises' : 'Top 5 Interests / Expertise'}
            </span>
            <Sparkles className="w-3 h-3 text-sage ml-auto" />
          </div>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(stats.by_expertise).slice(0, 5).map(([tag, count], index) => {
              const maxCount = Math.max(...Object.values(stats.by_expertise));
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
              const colors = ['#A65D47', '#4A5D4E', '#1A1A1A', '#8B7355', '#6B8E7B'];
              return (
                <div key={tag} className="bg-paper border border-lightborder p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-charcoal/60 truncate capitalize">
                      {tag.replace(/_/g, ' ')}
                    </span>
                    <span className="text-lg font-serif text-charcoal">{count}</span>
                  </div>
                  <div className="w-full bg-lightborder h-2">
                    <div 
                      className="h-2 transition-all" 
                      style={{ width: `${percentage}%`, backgroundColor: colors[index % colors.length] }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {stats.by_expertise['marche_culturel'] && stats.by_expertise['marche_culturel'] > 0 && (
            <div className="mt-3 flex items-center gap-2 p-2 bg-terracotta/5 border border-terracotta/20">
              <span className="text-xs text-terracotta font-syne uppercase">Marche Culturel:</span>
              <span className="text-sm text-charcoal font-medium">{stats.by_expertise['marche_culturel']}</span>
              <span className="text-xs text-charcoal/50">
                {language === 'fr' ? 'demandes de stand' : 'stand requests'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Partners summary */}
      {stats.partners?.total > 0 && (
        <div className="mt-4 pt-4 border-t border-lightborder flex items-center gap-6">
          <span className="text-xs text-charcoal/50 uppercase">{language === 'fr' ? 'Partenaires' : 'Partners'}:</span>
          <span className="text-sm text-charcoal">{stats.partners.total} total</span>
          <span className="text-xs text-charcoal/50">
            Bronze: {stats.partners.by_tier?.bronze || 0} · 
            Silver: {stats.partners.by_tier?.silver || 0} · 
            Gold: {stats.partners.by_tier?.gold || 0}
          </span>
        </div>
      )}

      {/* Advanced Stats - Revenue Estimates */}
      {advancedStats && (
        <div className="mt-4 pt-4 border-t border-lightborder">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-sage" />
            <span className="text-xs text-charcoal/50 uppercase font-syne">
              {language === 'fr' ? 'Rapport partenaires' : 'Partner Report'}
            </span>
            <button 
              onClick={() => window.open(`${API_V1}/report/summary`, '_blank')}
              className="ml-auto text-xs text-terracotta hover:underline"
            >
              {language === 'fr' ? 'Voir rapport complet' : 'View full report'}
            </button>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-sage/10 border border-sage/30 p-4">
              <p className="text-xs text-sage uppercase mb-1">{language === 'fr' ? 'Revenus estimes' : 'Estimated Revenue'}</p>
              <p className="text-2xl font-serif text-charcoal">{advancedStats.kpis?.total_revenue_estimate?.toLocaleString() || 0}€</p>
            </div>
            <div className="bg-terracotta/10 border border-terracotta/30 p-4">
              <p className="text-xs text-terracotta uppercase mb-1">{language === 'fr' ? 'Badges envoyes' : 'Badges Sent'}</p>
              <p className="text-2xl font-serif text-charcoal">{advancedStats.kpis?.badges_sent || 0}</p>
            </div>
            <div className="bg-paper border border-lightborder p-4">
              <p className="text-xs text-charcoal/50 uppercase mb-1">{language === 'fr' ? 'Taux delivrabilite' : 'Delivery Rate'}</p>
              <p className="text-2xl font-serif text-charcoal">{advancedStats.kpis?.email_delivery_rate || 100}%</p>
            </div>
            <div className="bg-paper border border-lightborder p-4">
              <p className="text-xs text-charcoal/50 uppercase mb-1">{language === 'fr' ? 'Demandes stand' : 'Stand Requests'}</p>
              <p className="text-2xl font-serif text-charcoal">{advancedStats.marche_culturel?.stand_requests || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInsightsPanel;
