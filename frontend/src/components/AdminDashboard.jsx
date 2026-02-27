import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { AdminLogin } from './AdminLogin';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Download, LogOut, Users, Clock, CheckCircle, XCircle, 
  Search, Mail, MapPin, Building2, Calendar, X, RefreshCw,
  Mic2, Globe, Newspaper, MoreHorizontal, Trash2, BookOpen, Eye, EyeOff, Plus,
  BarChart3, TrendingUp, Map, PieChart, Tag, Sparkles, Handshake, FileDown,
  CheckSquare, Square, Send, History, AlertCircle, Loader2
} from 'lucide-react';
import { profileTypes, countryList, expertiseTags as expertiseTagsList } from '../lib/translations';
import axios from 'axios';
import { toast } from 'sonner';
import { PartnerManagement } from './PartnerManagement';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const API_V1 = `${BACKEND_URL}/api/v1`;

const profileIcons = {
  'artist': Mic2, 'label': Building2, 'booking_agency': Globe,
  'institution': Building2, 'press': Newspaper, 'other': MoreHorizontal
};

const placeholderImages = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
];

// Mini Bar Chart Component
const MiniBarChart = ({ data, maxValue, color = 'terracotta' }) => {
  const colorClasses = {
    terracotta: 'bg-terracotta',
    sage: 'bg-sage',
    charcoal: 'bg-charcoal'
  };
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((value, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div 
            className={`w-full ${colorClasses[color]} opacity-80 transition-all`}
            style={{ height: `${Math.max((value / maxValue) * 100, 4)}%` }}
          />
        </div>
      ))}
    </div>
  );
};

