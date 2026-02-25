import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { AdminLogin } from './AdminLogin';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Download, LogOut, Users, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
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
      link.setAttribute('download', 'registrations.csv');
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
  
  const getStatusLabel = (status) => {
    const labels = { pending: t('pending'), approved: t('approved'), rejected: t('rejected') };
    return labels[status] || status;
  };
  
  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }
  
  return (
    <div className="min-h-screen bg-[#0C0B09] pt-20 sm:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 
            className="font-serif text-2xl sm:text-3xl text-[#D2A53C]"
            data-testid="admin-dashboard-title"
          >
            {t('adminTitle')}
          </h1>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExportCSV}
              className="bg-[#D2A53C] text-[#0C0B09] hover:bg-[#E5B84D] hover:shadow-[0_0_20px_rgba(210,165,60,0.3)]"
              data-testid="export-csv-button"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('exportCSV')}
            </Button>
            
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-[#33312E] text-[#F5F5F0]/60 hover:text-[#D2A53C] hover:border-[#D2A53C]"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('logout')}
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div 
            className="bg-[#141311] border border-[#2A2825] p-4 sm:p-6"
            data-testid="stat-total"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-[#D2A53C]" />
              <span className="text-sm text-[#F5F5F0]/60">{t('totalRegistrations')}</span>
            </div>
            <p className="font-serif text-3xl text-[#F5F5F0]">{counts.total}</p>
          </div>
          
          <div 
            className="bg-[#141311] border border-[#2A2825] p-4 sm:p-6"
            data-testid="stat-pending"
          >
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-[#D2A53C]" />
              <span className="text-sm text-[#F5F5F0]/60">{t('pending')}</span>
            </div>
            <p className="font-serif text-3xl text-[#D2A53C]">{counts.by_status?.pending || 0}</p>
          </div>
          
          <div 
            className="bg-[#141311] border border-[#2A2825] p-4 sm:p-6"
            data-testid="stat-approved"
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-[#4ADE80]" />
              <span className="text-sm text-[#F5F5F0]/60">{t('approved')}</span>
            </div>
            <p className="font-serif text-3xl text-[#4ADE80]">{counts.by_status?.approved || 0}</p>
          </div>
          
          <div 
            className="bg-[#141311] border border-[#2A2825] p-4 sm:p-6"
            data-testid="stat-rejected"
          >
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-5 h-5 text-[#F87171]" />
              <span className="text-sm text-[#F5F5F0]/60">{t('rejected')}</span>
            </div>
            <p className="font-serif text-3xl text-[#F87171]">{counts.by_status?.rejected || 0}</p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-[#141311] border border-[#2A2825] p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-[#D2A53C]" />
            <span className="text-[#F5F5F0] font-medium">{t('filters')}</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Profile Type Filter */}
            <Select 
              value={filters.profile_type} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, profile_type: value === 'all' ? '' : value }))}
            >
              <SelectTrigger 
                className="bg-[#1A1917] border-[#33312E] text-white h-10 focus:border-[#D2A53C]"
                data-testid="filter-profile-type"
              >
                <SelectValue placeholder={t('allProfiles')} />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1917] border-[#33312E]">
                <SelectItem value="all" className="text-white hover:bg-[#2A2825]">
                  {t('allProfiles')}
                </SelectItem>
                {profileTypes.map((profile) => (
                  <SelectItem 
                    key={profile.value} 
                    value={profile.value}
                    className="text-white hover:bg-[#2A2825]"
                  >
                    {t(profile.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Country Filter */}
            <Select 
              value={filters.country} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, country: value === 'all' ? '' : value }))}
            >
              <SelectTrigger 
                className="bg-[#1A1917] border-[#33312E] text-white h-10 focus:border-[#D2A53C]"
                data-testid="filter-country"
              >
                <SelectValue placeholder={t('allCountries')} />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1917] border-[#33312E]">
                <SelectItem value="all" className="text-white hover:bg-[#2A2825]">
                  {t('allCountries')}
                </SelectItem>
                {countries.map((country) => (
                  <SelectItem 
                    key={country} 
                    value={country}
                    className="text-white hover:bg-[#2A2825]"
                  >
                    {t(`countries.${country}`) !== `countries.${country}` ? t(`countries.${country}`) : country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Stand Filter */}
            <Select 
              value={filters.stand_request} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, stand_request: value === 'all' ? '' : value }))}
            >
              <SelectTrigger 
                className="bg-[#1A1917] border-[#33312E] text-white h-10 focus:border-[#D2A53C]"
                data-testid="filter-stand"
              >
                <SelectValue placeholder={t('allStands')} />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1917] border-[#33312E]">
                <SelectItem value="all" className="text-white hover:bg-[#2A2825]">
                  {t('allStands')}
                </SelectItem>
                <SelectItem value="true" className="text-white hover:bg-[#2A2825]">
                  {t('withStand')}
                </SelectItem>
                <SelectItem value="false" className="text-white hover:bg-[#2A2825]">
                  {t('withoutStand')}
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Status Filter */}
            <Select 
              value={filters.status} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}
            >
              <SelectTrigger 
                className="bg-[#1A1917] border-[#33312E] text-white h-10 focus:border-[#D2A53C]"
                data-testid="filter-status"
              >
                <SelectValue placeholder={t('allStatuses')} />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1917] border-[#33312E]">
                <SelectItem value="all" className="text-white hover:bg-[#2A2825]">
                  {t('allStatuses')}
                </SelectItem>
                <SelectItem value="pending" className="text-white hover:bg-[#2A2825]">
                  {t('pending')}
                </SelectItem>
                <SelectItem value="approved" className="text-white hover:bg-[#2A2825]">
                  {t('approved')}
                </SelectItem>
                <SelectItem value="rejected" className="text-white hover:bg-[#2A2825]">
                  {t('rejected')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Registrations Table */}
        <div className="bg-[#141311] border border-[#2A2825] overflow-hidden">
          <div className="overflow-x-auto">
            <Table data-testid="registrations-table">
              <TableHeader>
                <TableRow className="border-b border-[#2A2825] hover:bg-transparent">
                  <TableHead className="text-[#D2A53C] font-medium">{t('fullName')}</TableHead>
                  <TableHead className="text-[#D2A53C] font-medium">{t('organization')}</TableHead>
                  <TableHead className="text-[#D2A53C] font-medium">{t('profileType')}</TableHead>
                  <TableHead className="text-[#D2A53C] font-medium">{t('country')}</TableHead>
                  <TableHead className="text-[#D2A53C] font-medium">{t('stand')}</TableHead>
                  <TableHead className="text-[#D2A53C] font-medium">{t('status')}</TableHead>
                  <TableHead className="text-[#D2A53C] font-medium">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-[#F5F5F0]/60">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-[#F5F5F0]/60">
                      {t('noRegistrations')}
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map((reg) => (
                    <TableRow 
                      key={reg.id} 
                      className="border-b border-[#2A2825] hover:bg-[#1A1917]"
                      data-testid={`registration-row-${reg.id}`}
                    >
                      <TableCell className="text-[#F5F5F0]">{reg.full_name}</TableCell>
                      <TableCell className="text-[#F5F5F0]/80">{reg.organization_name}</TableCell>
                      <TableCell className="text-[#F5F5F0]/80">{getProfileLabel(reg.profile_type)}</TableCell>
                      <TableCell className="text-[#F5F5F0]/80">
                        {t(`countries.${reg.country}`) !== `countries.${reg.country}` ? t(`countries.${reg.country}`) : reg.country}
                      </TableCell>
                      <TableCell className="text-[#F5F5F0]/80">
                        {reg.stand_request ? (
                          <span className="text-[#D2A53C]">{t('yes')}{reg.stand_category ? ` (${t(reg.stand_category)})` : ''}</span>
                        ) : (
                          <span className="text-[#F5F5F0]/50">{t('no')}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span 
                            className={`status-dot ${reg.status}`}
                            data-testid={`status-dot-${reg.id}`}
                          />
                          <span className="text-[#F5F5F0]/80">
                            {getStatusLabel(reg.status)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={reg.status} 
                          onValueChange={(value) => handleStatusChange(reg.id, value)}
                        >
                          <SelectTrigger 
                            className="w-32 bg-[#1A1917] border-[#33312E] text-white h-8 text-sm focus:border-[#D2A53C]"
                            data-testid={`status-select-${reg.id}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1917] border-[#33312E]">
                            <SelectItem value="pending" className="text-white hover:bg-[#2A2825]">
                              {t('pending')}
                            </SelectItem>
                            <SelectItem value="approved" className="text-white hover:bg-[#2A2825]">
                              {t('approved')}
                            </SelectItem>
                            <SelectItem value="rejected" className="text-white hover:bg-[#2A2825]">
                              {t('rejected')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};
