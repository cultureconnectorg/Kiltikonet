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
    <div className="min-h-screen bg-[#0C0B09] pt-20 sm:pt-24 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className="bg-[#141311] border border-[#2A2825] p-8 sm:p-10"
          data-testid="admin-login-card"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#D2A53C]/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#D2A53C]" />
            </div>
          </div>
          
          <h1 
            className="font-serif text-2xl sm:text-3xl text-[#D2A53C] text-center mb-8"
            data-testid="admin-login-title"
          >
            {t('adminLogin')}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#EDE8DC]">
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
                className={`bg-[#1A1917] border-[#2A2825] text-[#EDE8DC] placeholder:text-[#EDE8DC]/30 h-12 focus:border-[#D2A53C] focus:ring-1 focus:ring-[#D2A53C] ${error ? 'border-red-500' : ''}`}
                data-testid="admin-password-input"
              />
              {error && (
                <p className="text-sm text-red-500" data-testid="admin-error-message">
                  {t('invalidPassword')}
                </p>
              )}
            </div>
            
            <Button
              type="submit"
              disabled={isLoading || !password}
              className="w-full h-12 bg-[#D2A53C] text-[#0C0B09] font-semibold hover:bg-[#E5B84D] hover:shadow-[0_0_20px_rgba(210,165,60,0.3)] transition-all duration-300 disabled:opacity-50"
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
  );
};
