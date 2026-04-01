import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FileDown, Search, ChevronDown, Users, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_CONFIG = {
  recue: { label: 'Recue', color: '#3498DB', bg: 'bg-blue-100 text-blue-800' },
  en_instruction: { label: 'En instruction', color: '#E67E22', bg: 'bg-orange-100 text-orange-800' },
  retenue: { label: 'Retenue', color: '#2ECC71', bg: 'bg-green-100 text-green-800' },
  refusee: { label: 'Refusee', color: '#E74C3C', bg: 'bg-red-100 text-red-800' },
};

const CandidaturesAdmin = () => {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState(null);

  const fetchCandidatures = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const { data } = await axios.get(`${API}/candidatures/cc2026${params}`);
      setCandidatures(data.candidatures || []);
    } catch { /* silent */ }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchCandidatures(); }, [fetchCandidatures]);

  const changeStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API}/candidatures/cc2026/${id}/status?status=${newStatus}`);
      setCandidatures(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch { /* silent */ }
  };

  const exportCSV = () => {
    window.open(`${API}/candidatures/cc2026/export`, '_blank');
  };

  const filtered = candidatures.filter(c => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return c.nom_complet?.toLowerCase().includes(q) ||
           c.email?.toLowerCase().includes(q) ||
           c.nom_projet?.toLowerCase().includes(q) ||
           c.territoire?.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 sm:p-6 space-y-4" data-testid="candidatures-admin">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1A1A1A]">Candidatures CC2026</h2>
          <p className="text-sm text-[#888]">{filtered.length} candidature{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCandidatures} className="p-2 rounded hover:bg-gray-100" data-testid="candidatures-refresh">
            <RefreshCw size={14} className="text-[#888]" />
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-[#4A3AB7] text-white rounded text-xs hover:bg-[#3a2d96]" data-testid="candidatures-export-csv">
            <FileDown size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#999]" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-[#ddd] rounded text-sm"
            placeholder="Rechercher nom, email, projet..."
            data-testid="candidatures-search"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-[#ddd] rounded text-sm"
          data-testid="candidatures-status-filter"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[#4A3AB7]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-[#999]">
          <Users size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aucune candidature</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#eee] overflow-hidden">
          {/* Header row */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#FAFAFA] border-b text-xs font-bold text-[#888] uppercase">
            <div className="col-span-2">Nom</div>
            <div className="col-span-2">Projet</div>
            <div className="col-span-1">Profil</div>
            <div className="col-span-2">Territoire</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Statut</div>
            <div className="col-span-2">Action</div>
          </div>
          {filtered.map((c, i) => (
            <div key={c.id} className="border-b border-[#f5f5f5] last:border-0">
              <div
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-4 py-3 cursor-pointer hover:bg-[#FAFAFA] transition-colors items-center"
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                data-testid={`candidature-row-${i}`}
              >
                <div className="col-span-2">
                  <p className="text-sm font-medium text-[#1A1A1A]">{c.nom_complet}</p>
                  <p className="text-xs text-[#999]">{c.email}</p>
                </div>
                <div className="col-span-2 text-sm text-[#444] truncate">{c.nom_projet}</div>
                <div className="col-span-1 text-xs text-[#666]">{c.profil}</div>
                <div className="col-span-2 text-xs text-[#666]">{c.territoire}</div>
                <div className="col-span-2 text-xs text-[#888]">{new Date(c.created_at).toLocaleDateString('fr-FR')}</div>
                <div className="col-span-1">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_CONFIG[c.status]?.bg || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_CONFIG[c.status]?.label || c.status}
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-1">
                  <select
                    value={c.status}
                    onChange={e => { e.stopPropagation(); changeStatus(c.id, e.target.value); }}
                    onClick={e => e.stopPropagation()}
                    className="text-xs border border-[#ddd] rounded px-1.5 py-1"
                    data-testid={`candidature-status-${i}`}
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className={`text-[#999] transition-transform ${expanded === c.id ? 'rotate-180' : ''}`} />
                </div>
              </div>
              {/* Expanded details */}
              {expanded === c.id && (
                <div className="px-4 pb-4 bg-[#FAFAFA] border-t border-[#eee]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                    <div>
                      <p className="text-xs font-bold text-[#666] mb-1">Description du projet</p>
                      <p className="text-sm text-[#444] leading-relaxed whitespace-pre-wrap">{c.description_projet}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#666] mb-1">Impact culturel</p>
                      <p className="text-sm text-[#444] leading-relaxed whitespace-pre-wrap">{c.impact_culturel}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    <div><span className="text-xs text-[#888]">Organisation</span><p className="text-sm text-[#444]">{c.organisation || 'N/A'}</p></div>
                    <div><span className="text-xs text-[#888]">Format</span><p className="text-sm text-[#444]">{c.format_souhaite}</p></div>
                    <div><span className="text-xs text-[#888]">Lien</span>{c.lien_web ? <a href={c.lien_web} target="_blank" rel="noopener noreferrer" className="text-sm text-[#4A3AB7] underline">{c.lien_web}</a> : <p className="text-sm text-[#999]">N/A</p>}</div>
                    <div><span className="text-xs text-[#888]">Reference</span><p className="text-sm font-mono text-[#4A3AB7]">{c.id}</p></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidaturesAdmin;