// Mini Donut/Pie representation
const MiniDonut = ({ segments, size = 48 }) => {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  let currentAngle = 0;
  
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      {segments.map((segment, i) => {
        const angle = total > 0 ? (segment.value / total) * 360 : 0;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;
        
        const start = polarToCartesian(16, 16, 12, startAngle);
        const end = polarToCartesian(16, 16, 12, endAngle);
        const largeArc = angle > 180 ? 1 : 0;
        
        const d = angle >= 360 
          ? `M 16 4 A 12 12 0 1 1 15.99 4` 
          : `M 16 16 L ${start.x} ${start.y} A 12 12 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
        
        return <path key={i} d={d} fill={segment.color} opacity="0.85" />;
      })}
      <circle cx="16" cy="16" r="6" fill="#F4F1EA" />
    </svg>
  );
};

const polarToCartesian = (cx, cy, r, angle) => {
  const rad = (angle - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

export const AdminDashboard = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [counts, setCounts] = useState({ total: 0, by_status: { pending: 0, approved: 0, rejected: 0 }, in_catalog: 0 });
  const [filters, setFilters] = useState({ profile_type: '', country: '', status: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReg, setSelectedReg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('registrations');
  const [exportFilters, setExportFilters] = useState({ expertiseTags: [], profileType: '' });
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);
  const [showEmailLogs, setShowEmailLogs] = useState(false);
  const [emailLogs, setEmailLogs] = useState([]);
  const [advancedStats, setAdvancedStats] = useState(null);
  const [newParticipant, setNewParticipant] = useState({
    full_name: '',
    organization_name: '',
    country: 'SN',
    email: '',
    phone: '',
    profile_type: 'artist',
    tier: 'professional',
    status: 'approved',
    show_in_catalog: true,
    bio: ''
  });
  
  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.profile_type) params.append('profile_type', filters.profile_type);
      if (filters.country) params.append('country', filters.country);
      if (filters.status) params.append('status', filters.status);
      
      const response = await axios.get(`${API}/registrations?${params.toString()}`);
      const regs = response.data.registrations.map((r, i) => ({
        ...r,
        image: r.logo_url || placeholderImages[i % placeholderImages.length],
        show_in_catalog: r.show_in_catalog || false
      }));
      setRegistrations(regs);
      
      // Calculate catalog count
      const inCatalog = regs.filter(r => r.show_in_catalog).length;
      setCounts({
        ...response.data.counts,
        in_catalog: inCatalog
      });
    } catch (error) {
      toast.error('Error loading data');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);
  
  // Fetch statistics from API v1
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_V1}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchRegistrations();
      fetchStats();
      const interval = setInterval(fetchRegistrations, 30000);
      const statsInterval = setInterval(fetchStats, 60000);
      return () => {
        clearInterval(interval);
        clearInterval(statsInterval);
      };
    }
  }, [isAuthenticated, fetchRegistrations, fetchStats]);
  
  const handleStatusChange = async (id, status) => {
    const statusLabels = {
      pending: language === 'fr' ? 'en attente' : 'pending',
      approved: language === 'fr' ? 'approuvé' : 'approved',
      rejected: language === 'fr' ? 'refusé' : 'rejected'
    };
    try {
      await axios.patch(`${API}/registrations/${id}/status`, { status });
      toast.success(
        language === 'fr' 
          ? `✓ Participant marqué comme ${statusLabels[status]}` 
          : `✓ Participant marked as ${statusLabels[status]}`
      );
      fetchRegistrations();
      if (selectedReg?.id === id) {
        setSelectedReg(prev => ({ ...prev, status }));
      }
    } catch (error) {
      toast.error(
        language === 'fr' 
          ? '✗ Impossible de modifier le statut. Veuillez réessayer.' 
          : '✗ Failed to update status. Please try again.'
      );
    }
  };

  const handleCatalogToggle = async (id, showInCatalog) => {
    try {
      await axios.patch(`${API}/registrations/${id}/catalog`, { show_in_catalog: showInCatalog });
      toast.success(language === 'fr' 
        ? (showInCatalog ? '✓ Profil ajouté au catalogue public' : '✓ Profil retiré du catalogue')
        : (showInCatalog ? '✓ Profile added to public catalog' : '✓ Profile removed from catalog')
      );
      fetchRegistrations();
      if (selectedReg?.id === id) {
        setSelectedReg(prev => ({ ...prev, show_in_catalog: showInCatalog }));
      }
    } catch (error) {
      toast.error(
        language === 'fr' 
          ? '✗ Impossible de modifier la visibilité catalogue. Veuillez réessayer.' 
          : '✗ Failed to update catalog visibility. Please try again.'
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'fr' ? 'Supprimer cette inscription ?' : 'Delete this registration?')) return;
    
    try {
      await axios.delete(`${API}/registrations/${id}`);
      toast.success(language === 'fr' ? '✓ Inscription supprimée avec succès' : '✓ Registration deleted successfully');
      setSelectedReg(null);
      fetchRegistrations();
    } catch (error) {
      toast.error(
        language === 'fr' 
          ? '✗ Impossible de supprimer l\'inscription. Veuillez réessayer.' 
          : '✗ Failed to delete registration. Please try again.'
      );
    }
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/registrations/manual`, newParticipant);
      toast.success(
        language === 'fr' 
          ? `✓ ${newParticipant.full_name} ajouté avec succès` 
          : `✓ ${newParticipant.full_name} added successfully`
      );
      setShowAddModal(false);
      setNewParticipant({
        full_name: '',
        organization_name: '',
        country: 'SN',
        email: '',
        phone: '',
        profile_type: 'artist',
        tier: 'professional',
        status: 'approved',
        show_in_catalog: true,
        bio: ''
      });
      fetchRegistrations();
    } catch (error) {
      toast.error(
        language === 'fr' 
          ? `✗ Impossible d'ajouter le participant. ${error.response?.data?.detail || 'Veuillez réessayer.'}` 
          : `✗ Failed to add participant. ${error.response?.data?.detail || 'Please try again.'}`
      );
    }
  };
  
  const getProfileLabel = (type) => {
    const labels = {
      artist: language === 'fr' ? 'Artiste' : 'Artist',
      label: 'Label',
      booking_agency: language === 'fr' ? 'Booking' : 'Booking',
      institution: 'Institution',
      press: language === 'fr' ? 'Presse' : 'Press',
      other: language === 'fr' ? 'Autre' : 'Other'
    };
    return labels[type] || type;
  };
  
  const handleExportCSV = async () => {
    try {
      toast.loading(language === 'fr' ? 'Génération de l\'export CSV...' : 'Generating CSV export...', { id: 'export' });
      const response = await axios.get(`${API}/registrations/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `registrations_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(
        language === 'fr' 
          ? '✓ Export CSV téléchargé avec succès' 
          : '✓ CSV export downloaded successfully', 
        { id: 'export' }
      );
    } catch (error) {
      toast.error(
        language === 'fr' 
          ? '✗ Échec de l\'export. Veuillez réessayer.' 
          : '✗ Export failed. Please try again.', 
        { id: 'export' }
      );
    }
  };

  // Batch selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRegs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRegs.map(r => r.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Batch approve handler
  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) {
      toast.error(language === 'fr' ? '⚠ Veuillez sélectionner au moins un participant' : '⚠ Please select at least one participant');
      return;
    }
    
    if (!window.confirm(t('confirmBatchApprove') || `${language === 'fr' ? 'Approuver' : 'Approve'} ${selectedIds.length} ${language === 'fr' ? 'participants ?' : 'participants?'}`)) return;
    
    setIsBatchProcessing(true);
    toast.loading(
      language === 'fr' 
        ? `Approbation de ${selectedIds.length} participant(s)...` 
        : `Approving ${selectedIds.length} participant(s)...`, 
      { id: 'batch-approve' }
    );
    try {
      const response = await axios.post(`${API}/registrations/batch/approve`, {
        registration_ids: selectedIds
      });
      
      toast.success(
        language === 'fr' 
          ? `✓ ${response.data.approved_count} participant(s) approuvé(s) avec succès` 
          : `✓ ${response.data.approved_count} participant(s) approved successfully`, 
        { id: 'batch-approve' }
      );
      setSelectedIds([]);
      fetchRegistrations();
      fetchStats();
    } catch (error) {
      toast.error(
        language === 'fr' 
          ? `✗ Échec de l'approbation. ${error.response?.data?.detail || 'Veuillez réessayer.'}` 
          : `✗ Approval failed. ${error.response?.data?.detail || 'Please try again.'}`, 
        { id: 'batch-approve' }
      );
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Batch send badges handler with progress tracking
  const handleBatchSendBadges = async (sendToAll = false) => {
    const idsToSend = sendToAll ? [] : selectedIds;
    
    if (!sendToAll && idsToSend.length === 0) {
      toast.error(language === 'fr' ? 'Aucun participant sélectionné' : 'No participants selected');
      return;
    }
    
    const confirmMsg = sendToAll 
      ? (language === 'fr' ? 'Envoyer les badges à TOUS les participants approuvés ?' : 'Send badges to ALL approved participants?')
      : `${language === 'fr' ? 'Envoyer les badges à' : 'Send badges to'} ${idsToSend.length} ${language === 'fr' ? 'participant(s) ?' : 'participant(s)?'}`;
    
    if (!window.confirm(confirmMsg)) return;
    
    setIsBatchProcessing(true);
    setBatchProgress({ status: 'starting', processed: 0, total: 0, sent: 0, failed: 0 });
    
    try {
      const response = await axios.post(`${API}/registrations/batch/send-badges`, {
        registration_ids: idsToSend
      });
      
      const jobId = response.data.job_id;
      const total = response.data.total;
      
      setBatchProgress({ status: 'running', processed: 0, total, sent: 0, failed: 0, jobId });
      
      // Poll for progress
      const pollProgress = async () => {
        try {
          const progressRes = await axios.get(`${API}/registrations/batch/progress/${jobId}`);
          const progress = progressRes.data;
          
          setBatchProgress({
            status: progress.status,
            processed: progress.processed,
            total: progress.total,
            sent: progress.sent,
            failed: progress.failed,
            percent: progress.progress_percent,
            jobId
          });
          
          if (progress.status !== 'completed') {
            setTimeout(pollProgress, 1000);
          } else {
            toast.success(`${progress.sent} ${t('badgesSent') || 'badges sent'}`);
            setSelectedIds([]);
            setIsBatchProcessing(false);
            fetchEmailLogs();
            // Keep progress visible for a moment
            setTimeout(() => setBatchProgress(null), 5000);
          }
        } catch (e) {
          console.error('Progress poll error:', e);
          setIsBatchProcessing(false);
          setBatchProgress(null);
        }
      };
      
      setTimeout(pollProgress, 500);
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error sending badges');
      setIsBatchProcessing(false);
      setBatchProgress(null);
    }
  };

  // Fetch email logs
  const fetchEmailLogs = async () => {
    try {
      const response = await axios.get(`${API}/email-logs?limit=50`);
      setEmailLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error fetching email logs:', error);
    }
  };

  // Fetch advanced stats
  const fetchAdvancedStats = async () => {
    try {
      const response = await axios.get(`${API_V1}/stats/advanced`);
      setAdvancedStats(response.data);
    } catch (error) {
      console.error('Error fetching advanced stats:', error);
    }
  };

  useEffect(() => {
    if (showEmailLogs && emailLogs.length === 0) {
      fetchEmailLogs();
    }
  }, [showEmailLogs]);

  useEffect(() => {
    if (showInsights) {
      fetchAdvancedStats();
    }
  }, [showInsights]);
  
  const getCountryLabel = (code) => {
    const c = countryList.find(x => x.value === code);
    return c ? (t(`countries.${c.labelKey}`) !== `countries.${c.labelKey}` ? t(`countries.${c.labelKey}`) : code) : code;
  };
  
  const filteredRegs = registrations.filter(r => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return r.full_name?.toLowerCase().includes(s) || r.organization_name?.toLowerCase().includes(s) || r.email?.toLowerCase().includes(s);
  });
  
  const StatusBadge = ({ status }) => {
    const config = {
      pending: { label: language === 'fr' ? 'En attente' : 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      approved: { label: language === 'fr' ? 'Approuvé' : 'Approved', bg: 'bg-sage/10', text: 'text-sage', border: 'border-sage/30' },
      rejected: { label: language === 'fr' ? 'Refusé' : 'Rejected', bg: 'bg-terracotta/10', text: 'text-terracotta', border: 'border-terracotta/30' }
    };
    const c = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status === 'pending' ? 'bg-amber-500' : status === 'approved' ? 'bg-sage' : 'bg-terracotta'}`} />
        {c.label}
      </span>
    );
  };
  
  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }
  
  return (
    <div className="min-h-screen bg-paper pt-20">
      <div className="flex h-[calc(100vh-5rem)]">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col overflow-hidden ${selectedReg ? 'lg:mr-[420px]' : ''}`}>
          {/* Header */}
          <div className="border-b border-lightborder bg-cream px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-serif text-2xl text-charcoal">
                  {language === 'fr' ? 'Gestion des accréditations' : 'Accreditation Management'}
                </h1>
                <p className="text-sm text-charcoal/50 mt-1">Culture Connect 2026</p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => setShowAddModal(true)} className="h-10 bg-sage text-paper font-syne text-sm rounded-none" data-testid="add-participant-button">
                  <Plus className="w-4 h-4 mr-2" /> {language === 'fr' ? 'Ajouter' : 'Add'}
                </Button>
                <Button onClick={fetchRegistrations} variant="outline" className="h-10 border-lightborder text-charcoal/70 hover:text-charcoal rounded-none">
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={handleExportCSV} className="h-10 bg-charcoal text-paper font-syne text-sm rounded-none" data-testid="export-csv-button">
                  <Download className="w-4 h-4 mr-2" /> CSV
                </Button>
                <Button onClick={() => { setIsAuthenticated(false); navigate('/'); }} variant="outline" className="h-10 border-lightborder text-charcoal/50 rounded-none" data-testid="logout-button">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="border-b border-lightborder bg-paper px-6 py-4">
            <div className="flex items-center gap-8 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-lightborder flex items-center justify-center">
                  <Users className="w-4 h-4 text-charcoal/60" />
                </div>
                <div>
                  <p className="text-2xl font-serif text-charcoal">{counts.total}</p>
                  <p className="text-xs text-charcoal/50">Total</p>
                </div>
              </div>
              <div className="h-8 w-px bg-lightborder" />
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-charcoal/70">{counts.by_status?.pending || 0} {language === 'fr' ? 'en attente' : 'pending'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-sage" />
                <span className="text-sm text-charcoal/70">{counts.by_status?.approved || 0} {language === 'fr' ? 'approuvés' : 'approved'}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-terracotta" />
                <span className="text-sm text-charcoal/70">{counts.by_status?.rejected || 0} {language === 'fr' ? 'refusés' : 'rejected'}</span>
              </div>
              <div className="h-8 w-px bg-lightborder" />
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sage" />
                <span className="text-sm text-charcoal/70">{counts.in_catalog || 0} {language === 'fr' ? 'au catalogue' : 'in catalog'}</span>
              </div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="border-b border-lightborder bg-paper px-6">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('registrations')}
                className={`px-4 py-3 text-sm font-syne border-b-2 transition-colors ${
                  activeTab === 'registrations'
                    ? 'border-terracotta text-terracotta'
                    : 'border-transparent text-charcoal/50 hover:text-charcoal'
                }`}
                data-testid="tab-registrations"
              >
                <Users className="w-4 h-4 inline mr-2" />
                {language === 'fr' ? 'Participants' : 'Registrations'}
              </button>
              <button
                onClick={() => setActiveTab('partners')}
                className={`px-4 py-3 text-sm font-syne border-b-2 transition-colors ${
                  activeTab === 'partners'
                    ? 'border-terracotta text-terracotta'
                    : 'border-transparent text-charcoal/50 hover:text-charcoal'
                }`}
                data-testid="tab-partners"
              >
                <Handshake className="w-4 h-4 inline mr-2" />
                {language === 'fr' ? 'Partenaires' : 'Partners'}
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="ml-auto px-4 py-3 text-sm font-syne text-charcoal/50 hover:text-terracotta transition-colors"
                data-testid="filtered-export-btn"
              >
                <FileDown className="w-4 h-4 inline mr-2" />
                {language === 'fr' ? 'Export ciblé' : 'Filtered Export'}
              </button>
            </div>
          </div>
          
          {activeTab === 'partners' ? (
            <div className="flex-1 overflow-auto p-6">
              <PartnerManagement />
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
          {/* Insights Section - Business Intelligence */}
          {stats && showInsights && (
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
                      segments={Object.entries(stats.by_profile_type || {}).map(([key, value], i) => ({
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
                      <span className="text-xs text-charcoal/60">Émergent</span>
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
                      {language === 'fr' ? 'Top 5 des Intérêts / Expertises' : 'Top 5 Interests / Expertise'}
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
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: colors[index % colors.length]
                              }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Marché Culturel highlight if present */}
                  {stats.by_expertise['marche_culturel'] && stats.by_expertise['marche_culturel'] > 0 && (
                    <div className="mt-3 flex items-center gap-2 p-2 bg-terracotta/5 border border-terracotta/20">
                      <span className="text-xs text-terracotta font-syne uppercase">Marché Culturel:</span>
                      <span className="text-sm text-charcoal font-medium">{stats.by_expertise['marche_culturel']}</span>
                      <span className="text-xs text-charcoal/50">
                        {language === 'fr' ? 'demandes de stand' : 'stand requests'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Partners summary if any */}
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
                    {/* Revenue Estimate */}
                    <div className="bg-sage/10 border border-sage/30 p-4">
                      <p className="text-xs text-sage uppercase mb-1">
                        {language === 'fr' ? 'Revenus estimés' : 'Estimated Revenue'}
                      </p>
                      <p className="text-2xl font-serif text-charcoal">
                        {advancedStats.kpis?.total_revenue_estimate?.toLocaleString() || 0}€
                      </p>
                    </div>
                    
                    {/* Badges Sent */}
                    <div className="bg-terracotta/10 border border-terracotta/30 p-4">
                      <p className="text-xs text-terracotta uppercase mb-1">
                        {language === 'fr' ? 'Badges envoyés' : 'Badges Sent'}
                      </p>
                      <p className="text-2xl font-serif text-charcoal">
                        {advancedStats.kpis?.badges_sent || 0}
                      </p>
                    </div>
                    
                    {/* Email Delivery Rate */}
                    <div className="bg-paper border border-lightborder p-4">
                      <p className="text-xs text-charcoal/50 uppercase mb-1">
                        {language === 'fr' ? 'Taux délivrabilité' : 'Delivery Rate'}
                      </p>
                      <p className="text-2xl font-serif text-charcoal">
                        {advancedStats.kpis?.email_delivery_rate || 100}%
                      </p>
                    </div>
                    
                    {/* Stand Requests */}
                    <div className="bg-paper border border-lightborder p-4">
                      <p className="text-xs text-charcoal/50 uppercase mb-1">
                        {language === 'fr' ? 'Demandes stand' : 'Stand Requests'}
                      </p>
                      <p className="text-2xl font-serif text-charcoal">
                        {advancedStats.marche_culturel?.stand_requests || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Toggle Insights Button (if hidden) */}
          {stats && !showInsights && (
            <div className="border-b border-lightborder bg-paper px-6 py-2">
              <button 
                onClick={() => setShowInsights(true)}
                className="flex items-center gap-2 text-xs text-charcoal/50 hover:text-terracotta transition-colors"
              >
                <BarChart3 className="w-3 h-3" />
                {language === 'fr' ? 'Afficher les insights' : 'Show insights'}
              </button>
            </div>
          )}
          
          {/* Filters */}
          <div className="border-b border-lightborder bg-paper px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                <Input placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 bg-cream border-lightborder rounded-none text-sm" />
              </div>
              <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-[130px] h-10 bg-cream border-lightborder rounded-none text-sm">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-paper border-lightborder">
                  <SelectItem value="all">{language === 'fr' ? 'Tous' : 'All'}</SelectItem>
                  <SelectItem value="pending">{language === 'fr' ? 'En attente' : 'Pending'}</SelectItem>
                  <SelectItem value="approved">{language === 'fr' ? 'Approuvé' : 'Approved'}</SelectItem>
                  <SelectItem value="rejected">{language === 'fr' ? 'Refusé' : 'Rejected'}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.profile_type} onValueChange={(v) => setFilters(prev => ({ ...prev, profile_type: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-[130px] h-10 bg-cream border-lightborder rounded-none text-sm">
                  <SelectValue placeholder="Profil" />
                </SelectTrigger>
                <SelectContent className="bg-paper border-lightborder">
                  <SelectItem value="all">{language === 'fr' ? 'Tous' : 'All'}</SelectItem>
                  {profileTypes.map(p => <SelectItem key={p.value} value={p.value}>{t(p.labelKey)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Table */}
          <div>
            {/* Batch Progress Bar */}
            {batchProgress && (
              <div className="sticky top-0 z-20 bg-charcoal text-paper px-6 py-4">
                <div className="flex items-center gap-4 mb-2">
                  {batchProgress.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-sage" />
                  ) : (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  )}
                  <span className="font-syne text-sm">
                    {batchProgress.status === 'completed' 
                      ? (language === 'fr' ? 'Envoi terminé !' : 'Sending complete!')
                      : (language === 'fr' ? 'Envoi des badges en cours...' : 'Sending badges...')
                    }
                  </span>
                  <span className="ml-auto text-sm">
                    {batchProgress.sent}/{batchProgress.total} {language === 'fr' ? 'envoyé(s)' : 'sent'}
                    {batchProgress.failed > 0 && (
                      <span className="text-terracotta ml-2">
                        ({batchProgress.failed} {language === 'fr' ? 'échec(s)' : 'failed'})
                      </span>
                    )}
                  </span>
                </div>
                <div className="w-full bg-paper/20 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sage transition-all duration-300"
                    style={{ width: `${batchProgress.percent || 0}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Batch Actions Bar */}
            {selectedIds.length > 0 && (
              <div className="sticky top-0 z-10 bg-terracotta/10 border-b border-terracotta/30 px-6 py-3 flex items-center gap-4">
                <span className="text-sm text-terracotta font-syne">
                  {selectedIds.length} {t('selected') || 'selected'}
                </span>
                <div className="flex-1" />
                <Button
                  onClick={handleBatchApprove}
                  disabled={isBatchProcessing}
                  className="h-8 bg-sage text-paper text-xs font-syne rounded-none"
                  data-testid="batch-approve-btn"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {t('approveSelected') || 'Approve selected'}
                </Button>
                <Button
                  onClick={() => handleBatchSendBadges(false)}
                  disabled={isBatchProcessing}
                  className="h-8 bg-terracotta text-paper text-xs font-syne rounded-none"
                  data-testid="batch-send-badges-btn"
                >
                  {isBatchProcessing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                  {t('sendBadgesToSelected') || 'Send badges'}
                </Button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-charcoal/50 hover:text-charcoal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* Send to All Approved Button + Email History */}
            {selectedIds.length === 0 && counts.by_status?.approved > 0 && (
              <div className="sticky top-0 z-10 bg-paper border-b border-lightborder px-6 py-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => { setShowEmailLogs(true); fetchEmailLogs(); }}
                  className="flex items-center gap-1 text-xs text-charcoal/50 hover:text-terracotta transition-colors"
                  data-testid="email-history-btn"
                >
                  <History className="w-3 h-3" />
                  {language === 'fr' ? 'Historique envois' : 'Send history'}
                </button>
                <Button
                  onClick={() => handleBatchSendBadges(true)}
                  disabled={isBatchProcessing}
                  variant="outline"
                  className="h-8 border-terracotta text-terracotta text-xs font-syne rounded-none hover:bg-terracotta/10"
                  data-testid="send-all-badges-btn"
                >
                  {isBatchProcessing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Mail className="w-3 h-3 mr-1" />}
                  {t('sendBadgesToAll') || 'Send badges to all approved'} ({counts.by_status?.approved || 0})
                </Button>
              </div>
            )}
            
            <table className="w-full" data-testid="registrations-table">
              <thead className="bg-cream border-b border-lightborder sticky top-0">
                <tr>
                  <th className="text-left py-3 px-3 text-xs font-medium text-charcoal/60">
                    <button onClick={toggleSelectAll} className="p-1 hover:bg-lightborder">
                      {selectedIds.length === filteredRegs.length && filteredRegs.length > 0 
                        ? <CheckSquare className="w-4 h-4 text-terracotta" />
                        : <Square className="w-4 h-4 text-charcoal/40" />
                      }
                    </button>
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-charcoal/60 uppercase tracking-wider">Participant</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-charcoal/60 uppercase tracking-wider">Organisation</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-charcoal/60 uppercase tracking-wider">Profil</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-charcoal/60 uppercase tracking-wider">Statut</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-charcoal/60 uppercase tracking-wider">Catalogue</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-charcoal/60 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lightborder">
                {filteredRegs.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-charcoal/50">{language === 'fr' ? 'Aucune inscription' : 'No registrations'}</td></tr>
                ) : (
                  filteredRegs.map((reg) => {
                    const Icon = profileIcons[reg.profile_type] || Users;
                    const isSelected = selectedIds.includes(reg.id);
                    return (
                      <tr key={reg.id} className={`hover:bg-cream/50 cursor-pointer transition-colors ${selectedReg?.id === reg.id ? 'bg-cream' : ''} ${isSelected ? 'bg-terracotta/5' : ''}`}
                        onClick={() => setSelectedReg(reg)} data-testid={`registration-row-${reg.id}`}>
                        <td className="py-4 px-3" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleSelectOne(reg.id)} className="p-1 hover:bg-lightborder">
                            {isSelected 
                              ? <CheckSquare className="w-4 h-4 text-terracotta" />
                              : <Square className="w-4 h-4 text-charcoal/40" />
                            }
                          </button>
                        </td>
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-3">
                            <img src={reg.image} alt="" className="w-10 h-10 object-cover" />
                            <div>
                              <p className="font-medium text-charcoal">{reg.full_name}</p>
                              <p className="text-xs text-charcoal/50">{reg.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-3 text-sm text-charcoal/70">{reg.organization_name}</td>
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-2 text-sm text-charcoal/70">
                            <Icon className="w-4 h-4 text-charcoal/40" />
                            {getProfileLabel(reg.profile_type)}
                          </div>
                        </td>
                        <td className="py-4 px-3"><StatusBadge status={reg.status} /></td>
                        <td className="py-4 px-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleCatalogToggle(reg.id, !reg.show_in_catalog)}
                            className={`p-2 border transition-colors ${reg.show_in_catalog 
                              ? 'border-sage bg-sage/10 text-sage' 
                              : 'border-lightborder text-charcoal/30 hover:border-sage hover:text-sage'}`}
                            title={reg.show_in_catalog ? 'Retirer du catalogue' : 'Ajouter au catalogue'}
                          >
                            {reg.show_in_catalog ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleStatusChange(reg.id, 'approved')}
                              className={`p-2 border transition-colors ${reg.status === 'approved' ? 'border-sage bg-sage/10 text-sage' : 'border-lightborder text-charcoal/40 hover:border-sage hover:text-sage'}`}>
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleStatusChange(reg.id, 'rejected')}
                              className={`p-2 border transition-colors ${reg.status === 'rejected' ? 'border-terracotta bg-terracotta/10 text-terracotta' : 'border-lightborder text-charcoal/40 hover:border-terracotta hover:text-terracotta'}`}>
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(reg.id)}
                              className="p-2 border border-lightborder text-charcoal/40 hover:border-[#C94040] hover:text-[#C94040] hover:bg-[#C94040]/10 transition-colors"
                              data-testid={`delete-btn-${reg.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
            </div>
          )}
        </div>
        
        {/* Detail Panel */}
        {selectedReg && (
          <div className="hidden lg:block fixed right-0 top-20 w-[420px] h-[calc(100vh-5rem)] border-l border-lightborder bg-cream overflow-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-2">{language === 'fr' ? 'Détail inscription' : 'Registration Detail'}</p>
                  <StatusBadge status={selectedReg.status} />
                </div>
                <button onClick={() => setSelectedReg(null)} className="p-2 hover:bg-paper transition-colors">
                  <X className="w-4 h-4 text-charcoal/50" />
                </button>
              </div>
              
              <div className="text-center mb-8">
                <img src={selectedReg.image} alt="" className="w-24 h-24 object-cover mx-auto mb-4" />
                <h2 className="font-serif text-xl text-charcoal mb-1">{selectedReg.full_name}</h2>
                <p className="text-charcoal/60">{selectedReg.organization_name}</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-charcoal/40" />
                  <a href={`mailto:${selectedReg.email}`} className="text-terracotta hover:underline">{selectedReg.email}</a>
                </div>
                <div className="flex items-center gap-3 text-sm text-charcoal/70">
                  <MapPin className="w-4 h-4 text-charcoal/40" />
                  {getCountryLabel(selectedReg.country)}
                </div>
                <div className="flex items-center gap-3 text-sm text-charcoal/70">
                  <Building2 className="w-4 h-4 text-charcoal/40" />
                  {getProfileLabel(selectedReg.profile_type)}
                </div>
                {selectedReg.stand_request && (
                  <div className="flex items-center gap-3 text-sm text-charcoal/70">
                    <Calendar className="w-4 h-4 text-charcoal/40" />
                    Stand: {selectedReg.stand_category || 'Oui'}
                  </div>
                )}
              </div>
              
              {selectedReg.bio && (
                <div className="mb-8">
                  <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-2">Bio</p>
                  <p className="text-sm text-charcoal/70 leading-relaxed">{selectedReg.bio}</p>
                </div>
              )}

              {/* Catalog Toggle */}
              <div className="mb-8 p-4 border border-lightborder bg-paper">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-charcoal">{language === 'fr' ? 'Visible au catalogue' : 'Visible in catalog'}</p>
                    <p className="text-xs text-charcoal/50">{language === 'fr' ? 'Afficher ce profil publiquement' : 'Show this profile publicly'}</p>
                  </div>
                  <button
                    onClick={() => handleCatalogToggle(selectedReg.id, !selectedReg.show_in_catalog)}
                    className={`px-4 py-2 text-sm font-syne transition-colors ${selectedReg.show_in_catalog 
                      ? 'bg-sage text-paper' 
                      : 'border border-lightborder text-charcoal/60 hover:border-sage'}`}
                  >
                    {selectedReg.show_in_catalog 
                      ? (language === 'fr' ? 'Visible' : 'Visible')
                      : (language === 'fr' ? 'Masqué' : 'Hidden')
                    }
                  </button>
                </div>
              </div>
              
              {/* Status Actions */}
              <div className="space-y-3 mb-6">
                <p className="text-xs text-charcoal/50 uppercase tracking-wider">{language === 'fr' ? 'Changer le statut' : 'Change status'}</p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleStatusChange(selectedReg.id, 'pending')}
                    className={`py-3 text-sm font-syne border transition-colors ${selectedReg.status === 'pending' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-lightborder text-charcoal/60 hover:border-amber-500'}`}>
                    {language === 'fr' ? 'Attente' : 'Pending'}
                  </button>
                  <button onClick={() => handleStatusChange(selectedReg.id, 'approved')}
                    className={`py-3 text-sm font-syne border transition-colors ${selectedReg.status === 'approved' ? 'border-sage bg-sage/10 text-sage' : 'border-lightborder text-charcoal/60 hover:border-sage'}`}>
                    {language === 'fr' ? 'Approuver' : 'Approve'}
                  </button>
                  <button onClick={() => handleStatusChange(selectedReg.id, 'rejected')}
                    className={`py-3 text-sm font-syne border transition-colors ${selectedReg.status === 'rejected' ? 'border-terracotta bg-terracotta/10 text-terracotta' : 'border-lightborder text-charcoal/60 hover:border-terracotta'}`}>
                    {language === 'fr' ? 'Refuser' : 'Reject'}
                  </button>
                </div>
              </div>

              {/* Delete */}
              <button onClick={() => handleDelete(selectedReg.id)}
                className="w-full py-3 text-sm font-syne border border-terracotta/30 text-terracotta hover:bg-terracotta/10 transition-colors">
                <Trash2 className="w-4 h-4 inline mr-2" />
                {language === 'fr' ? 'Supprimer cette inscription' : 'Delete this registration'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Participant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-paper w-full max-w-lg mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-lightborder">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl text-charcoal">
                  {language === 'fr' ? 'Ajouter un participant' : 'Add a participant'}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-cream transition-colors">
                  <X className="w-5 h-5 text-charcoal/50" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleAddParticipant} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                    {language === 'fr' ? 'Nom complet' : 'Full name'} *
                  </label>
                  <Input
                    required
                    value={newParticipant.full_name}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, full_name: e.target.value }))}
                    className="bg-cream border-lightborder rounded-none"
                    data-testid="add-participant-fullname"
                  />
                </div>
                <div>
                  <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                    Organisation *
                  </label>
                  <Input
                    required
                    value={newParticipant.organization_name}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, organization_name: e.target.value }))}
                    className="bg-cream border-lightborder rounded-none"
                    data-testid="add-participant-org"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">Email *</label>
                  <Input
                    type="email"
                    required
                    value={newParticipant.email}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-cream border-lightborder rounded-none"
                    data-testid="add-participant-email"
                  />
                </div>
                <div>
                  <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                    {language === 'fr' ? 'Téléphone' : 'Phone'} *
                  </label>
                  <Input
                    required
                    value={newParticipant.phone}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-cream border-lightborder rounded-none"
                    data-testid="add-participant-phone"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                    {language === 'fr' ? 'Pays' : 'Country'} *
                  </label>
                  <Select value={newParticipant.country} onValueChange={(v) => setNewParticipant(prev => ({ ...prev, country: v }))}>
                    <SelectTrigger className="bg-cream border-lightborder rounded-none" data-testid="add-participant-country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-paper border-lightborder max-h-60">
                      {countryList.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                    {language === 'fr' ? 'Type de profil' : 'Profile type'} *
                  </label>
                  <Select value={newParticipant.profile_type} onValueChange={(v) => setNewParticipant(prev => ({ ...prev, profile_type: v }))}>
                    <SelectTrigger className="bg-cream border-lightborder rounded-none" data-testid="add-participant-profile">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-paper border-lightborder">
                      {profileTypes.map(p => (
                        <SelectItem key={p.value} value={p.value}>{t(p.labelKey)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                    {language === 'fr' ? 'Formule' : 'Tier'}
                  </label>
                  <Select value={newParticipant.tier} onValueChange={(v) => setNewParticipant(prev => ({ ...prev, tier: v }))}>
                    <SelectTrigger className="bg-cream border-lightborder rounded-none" data-testid="add-participant-tier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-paper border-lightborder">
                      <SelectItem value="emerging">{language === 'fr' ? 'Émergent (50€)' : 'Emerging (50€)'}</SelectItem>
                      <SelectItem value="professional">{language === 'fr' ? 'Professionnel (150€)' : 'Professional (150€)'}</SelectItem>
                      <SelectItem value="institutional">{language === 'fr' ? 'Institutionnel (300€)' : 'Institutional (300€)'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">Statut</label>
                  <Select value={newParticipant.status} onValueChange={(v) => setNewParticipant(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger className="bg-cream border-lightborder rounded-none" data-testid="add-participant-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-paper border-lightborder">
                      <SelectItem value="pending">{language === 'fr' ? 'En attente' : 'Pending'}</SelectItem>
                      <SelectItem value="approved">{language === 'fr' ? 'Approuvé' : 'Approved'}</SelectItem>
                      <SelectItem value="rejected">{language === 'fr' ? 'Refusé' : 'Rejected'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newParticipant.show_in_catalog}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, show_in_catalog: e.target.checked }))}
                    className="w-4 h-4 accent-sage"
                    data-testid="add-participant-catalog"
                  />
                  <span className="text-sm text-charcoal">
                    {language === 'fr' ? 'Afficher dans le catalogue public' : 'Show in public catalog'}
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}
                  className="flex-1 h-11 border-lightborder text-charcoal rounded-none font-syne">
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button type="submit" className="flex-1 h-11 bg-sage text-paper rounded-none font-syne" data-testid="add-participant-submit">
                  {language === 'fr' ? 'Ajouter' : 'Add'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filtered Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80">
          <div className="bg-paper w-full max-w-md">
            <div className="p-5 border-b border-lightborder flex items-center justify-between">
              <h3 className="font-serif text-lg text-charcoal">
                {language === 'fr' ? 'Export ciblé' : 'Filtered Export'}
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-charcoal/50 hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                  {language === 'fr' ? 'Filtrer par profil' : 'Filter by profile'}
                </label>
                <Select 
                  value={exportFilters.profileType}
                  onValueChange={(v) => setExportFilters(prev => ({ ...prev, profileType: v === 'all' ? '' : v }))}
                >
                  <SelectTrigger className="rounded-none border-lightborder">
                    <SelectValue placeholder={language === 'fr' ? 'Tous les profils' : 'All profiles'} />
                  </SelectTrigger>
                  <SelectContent className="bg-paper border-lightborder">
                    <SelectItem value="all">{language === 'fr' ? 'Tous' : 'All'}</SelectItem>
                    {profileTypes.map(p => <SelectItem key={p.value} value={p.value}>{t(p.labelKey)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                  {language === 'fr' ? 'Filtrer par expertises' : 'Filter by expertise'}
                </label>
                <div className="flex flex-wrap gap-2 p-3 border border-lightborder bg-cream max-h-48 overflow-y-auto">
                  {expertiseTagsList.map((tag) => {
                    const isSelected = exportFilters.expertiseTags.includes(tag.value);
                    return (
                      <button
                        key={tag.value}
                        type="button"
                        onClick={() => {
                          setExportFilters(prev => ({
                            ...prev,
                            expertiseTags: isSelected
                              ? prev.expertiseTags.filter(t => t !== tag.value)
                              : [...prev.expertiseTags, tag.value]
                          }));
                        }}
                        className={`px-2 py-1 text-xs font-syne transition-all border ${
                          isSelected 
                            ? 'border-sage bg-sage text-paper' 
                            : 'border-lightborder bg-paper text-charcoal/70 hover:border-terracotta'
                        }`}
                      >
                        {language === 'fr' ? tag.labelFr : tag.labelEn}
                      </button>
                    );
                  })}
                </div>
                {exportFilters.expertiseTags.length > 0 && (
                  <p className="text-xs text-sage mt-2">
                    {exportFilters.expertiseTags.length} {language === 'fr' ? 'tag(s) sélectionné(s)' : 'tag(s) selected'}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setExportFilters({ expertiseTags: [], profileType: '' });
                    setShowExportModal(false);
                  }}
                  className="flex-1 h-11 border-lightborder text-charcoal rounded-none font-syne"
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button 
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (exportFilters.profileType) params.append('profile_type', exportFilters.profileType);
                    if (exportFilters.expertiseTags.length > 0) params.append('expertise_tags', exportFilters.expertiseTags.join(','));
                    window.open(`${API}/registrations/export/filtered?${params.toString()}`, '_blank');
                    setShowExportModal(false);
                  }}
                  className="flex-1 h-11 bg-terracotta text-paper rounded-none font-syne"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  {language === 'fr' ? 'Exporter CSV' : 'Export CSV'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email History Modal */}
      {showEmailLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80">
          <div className="bg-paper w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-lightborder flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-serif text-lg text-charcoal">
                  {language === 'fr' ? 'Historique des envois' : 'Send History'}
                </h3>
                <p className="text-xs text-charcoal/50">
                  {emailLogs.length} {language === 'fr' ? 'email(s) récent(s)' : 'recent email(s)'}
                </p>
              </div>
              <button onClick={() => setShowEmailLogs(false)} className="text-charcoal/50 hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-5">
              {emailLogs.length === 0 ? (
                <div className="text-center py-12 text-charcoal/50">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>{language === 'fr' ? 'Aucun envoi pour le moment' : 'No emails sent yet'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {emailLogs.map((log, idx) => (
                    <div key={log.id || idx} className={`flex items-center gap-3 p-3 border ${
                      log.status === 'sent' ? 'border-sage/30 bg-sage/5' : 'border-terracotta/30 bg-terracotta/5'
                    }`}>
                      {log.status === 'sent' ? (
                        <CheckCircle className="w-4 h-4 text-sage shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-terracotta shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-charcoal truncate">{log.recipient_name}</p>
                        <p className="text-xs text-charcoal/50 truncate">{log.recipient_email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs px-2 py-0.5 ${
                          log.email_type === 'badge' ? 'bg-terracotta/20 text-terracotta' : 'bg-sage/20 text-sage'
                        }`}>
                          {log.email_type}
                        </span>
                        <p className="text-xs text-charcoal/40 mt-1">
                          {new Date(log.sent_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-lightborder shrink-0 flex justify-end">
              <Button 
                onClick={() => setShowEmailLogs(false)}
                className="h-10 bg-charcoal text-paper rounded-none font-syne"
              >
                {language === 'fr' ? 'Fermer' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
