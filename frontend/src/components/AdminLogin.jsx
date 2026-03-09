import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Lock, Loader2 } from 'lucide-react';
import { saveSession } from './ProtectedRoute';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Design colors
const COLORS = {
  charbon: '#1C1A14',
  terracotta: '#C4714A',
  gold: '#D4A84B',
  forest: '#4A5D4E',
  cream: '#F4F1EA'
};

export const AdminLogin = ({ onLogin }) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);
    
    try {
      // Try workspace login first
      const response = await axios.post(`${API}/workspace/login`, { password });
      
      if (response.data.success) {
        // Store user info with new saveSession function
        const sessionData = {
          name: response.data.user,
          role: response.data.role,
        };
        saveSession(sessionData, rememberMe);
        
        // Show toast for persistent session
        if (rememberMe) {
          toast.success(`Bienvenue ${response.data.user} ! Session mémorisée pour 30 jours.`);
        } else {
          toast.success(`Bienvenue ${response.data.user} !`);
        }
        
        // Call onLogin with role and redirect path
        if (response.data.role === 'admin') {
          onLogin('admin', null);
        } else {
          // For non-admin, call onLogin with redirect path
          onLogin(response.data.role, response.data.redirect);
        }
      }
    } catch (err) {
      // If workspace login fails, try old admin verify for backwards compatibility
      try {
        const adminResponse = await axios.post(`${API}/admin/verify`, { password });
        if (adminResponse.data.success) {
          onLogin('admin', null);
          return;
        }
      } catch (adminErr) {
        setError(true);
        toast.error('Mot de passe invalide');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
            style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, #8B1A4A)`, color: '#fff' }}>
            CC
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: COLORS.gold, fontFamily: "'Cormorant Garamond', serif" }}>
            Culture Connect 2026
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Espace de travail equipe
          </p>
        </div>
        
        {/* Login card */}
        <div className="rounded-xl p-8" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}30` }} data-testid="admin-login-card">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" 
              style={{ background: `${COLORS.terracotta}20`, border: `1px solid ${COLORS.terracotta}40` }}>
              <Lock className="w-6 h-6" style={{ color: COLORS.terracotta }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: '#fff' }} data-testid="admin-login-title">
              Connexion
            </h2>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Entrez votre mot de passe pour acceder a votre espace
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`h-12 rounded-lg ${error ? 'border-red-500' : ''}`}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, 
                  color: '#fff' 
                }}
                data-testid="admin-password-input"
              />
              {error && (
                <p className="text-sm text-red-400" data-testid="admin-error-message">
                  Mot de passe invalide
                </p>
              )}
            </div>
            
            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-3">
              <Checkbox 
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                className="border-white/30 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                style={{ '--tw-ring-color': COLORS.gold }}
              />
              <label 
                htmlFor="rememberMe" 
                className="text-sm cursor-pointer select-none"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                Se souvenir de moi <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>(30 jours)</span>
              </label>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading || !password}
              className="w-full h-12 font-bold tracking-wider rounded-lg disabled:opacity-50"
              style={{ background: COLORS.terracotta, color: '#fff' }}
              data-testid="admin-login-button"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'ACCEDER'
              )}
            </Button>
          </form>
          
          {/* Info */}
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Chaque membre de l'equipe possede son propre mot de passe.<br/>
              Contactez Laurent en cas de probleme d'acces.
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            kiltikonet.fr - @cultureconnectorg
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
