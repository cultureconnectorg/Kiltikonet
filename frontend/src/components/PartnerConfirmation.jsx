import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { ArrowLeft, Check, Loader2, Building2, Users, Star } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const partnerTiersInfo = {
  bronze: { nameFr: 'Partenaire Bronze', nameEn: 'Bronze Partner', price: 2500, vip: 2 },
  silver: { nameFr: 'Partenaire Silver', nameEn: 'Silver Partner', price: 5000, vip: 5 },
  gold: { nameFr: 'Partenaire Gold', nameEn: 'Gold Partner', price: 10000, vip: 10 }
};

export const PartnerConfirmation = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      navigate('/partenaires');
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
    
    try {
      const response = await axios.get(`${API}/checkout/status/${sid}`);
      const data = response.data;
      
      if (data.payment_status === 'paid') {
        setPaymentData({
          company_name: data.metadata?.company_name || '',
          contact_name: data.metadata?.contact_name || '',
          contact_email: data.metadata?.contact_email || '',
          tier: data.metadata?.tier || 'bronze',
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
      
      setTimeout(() => pollPaymentStatus(sid, attempts + 1), pollInterval);
    } catch (err) {
      console.error('Error checking payment status:', err);
      setTimeout(() => pollPaymentStatus(sid, attempts + 1), pollInterval);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper pt-24 sm:pt-32 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-sage mx-auto mb-4" />
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
            <Button onClick={() => navigate('/partenaires')} variant="outline" className="border-charcoal text-charcoal">
              {language === 'fr' ? 'Retour aux partenariats' : 'Back to partnerships'}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!paymentData) return null;
  
  const tierData = partnerTiersInfo[paymentData.tier] || partnerTiersInfo.bronze;
  
  return (
    <div className="min-h-screen bg-paper pt-24 sm:pt-32 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="border border-lightborder bg-cream p-10 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 border-2 border-sage mx-auto mb-8 flex items-center justify-center">
            <Star className="w-10 h-10 text-sage" />
          </div>
          
          <h1 className="font-serif text-2xl sm:text-3xl text-charcoal mb-4">
            {language === 'fr' ? 'Bienvenue parmi nos partenaires !' : 'Welcome to our partners!'}
          </h1>
          
          <p className="text-charcoal/60 mb-8 leading-relaxed">
            {language === 'fr' 
              ? "Votre paiement a été accepté. Vous êtes désormais partenaire officiel de Culture Connect 2026. Notre équipe vous contactera très prochainement."
              : "Your payment has been accepted. You are now an official partner of Culture Connect 2026. Our team will contact you very soon."
            }
          </p>
          
          {/* Partner Details */}
          <div className="border border-lightborder bg-paper p-6 mb-8 text-left">
            <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-4">
              {language === 'fr' ? 'Détails du partenariat' : 'Partnership details'}
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-lightborder">
                <Building2 className="w-5 h-5 text-charcoal/40" />
                <div className="flex-1">
                  <p className="text-charcoal/50 text-xs">{language === 'fr' ? 'Entreprise' : 'Company'}</p>
                  <p className="text-charcoal font-medium">{paymentData.company_name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pb-3 border-b border-lightborder">
                <Star className="w-5 h-5 text-charcoal/40" />
                <div className="flex-1">
                  <p className="text-charcoal/50 text-xs">{language === 'fr' ? 'Formule' : 'Package'}</p>
                  <span className="inline-flex px-3 py-1 bg-sage/10 text-sage text-sm font-syne">
                    {language === 'fr' ? tierData.nameFr : tierData.nameEn}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-charcoal/40" />
                <div className="flex-1">
                  <p className="text-charcoal/50 text-xs">{language === 'fr' ? 'Accréditations VIP incluses' : 'VIP accreditations included'}</p>
                  <p className="text-charcoal font-medium">{tierData.vip} VIP</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* What's Next */}
          <div className="border border-sage/30 bg-sage/5 p-6 mb-8 text-left">
            <p className="text-xs text-sage uppercase tracking-wider mb-3 font-syne">
              {language === 'fr' ? 'Prochaines étapes' : 'Next steps'}
            </p>
            <ul className="space-y-2 text-sm text-charcoal/70">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" />
                {language === 'fr' 
                  ? 'Un email de confirmation vous a été envoyé'
                  : 'A confirmation email has been sent to you'
                }
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" />
                {language === 'fr' 
                  ? 'Notre équipe vous contactera sous 48h'
                  : 'Our team will contact you within 48h'
                }
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" />
                {language === 'fr' 
                  ? 'Votre logo sera ajouté sur notre site'
                  : 'Your logo will be added to our website'
                }
              </li>
            </ul>
          </div>
          
          {/* Actions */}
          <Button
            onClick={() => navigate('/')}
            className="w-full h-12 bg-charcoal text-paper font-syne text-sm rounded-none"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
          </Button>
        </div>
        
        <p className="text-center text-charcoal/40 text-sm mt-6">
          {language === 'fr' ? 'Confirmation envoyée à ' : 'Confirmation sent to '}
          <span className="text-terracotta">{paymentData.contact_email}</span>
        </p>
      </div>
    </div>
  );
};
