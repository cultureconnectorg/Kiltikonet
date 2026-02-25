import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { ArrowLeft, Download, Check, Loader2 } from 'lucide-react';
import { profileTypes } from '../lib/translations';
import { BadgeGenerator } from './BadgeGenerator';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const tierInfo = {
  emerging: { name: 'Émergent', nameEn: 'Emerging', price: 50 },
  professional: { name: 'Professionnel', nameEn: 'Professional', price: 150 },
  institutional: { name: 'Institutionnel', nameEn: 'Institutional', price: 300 }
};

export const ConfirmationScreen = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showBadge, setShowBadge] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  
  // Check for session_id from Stripe redirect
  const sessionId = searchParams.get('session_id');
  const registration = location.state?.registration;
  
  useEffect(() => {
    if (sessionId) {
      // Poll payment status from Stripe
      pollPaymentStatus(sessionId);
    } else if (!registration) {
      navigate('/');
    }
  }, [sessionId]);
  
  const pollPaymentStatus = async (sid, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;
    
    if (attempts >= maxAttempts) {
      setError(language === 'fr' 
        ? 'Vérification du paiement expirée. Veuillez vérifier votre email.'
        : 'Payment verification timed out. Please check your email.'
      );
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.get(`${API}/checkout/status/${sid}`);
      const data = response.data;
      
      if (data.payment_status === 'paid') {
        setPaymentData({
          full_name: data.metadata?.full_name || '',
          organization_name: data.metadata?.organization_name || '',
          email: data.metadata?.email || '',
          profile_type: data.metadata?.profile_type || '',
          tier: data.metadata?.tier || 'professional',
          amount: data.amount_total / 100,
          currency: data.currency
        });
        setIsLoading(false);
        return;
      } else if (data.status === 'expired') {
        setError(language === 'fr' 
          ? 'Session de paiement expirée.'
          : 'Payment session expired.'
        );
        setIsLoading(false);
        return;
      }
      
      // Continue polling
      setTimeout(() => pollPaymentStatus(sid, attempts + 1), pollInterval);
    } catch (err) {
      console.error('Error checking payment status:', err);
      setTimeout(() => pollPaymentStatus(sid, attempts + 1), pollInterval);
    }
  };
  
  // Use payment data from Stripe or from direct navigation
  const displayData = paymentData || registration;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper pt-24 sm:pt-32 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-terracotta mx-auto mb-4" />
          <p className="text-charcoal/70">
            {language === 'fr' ? 'Vérification du paiement...' : 'Verifying payment...'}
          </p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-paper pt-24 sm:pt-32 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="border border-terracotta/30 bg-terracotta/5 p-8">
            <p className="text-terracotta mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline" className="border-charcoal text-charcoal">
              {language === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!displayData) {
    return null;
  }
  
  const profileTypeObj = profileTypes.find(p => p.value === displayData.profile_type);
  const profileLabel = profileTypeObj ? t(profileTypeObj.labelKey) : displayData.profile_type;
  const tierData = tierInfo[displayData.tier] || tierInfo.professional;
  
  const participantWithTier = { 
    ...displayData, 
    tier: displayData.tier || 'professional',
    image: displayData.logo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop'
  };
  
  return (
    <div className="min-h-screen bg-paper pt-24 sm:pt-32 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="border border-lightborder bg-cream p-10 text-center" data-testid="confirmation-card">
          {/* Checkmark */}
          <div className="w-20 h-20 border-2 border-sage mx-auto mb-8 flex items-center justify-center">
            <Check className="w-10 h-10 text-sage" />
          </div>
          
          <h1 className="font-serif text-2xl sm:text-3xl text-charcoal mb-4" data-testid="confirmation-title">
            {language === 'fr' ? 'Paiement confirmé' : 'Payment confirmed'}
          </h1>
          
          <p className="text-charcoal/60 mb-8 leading-relaxed" data-testid="confirmation-message">
            {language === 'fr' 
              ? "Votre paiement a été accepté et votre demande d'accréditation est en cours de traitement. L'équipe Culture Connect vous contactera sous 72h."
              : "Your payment has been accepted and your accreditation request is being processed. The Culture Connect team will contact you within 72 hours."
            }
          </p>
          
          {/* Details */}
          <div className="border border-lightborder bg-paper p-6 mb-8 text-left">
            <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-4">
              {language === 'fr' ? 'Détails de l\'inscription' : 'Registration details'}
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-lightborder pb-3">
                <span className="text-charcoal/50 text-sm">{language === 'fr' ? 'Nom' : 'Name'}</span>
                <span className="text-charcoal font-medium" data-testid="confirmation-name">{displayData.full_name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-lightborder pb-3">
                <span className="text-charcoal/50 text-sm">{language === 'fr' ? 'Organisation' : 'Organization'}</span>
                <span className="text-charcoal font-medium" data-testid="confirmation-organization">{displayData.organization_name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-lightborder pb-3">
                <span className="text-charcoal/50 text-sm">{language === 'fr' ? 'Formule' : 'Plan'}</span>
                <span className="px-3 py-1 bg-sage/10 text-sage text-sm font-syne">
                  {language === 'fr' ? tierData.name : tierData.nameEn} — {tierData.price}€
                </span>
              </div>
              {profileLabel && (
                <div className="flex justify-between items-center">
                  <span className="text-charcoal/50 text-sm">{language === 'fr' ? 'Profil' : 'Profile'}</span>
                  <span className="px-3 py-1 bg-terracotta/10 text-terracotta text-sm" data-testid="confirmation-profile">
                    {profileLabel}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => setShowBadge(true)}
              className="w-full h-12 bg-charcoal text-paper font-syne text-sm rounded-none"
              data-testid="preview-badge-button"
            >
              <Download className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Prévisualiser mon badge' : 'Preview my badge'}
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full h-12 border-charcoal text-charcoal font-syne text-sm rounded-none"
              data-testid="back-to-home-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
            </Button>
          </div>
        </div>
        
        <p className="text-center text-charcoal/40 text-sm mt-6">
          {language === 'fr' ? 'Confirmation envoyée à ' : 'Confirmation sent to '}
          <span className="text-terracotta">{displayData.email}</span>
        </p>
      </div>

      {showBadge && (
        <BadgeGenerator participant={participantWithTier} onClose={() => setShowBadge(false)} />
      )}
    </div>
  );
};
