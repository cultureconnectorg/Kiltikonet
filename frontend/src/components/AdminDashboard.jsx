import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { AdminLogin } from './AdminLogin';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  Download, LogOut, Users, Clock, CheckCircle, XCircle, Filter, 
  Globe, MapPin, Building2, Mic2, Newspaper, MoreHorizontal,
  TrendingUp, Calendar, Mail, RefreshCw, Search, Eye
} from 'lucide-react';
import { profileTypes } from '../lib/translations';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminDashboard = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [counts, setCounts] = useState({ total: 0, by_profile: {}, by_status: { pending: 0, approved: 0, rejected: 0 } });
  const [filters, setFilters] = useState({
    profile_type: '',
    country: '',
    stand_request: '',
    status: ''
  });
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [lastSync, setLastSync] = useState(new Date());
  
  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.profile_type) params.append('profile_type', filters.profile_type);
      if (filters.country) params.append('country', filters.country);
      if (filters.stand_request) params.append('stand_request', filters.stand_request);
      if (filters.status) params.append('status', filters.status);
      
      const response = await axios.get(`${API}/registrations?${params.toString()}`);
      setRegistrations(response.data.registrations);
      setCounts(response.data.counts);
      setLastSync(new Date());
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error(language === 'fr' ? 'Erreur lors du chargement' : 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  }, [filters, language]);
  
  const fetchCountries = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/countries`);
      setCountries(response.data.countries || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  }, []);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchRegistrations();
      fetchCountries();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchRegistrations, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchRegistrations, fetchCountries]);
  
  const handleStatusChange = async (registrationId, newStatus) => {
    try {
      await axios.patch(`${API}/registrations/${registrationId}/status`, { status: newStatus });
      toast.success(language === 'fr' ? 'Statut mis à jour' : 'Status updated');
      fetchRegistrations();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la mise à jour' : 'Error updating status');
    }
  };
  
  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${API}/registrations/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `registrations_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(language === 'fr' ? 'Export réussi' : 'Export successful');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error(language === 'fr' ? 'Erreur lors de l\'export' : 'Error exporting');
    }
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate('/');
  };
  
  const getProfileLabel = (value) => {
    const profile = profileTypes.find(p => p.value === value);
    return profile ? t(profile.labelKey) : value;
  };
  
  const getProfileIcon = (profileType) => {
    const icons = {
      'artist': Mic2,
      'label': Building2,
      'booking_agency': Globe,
      'institution': Building2,
      'press': Newspaper,
      'other': MoreHorizontal
    };
    return icons[profileType] || Users;
  };
  
  const getStatusLabel = (status) => {
    const labels = { pending: t('pending'), approved: t('approved'), rejected: t('rejected') };
    return labels[status] || status;
  };
  
  const filteredRegistrations = registrations.filter(reg => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      reg.full_name?.toLowerCase().includes(search) ||
      reg.organization_name?.toLowerCase().includes(search) ||
      reg.email?.toLowerCase().includes(search)
    );
  });
  
  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 sm:pt-24">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f1419] to-[#0a0a0f] pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 
              className="font-serif text-2xl sm:text-3xl lg:text-4xl text-white mb-2"
              data-testid="admin-dashboard-title"
            >
              Dashboard <span className="text-[#00d4ff]">Culture Connect</span>
            </h1>
            <div className="flex items-center gap-4 text-sm text-white/50">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3 h-3" />
                {language === 'fr' ? 'Dernière sync:' : 'Last sync:'} {lastSync.toLocaleTimeString()}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                {new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={fetchRegistrations}
              variant="outline"
              className="border-[#00d4ff]/30 text-[#00d4ff] hover:bg-[#00d4ff]/10"
              data-testid="refresh-button"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {language === 'fr' ? 'Actualiser' : 'Refresh'}
            </Button>
            <Button
              onClick={handleExportCSV}
              className="bg-[#00d4ff] text-[#0a0a0f] hover:bg-[#00d4ff]/80"
              data-testid="export-csv-button"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('exportCSV')}
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-white/20 text-white/60 hover:text-white hover:border-white/40"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('logout')}
            </Button>
          </div>
        </div>
        
        {/* Stats Cards - Glassmorphism style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div 
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 p-6"
            data-testid="stat-total"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#00d4ff]/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#00d4ff]/20 rounded-lg">
                  <Users className="w-5 h-5 text-[#00d4ff]" />
                </div>
                <span className="text-sm text-white/60">{t('totalRegistrations')}</span>
              </div>
              <p className="font-serif text-4xl text-white">{counts.total}</p>
              <p className="text-xs text-[#00d4ff] mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {language === 'fr' ? 'participants' : 'participants'}
              </p>
            </div>
          </div>
          
          <div 
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#D2A53C]/20 to-[#D2A53C]/5 backdrop-blur-xl border border-[#D2A53C]/20 p-6"
            data-testid="stat-pending"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#D2A53C]/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#D2A53C]/20 rounded-lg">
                  <Clock className="w-5 h-5 text-[#D2A53C]" />
                </div>
                <span className="text-sm text-white/60">{t('pending')}</span>
              </div>
              <p className="font-serif text-4xl text-[#D2A53C]">{counts.by_status?.pending || 0}</p>
              <p className="text-xs text-[#D2A53C]/70 mt-2">{language === 'fr' ? 'en attente' : 'waiting'}</p>
            </div>
          </div>
          
          <div 
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#4ADE80]/20 to-[#4ADE80]/5 backdrop-blur-xl border border-[#4ADE80]/20 p-6"
            data-testid="stat-approved"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#4ADE80]/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#4ADE80]/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-[#4ADE80]" />
                </div>
                <span className="text-sm text-white/60">{t('approved')}</span>
              </div>
              <p className="font-serif text-4xl text-[#4ADE80]">{counts.by_status?.approved || 0}</p>
              <p className="text-xs text-[#4ADE80]/70 mt-2">{language === 'fr' ? 'approuvés' : 'approved'}</p>
            </div>
          </div>
          
          <div 
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#F87171]/20 to-[#F87171]/5 backdrop-blur-xl border border-[#F87171]/20 p-6"
            data-testid="stat-rejected"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#F87171]/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#F87171]/20 rounded-lg">
                  <XCircle className="w-5 h-5 text-[#F87171]" />
                </div>
                <span className="text-sm text-white/60">{t('rejected')}</span>
              </div>
              <p className="font-serif text-4xl text-[#F87171]">{counts.by_status?.rejected || 0}</p>
              <p className="text-xs text-[#F87171]/70 mt-2">{language === 'fr' ? 'refusés' : 'rejected'}</p>
            </div>
          </div>
        </div>
        
        {/* Distribution by Profile - Mini cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {Object.entries(counts.by_profile || {}).map(([profile, count]) => {
            const IconComponent = getProfileIcon(profile);
            return (
              <div 
                key={profile}
                className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4 hover:border-[#00d4ff]/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className="w-4 h-4 text-[#00d4ff]" />
                  <span className="text-xs text-white/50 truncate">{getProfileLabel(profile)}</span>
                </div>
                <p className="text-2xl font-semibold text-white">{count}</p>
              </div>
            );
          })}
        </div>
        
        {/* Search and Filters */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="text"
                placeholder={language === 'fr' ? 'Rechercher par nom, organisation, email...' : 'Search by name, organization, email...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 focus:border-[#00d4ff]"
                data-testid="search-input"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select 
                value={filters.profile_type} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, profile_type: value === 'all' ? '' : value }))}
              >
                <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white h-10 focus:border-[#00d4ff]" data-testid="filter-profile-type">
                  <SelectValue placeholder={t('allProfiles')} />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="all" className="text-white hover:bg-white/10">{t('allProfiles')}</SelectItem>
                  {profileTypes.map((profile) => (
                    <SelectItem key={profile.value} value={profile.value} className="text-white hover:bg-white/10">
                      {t(profile.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}
              >
                <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white h-10 focus:border-[#00d4ff]" data-testid="filter-status">
                  <SelectValue placeholder={t('allStatuses')} />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="all" className="text-white hover:bg-white/10">{t('allStatuses')}</SelectItem>
                  <SelectItem value="pending" className="text-white hover:bg-white/10">{t('pending')}</SelectItem>
                  <SelectItem value="approved" className="text-white hover:bg-white/10">{t('approved')}</SelectItem>
                  <SelectItem value="rejected" className="text-white hover:bg-white/10">{t('rejected')}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.stand_request} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, stand_request: value === 'all' ? '' : value }))}
              >
                <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white h-10 focus:border-[#00d4ff]" data-testid="filter-stand">
                  <SelectValue placeholder={t('allStands')} />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="all" className="text-white hover:bg-white/10">{t('allStands')}</SelectItem>
                  <SelectItem value="true" className="text-white hover:bg-white/10">{t('withStand')}</SelectItem>
                  <SelectItem value="false" className="text-white hover:bg-white/10">{t('withoutStand')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Registrations Table */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table data-testid="registrations-table">
              <TableHeader>
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  <TableHead className="text-[#00d4ff] font-medium">{t('fullName')}</TableHead>
                  <TableHead className="text-[#00d4ff] font-medium">{t('organization')}</TableHead>
                  <TableHead className="text-[#00d4ff] font-medium">{t('profileType')}</TableHead>
                  <TableHead className="text-[#00d4ff] font-medium">Email</TableHead>
                  <TableHead className="text-[#00d4ff] font-medium">{t('stand')}</TableHead>
                  <TableHead className="text-[#00d4ff] font-medium">{t('status')}</TableHead>
                  <TableHead className="text-[#00d4ff] font-medium">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-white/60">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-white/60">
                      {t('noRegistrations')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((reg) => {
                    const IconComponent = getProfileIcon(reg.profile_type);
                    return (
                      <TableRow 
                        key={reg.id} 
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        data-testid={`registration-row-${reg.id}`}
                      >
                        <TableCell className="text-white font-medium">{reg.full_name}</TableCell>
                        <TableCell className="text-white/70">{reg.organization_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4 text-[#00d4ff]" />
                            <span className="text-white/70">{getProfileLabel(reg.profile_type)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <a href={`mailto:${reg.email}`} className="text-[#00d4ff] hover:underline flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {reg.email}
                          </a>
                        </TableCell>
                        <TableCell className="text-white/70">
                          {reg.stand_request ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#D2A53C]/20 text-[#D2A53C] rounded text-xs">
                              <MapPin className="w-3 h-3" />
                              {t('yes')}{reg.stand_category ? ` · ${reg.stand_category}` : ''}
                            </span>
                          ) : (
                            <span className="text-white/40">{t('no')}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`status-dot ${reg.status}`} data-testid={`status-dot-${reg.id}`} />
                            <span className="text-white/70">{getStatusLabel(reg.status)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={reg.status} 
                            onValueChange={(value) => handleStatusChange(reg.id, value)}
                          >
                            <SelectTrigger 
                              className="w-[120px] bg-white/5 border-white/10 text-white h-8 text-sm focus:border-[#00d4ff]"
                              data-testid={`status-select-${reg.id}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1a2e] border-white/10">
                              <SelectItem value="pending" className="text-[#D2A53C] hover:bg-white/10">{t('pending')}</SelectItem>
                              <SelectItem value="approved" className="text-[#4ADE80] hover:bg-white/10">{t('approved')}</SelectItem>
                              <SelectItem value="rejected" className="text-[#F87171] hover:bg-white/10">{t('rejected')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Table footer */}
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-white/50">
              {filteredRegistrations.length} {language === 'fr' ? 'inscription(s) affichée(s)' : 'registration(s) shown'}
            </p>
            <p className="text-xs text-white/30">
              {language === 'fr' ? 'Auto-actualisation: 30s' : 'Auto-refresh: 30s'}
            </p>
          </div>
        </div>
        
        {/* Email notification info */}
        <div className="mt-6 p-4 bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded-xl">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-[#00d4ff] mt-0.5" />
            <div>
              <p className="text-sm text-white/80">
                {language === 'fr' 
                  ? 'Les nouvelles inscriptions seront envoyées à:'
                  : 'New registrations will be sent to:'
                }
              </p>
              <p className="text-[#00d4ff] font-medium">cultureconnectorg@gmail.com</p>
              <p className="text-xs text-white/40 mt-1">
                {language === 'fr' 
                  ? '(Configuration email en attente - les données sont synchronisées en temps réel)'
                  : '(Email configuration pending - data is synced in real-time)'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
