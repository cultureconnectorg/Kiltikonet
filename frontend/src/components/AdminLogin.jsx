import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Lock, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminLogin = ({ onLogin }) => {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);
    
    try {
      const response = await axios.post(`${API}/admin/verify`, { password });
      if (response.data.success) {
        onLogin();
      }
    } catch (err) {
      setError(true);
      toast.error(t('invalidPassword'));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 sm:pt-24 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 p-8 sm:p-10"
          data-testid="admin-login-card"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d4ff]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D2A53C]/10 rounded-full blur-3xl" />
          
          <div className="relative">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#00d4ff]/20 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-[#00d4ff]" />
              </div>
            </div>
            
            <h1 
              className="font-serif text-2xl sm:text-3xl text-white text-center mb-2"
              data-testid="admin-login-title"
            >
              Dashboard <span className="text-[#00d4ff]">Admin</span>
            </h1>
            <p className="text-white/50 text-center text-sm mb-8">Culture Connect 2026</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/70">
                  {t('password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  className={`bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] ${error ? 'border-red-500' : ''}`}
                  data-testid="admin-password-input"
                />
                {error && (
                  <p className="text-sm text-red-400" data-testid="admin-error-message">
                    {t('invalidPassword')}
                  </p>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={isLoading || !password}
                className="w-full h-12 bg-[#00d4ff] text-[#0a0a0f] font-semibold hover:bg-[#00d4ff]/80 transition-all duration-300 disabled:opacity-50"
                data-testid="admin-login-button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ...
                  </>
                ) : (
                  t('login')
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
