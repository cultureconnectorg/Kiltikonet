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
  const { t, language } = useLanguage();
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
    <div className="min-h-screen bg-paper pt-24 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="border border-lightborder bg-cream p-10" data-testid="admin-login-card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 border border-lightborder mx-auto mb-6 flex items-center justify-center">
              <Lock className="w-6 h-6 text-charcoal/60" />
            </div>
            <h1 className="font-serif text-2xl text-charcoal mb-2" data-testid="admin-login-title">
              Administration
            </h1>
            <p className="text-charcoal/50 text-sm">Culture Connect 2026</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-charcoal/70 text-sm">
                {t('password')}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`h-12 bg-paper border-lightborder text-charcoal placeholder:text-charcoal/30 rounded-none focus:border-terracotta ${error ? 'border-terracotta' : ''}`}
                data-testid="admin-password-input"
              />
              {error && (
                <p className="text-sm text-terracotta" data-testid="admin-error-message">
                  {t('invalidPassword')}
                </p>
              )}
            </div>
            
            <Button
              type="submit"
              disabled={isLoading || !password}
              className="w-full h-12 bg-charcoal text-paper font-syne text-sm tracking-wide hover:bg-charcoal/90 rounded-none disabled:opacity-50"
              data-testid="admin-login-button"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                language === 'fr' ? 'Accéder' : 'Access'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
