import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Upload, Loader2, ArrowLeft, ArrowRight, Check, User, Building2, Target, CheckCircle, Image, Tag } from 'lucide-react';
import { countryList, profileTypes, standCategories, howHeardOptions, expertiseTags } from '../lib/translations';
import axios from 'axios';
import { toast } from 'sonner';
import { RGPDCheckbox } from './legal';
import { Reveal } from '../hooks/useAnimations';
import HCaptchaWidget from './HCaptchaWidget';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const tierInfo = {
  emerging: { name: 'Émergent', nameEn: 'Emerging', price: 50 },
  professional: { name: 'Professionnel', nameEn: 'Professional', price: 300 },
  institutional: { name: 'Institutionnel', nameEn: 'Institutional', price: 500 }
};

const steps = [
  { id: 1, icon: User, labelFr: 'Identité', labelEn: 'Identity' },
  { id: 2, icon: Building2, labelFr: 'Activité', labelEn: 'Activity' },
  { id: 3, icon: Target, labelFr: 'Objectifs', labelEn: 'Goals' }
];

// Profile types that should show "Photo de presse" instead of "Logo"
const artistProfiles = ['artist', 'musician', 'performer', 'dj'];

export const RegistrationForm = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  
  const selectedTier = location.state?.selectedTier || 'emerging';
  const tier = tierInfo[selectedTier];
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '', organization_name: '', country: '', email: '', phone: '',
    profile_type: '', stand_request: 'no', stand_category: '', bio: '',
    language_preference: language, how_heard: '', siret_number: '', website_url: '',
    profile_image_url: '', // Cloudinary URL
    expertise_tags: [] // NEW: Array of selected expertise tags
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [rgpdConsent, setRgpdConsent] = useState(false); // RGPD consent state
  const [headerVisible, setHeaderVisible] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = React.useRef(null);

  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Header animation trigger
  useEffect(() => {
    const timer = setTimeout(() => setHeaderVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  React.useEffect(() => { window.scrollTo(0, 0); }, [currentStep]);
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };
  
  // Toggle expertise tag selection
  const toggleExpertiseTag = (tagValue) => {
    setFormData(prev => {
      const current = prev.expertise_tags || [];
      if (current.includes(tagValue)) {
        return { ...prev, expertise_tags: current.filter(t => t !== tagValue) };
      } else if (current.length < 5) { // Max 5 tags
        return { ...prev, expertise_tags: [...current, tagValue] };
      }
      return prev;
    });
  };
  
  // NEW: Immediate upload to Cloudinary on file selection
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'fr' ? 'Fichier trop volumineux (max 5MB)' : 'File too large (max 5MB)');
      return;
    }
    
    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
    
    // Upload to Cloudinary immediately
    setIsUploading(true);
    setUploadSuccess(false);
    
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      
      const response = await axios.post(`${API}/upload-image`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.url) {
        // Store URL in formData for Stripe checkout
        setFormData(prev => ({ ...prev, profile_image_url: response.data.url }));
        setUploadSuccess(true);
        toast.success(language === 'fr' ? 'Image uploadée avec succès' : 'Image uploaded successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(language === 'fr' ? 'Erreur lors de l\'upload' : 'Upload error');
      setLogoPreview(null);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Get contextual label for image upload based on profile type
  const getImageUploadLabel = () => {
    if (artistProfiles.includes(formData.profile_type)) {
      return language === 'fr' ? 'Photo de presse officielle' : 'Official press photo';
    }
    return language === 'fr' ? 'Logo institutionnel' : 'Institutional logo';
  };
  
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.full_name.trim()) newErrors.full_name = true;
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = true;
      if (!formData.phone.trim()) newErrors.phone = true;
      if (!formData.country) newErrors.country = true;
    }
    if (step === 2) {
      if (!formData.organization_name.trim()) newErrors.organization_name = true;
      if (!formData.profile_type) newErrors.profile_type = true;
      if (!formData.bio.trim()) newErrors.bio = true;
    }
    if (step === 3) {
      if (!formData.how_heard) newErrors.how_heard = true;
      if (!rgpdConsent) newErrors.rgpd = true; // RGPD validation
      if (!captchaToken) newErrors.captcha = true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, 3));
    else toast.error(language === 'fr' ? 'Veuillez remplir les champs obligatoires' : 'Please fill required fields');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    try {
      // Create Stripe checkout session with ALL data including image URL
      const checkoutData = {
        type: "accreditation",
        tier: selectedTier,
        origin_url: window.location.origin,
        full_name: formData.full_name,
        organization_name: formData.organization_name,
        country: formData.country,
        email: formData.email,
        phone: formData.phone,
        profile_type: formData.profile_type,
        stand_request: formData.stand_request === 'yes',
        stand_category: formData.stand_category || null,
        bio: formData.bio,
        language_preference: formData.language_preference,
        how_heard: formData.how_heard,
        // Additional fields sent to Stripe metadata
        profile_image_url: formData.profile_image_url || null,
        siret_number: formData.siret_number || null,
        website_url: formData.website_url || null,
        // NEW: Expertise tags as comma-separated string (Stripe metadata limit)
        expertise_tags: (formData.expertise_tags || []).join(','),
        // hCaptcha token
        captcha_token: captchaToken
      };
      
      const response = await axios.post(`${API}/create-checkout-session`, checkoutData);
      
      // Redirect to Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la création du paiement' : 'Payment creation error');
      setIsSubmitting(false);
      setCaptchaToken(null);
      captchaRef.current?.reset();
    }
  };

  return (
    <div className="min-h-screen bg-paper pt-24 sm:pt-32 overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <button 
            onClick={() => navigate('/pricing')} 
            className="flex items-center gap-2 text-charcoal/50 hover:text-terracotta mb-6"
            style={{
              opacity: headerVisible ? 1 : 0,
              transform: headerVisible ? 'translateX(0)' : 'translateX(-20px)',
              transition: prefersReducedMotion 
                ? 'opacity 0.3s ease-out' 
                : 'opacity 0.4s ease-out, transform 0.4s ease-out',
            }}
          >
            <ArrowLeft className="w-4 h-4" /> {language === 'fr' ? 'Retour aux formules' : 'Back to pricing'}
          </button>
          <div 
            className="flex items-center justify-between flex-wrap gap-4"
            style={{
              opacity: headerVisible ? 1 : 0,
              transform: headerVisible ? 'translateY(0)' : 'translateY(-20px)',
              transition: prefersReducedMotion 
                ? 'opacity 0.3s ease-out' 
                : 'opacity 0.5s ease-out 0.15s, transform 0.5s ease-out 0.15s',
            }}
          >
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl text-charcoal">{t('accreditationForm')}</h1>
              <p className="text-charcoal/50 mt-1">{t('formSubtitle')}</p>
            </div>
            <div className="px-4 py-2 border border-terracotta/30 bg-terracotta/5">
              <span className="text-terracotta font-syne text-sm">{language === 'fr' ? tier.name : tier.nameEn}</span>
              <span className="text-charcoal ml-2 font-medium">{tier.price}€</span>
            </div>
          </div>
        </div>
        
        {/* Stepper */}
        <div 
          className="flex items-center justify-between mb-12 border-b border-lightborder pb-6"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: prefersReducedMotion 
              ? 'opacity 0.3s ease-out' 
              : 'opacity 0.5s ease-out 0.3s, transform 0.5s ease-out 0.3s',
          }}
        >
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 flex items-center justify-center border-2 transition-all ${
                  currentStep >= step.id ? 'bg-terracotta border-terracotta text-paper' : 'bg-paper border-lightborder text-charcoal/40'
                }`}>
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-syne hidden sm:block ${currentStep >= step.id ? 'text-terracotta' : 'text-charcoal/40'}`}>
                  {language === 'fr' ? step.labelFr : step.labelEn}
                </span>
              </div>
              {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? 'bg-terracotta' : 'bg-lightborder'}`} />}
            </React.Fragment>
          ))}
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {currentStep === 1 && (
            <Reveal>
              <div className="space-y-6" data-testid="registration-step-1">
                <h2 className="font-serif text-xl text-charcoal mb-6">{language === 'fr' ? 'Informations personnelles' : 'Personal Information'}</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <Label className="text-charcoal/70 text-sm">{t('fullName')} *</Label>
                  <Input value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className={`mt-1 h-12 bg-paper border-lightborder rounded-none ${errors.full_name ? 'border-terracotta' : ''}`}
                    data-testid="input-full-name" />
                </div>
                <div>
                  <Label className="text-charcoal/70 text-sm">Email *</Label>
                  <Input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`mt-1 h-12 bg-paper border-lightborder rounded-none ${errors.email ? 'border-terracotta' : ''}`}
                    data-testid="input-email" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <Label className="text-charcoal/70 text-sm">{t('phone')} *</Label>
                  <Input value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`mt-1 h-12 bg-paper border-lightborder rounded-none ${errors.phone ? 'border-terracotta' : ''}`}
                    data-testid="input-phone" />
                </div>
                <div>
                  <Label className="text-charcoal/70 text-sm">{t('country')} *</Label>
                  <Select value={formData.country} onValueChange={(v) => handleInputChange('country', v)}>
                    <SelectTrigger className={`mt-1 h-12 bg-paper border-lightborder rounded-none ${errors.country ? 'border-terracotta' : ''}`}
                      data-testid="select-country">
                      <SelectValue placeholder={t('selectCountry')} />
                    </SelectTrigger>
                    <SelectContent className="bg-paper border-lightborder max-h-60">
                      {countryList.map(c => <SelectItem key={c.value} value={c.value}>{c.value}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Reveal>
          )}

          {currentStep === 2 && (
            <Reveal>
              <div className="space-y-6" data-testid="registration-step-2">
                <h2 className="font-serif text-xl text-charcoal mb-6">{language === 'fr' ? 'Activité professionnelle' : 'Professional Activity'}</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <Label className="text-charcoal/70 text-sm">{t('organizationName')} *</Label>
                  <Input value={formData.organization_name} onChange={(e) => handleInputChange('organization_name', e.target.value)}
                    className={`mt-1 h-12 bg-paper border-lightborder rounded-none ${errors.organization_name ? 'border-terracotta' : ''}`}
                    data-testid="input-organization" />
                </div>
                <div>
                  <Label className="text-charcoal/70 text-sm">{t('profileType')} *</Label>
                  <Select value={formData.profile_type} onValueChange={(v) => handleInputChange('profile_type', v)}>
                    <SelectTrigger className={`mt-1 h-12 bg-paper border-lightborder rounded-none ${errors.profile_type ? 'border-terracotta' : ''}`}
                      data-testid="select-profile-type">
                      <SelectValue placeholder={t('selectProfile')} />
                    </SelectTrigger>
                    <SelectContent className="bg-paper border-lightborder">
                      {profileTypes.map(p => <SelectItem key={p.value} value={p.value}>{t(p.labelKey)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* NEW: SIRET and Website fields */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <Label className="text-charcoal/70 text-sm">{language === 'fr' ? 'N° SIRET (optionnel)' : 'SIRET Number (optional)'}</Label>
                  <Input value={formData.siret_number} onChange={(e) => handleInputChange('siret_number', e.target.value)}
                    placeholder="123 456 789 00012"
                    className="mt-1 h-12 bg-paper border-lightborder rounded-none"
                    data-testid="input-siret" />
                </div>
                <div>
                  <Label className="text-charcoal/70 text-sm">{language === 'fr' ? 'Site web (optionnel)' : 'Website (optional)'}</Label>
                  <Input value={formData.website_url} onChange={(e) => handleInputChange('website_url', e.target.value)}
                    placeholder="https://"
                    className="mt-1 h-12 bg-paper border-lightborder rounded-none"
                    data-testid="input-website" />
                </div>
              </div>
              
              <div>
                <Label className="text-charcoal/70 text-sm">{t('bio')} *</Label>
                <Textarea value={formData.bio} onChange={(e) => e.target.value.length <= 300 && handleInputChange('bio', e.target.value)}
                  className={`mt-1 bg-paper border-lightborder rounded-none min-h-[120px] ${errors.bio ? 'border-terracotta' : ''}`}
                  data-testid="textarea-bio" />
                <p className="text-xs text-charcoal/40 mt-1 text-right">{300 - formData.bio.length} {language === 'fr' ? 'caractères' : 'characters'}</p>
              </div>
              
              {/* NEW: Contextual image upload with immediate Cloudinary upload */}
              <div>
                <Label className="text-charcoal/70 text-sm flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  {getImageUploadLabel()}
                </Label>
                <div 
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`mt-1 border border-dashed bg-paper p-6 text-center cursor-pointer transition-all ${
                    isUploading ? 'border-terracotta/50 cursor-wait' : 
                    uploadSuccess ? 'border-sage bg-sage/5' : 
                    'border-lightborder hover:border-terracotta'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
                      <span className="text-sm text-terracotta">{language === 'fr' ? 'Upload en cours...' : 'Uploading...'}</span>
                    </div>
                  ) : logoPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <img src={logoPreview} alt="" className="w-20 h-20 object-cover border border-lightborder" />
                        {uploadSuccess && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-sage rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-paper" />
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-sage font-syne">
                        {uploadSuccess 
                          ? (language === 'fr' ? 'Image prête ✓' : 'Image ready ✓')
                          : (language === 'fr' ? 'Cliquez pour changer' : 'Click to change')
                        }
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-charcoal/40" />
                      <span className="text-sm text-charcoal/50">
                        {language === 'fr' ? 'Cliquez pour uploader (max 5MB)' : 'Click to upload (max 5MB)'}
                      </span>
                      <span className="text-xs text-charcoal/30">JPEG, PNG, WebP</span>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} className="hidden" />
                </div>
              </div>
              
              <div>
                <Label className="text-charcoal/70 text-sm mb-2 block">{t('standRequest')}</Label>
                <RadioGroup value={formData.stand_request} onValueChange={(v) => handleInputChange('stand_request', v)} className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="yes" className="border-terracotta text-terracotta" />
                    <Label htmlFor="yes" className="cursor-pointer">{t('yes')}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="no" className="border-terracotta text-terracotta" />
                    <Label htmlFor="no" className="cursor-pointer">{t('no')}</Label>
                  </div>
                </RadioGroup>
              </div>
              {formData.stand_request === 'yes' && (
                <div>
                  <Label className="text-charcoal/70 text-sm">{t('standCategory')} *</Label>
                  <Select value={formData.stand_category} onValueChange={(v) => handleInputChange('stand_category', v)}>
                    <SelectTrigger className="mt-1 h-12 bg-paper border-lightborder rounded-none">
                      <SelectValue placeholder={t('selectStandCategory')} />
                    </SelectTrigger>
                    <SelectContent className="bg-paper border-lightborder">
                      {standCategories.map(c => <SelectItem key={c.value} value={c.value}>{t(c.labelKey)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </Reveal>
          )}

          {currentStep === 3 && (
            <Reveal>
              <div className="space-y-6" data-testid="registration-step-3">
                <h2 className="font-serif text-xl text-charcoal mb-6">{language === 'fr' ? 'Objectifs & Réseautage' : 'Goals & Networking'}</h2>
              
              {/* Expertise Tags - Multi-select */}
              <div>
                <Label className="text-charcoal/70 text-sm flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4" />
                  {language === 'fr' ? 'Expertises & Centres d\'intérêt' : 'Expertise & Interests'}
                  <span className="text-xs text-charcoal/40">({language === 'fr' ? 'max 5' : 'max 5'})</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {expertiseTags.map((tag) => {
                    const isSelected = formData.expertise_tags?.includes(tag.value);
                    return (
                      <button
                        key={tag.value}
                        type="button"
                        onClick={() => toggleExpertiseTag(tag.value)}
                        className={`px-4 py-2 text-sm font-syne transition-all border ${
                          isSelected 
                            ? 'border-sage bg-sage text-paper' 
                            : 'border-lightborder bg-paper text-charcoal/70 hover:border-terracotta'
                        }`}
                      >
                        {language === 'fr' ? tag.labelFr : tag.labelEn}
                        {isSelected && <Check className="w-3 h-3 inline ml-2" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-charcoal/40 mt-2">
                  {language === 'fr' 
                    ? 'Ces tags permettront de vous connecter avec des profils similaires'
                    : 'These tags will help connect you with similar profiles'
                  }
                </p>
              </div>
              
              <div>
                <Label className="text-charcoal/70 text-sm">{t('howHeard')} *</Label>
                <Select value={formData.how_heard} onValueChange={(v) => handleInputChange('how_heard', v)}>
                  <SelectTrigger className={`mt-1 h-12 bg-paper border-lightborder rounded-none ${errors.how_heard ? 'border-terracotta' : ''}`}
                    data-testid="select-how-heard">
                    <SelectValue placeholder={t('selectHowHeard')} />
                  </SelectTrigger>
                  <SelectContent className="bg-paper border-lightborder">
                    {howHeardOptions.map(o => <SelectItem key={o.value} value={o.value}>{t(o.labelKey)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              {/* RGPD Consent - Required */}
              <div className="pt-4 border-t border-lightborder">
                <RGPDCheckbox 
                  checked={rgpdConsent} 
                  onCheckedChange={setRgpdConsent}
                  showError={errors.rgpd}
                />
              </div>

              {/* hCaptcha Widget */}
              <div className="pt-4" data-testid="captcha-container-pro">
                <HCaptchaWidget
                  ref={captchaRef}
                  onVerify={(token) => {
                    setCaptchaToken(token);
                    if (errors.captcha) setErrors(prev => ({ ...prev, captcha: null }));
                  }}
                  onExpire={() => setCaptchaToken(null)}
                  onError={() => setCaptchaToken(null)}
                />
                {errors.captcha && (
                  <p className="text-xs text-red-500 text-center mt-2">
                    {language === 'fr' ? 'Veuillez compléter le captcha' : 'Please complete the captcha'}
                  </p>
                )}
              </div>
              
              {/* Summary before payment */}
              <div className="border border-lightborder bg-cream p-6 mt-8">
                <h3 className="font-serif text-lg text-charcoal mb-4">{language === 'fr' ? 'Récapitulatif' : 'Summary'}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charcoal/60">{language === 'fr' ? 'Nom' : 'Name'}</span>
                    <span className="text-charcoal font-medium">{formData.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/60">Organisation</span>
                    <span className="text-charcoal font-medium">{formData.organization_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/60">Email</span>
                    <span className="text-charcoal font-medium">{formData.email}</span>
                  </div>
                  {formData.expertise_tags?.length > 0 && (
                    <div className="flex justify-between items-start pt-2 border-t border-lightborder mt-2">
                      <span className="text-charcoal/60">{language === 'fr' ? 'Expertises' : 'Expertise'}</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                        {formData.expertise_tags.map(tagValue => {
                          const tag = expertiseTags.find(t => t.value === tagValue);
                          return tag && (
                            <span key={tagValue} className="px-2 py-0.5 text-xs bg-sage/10 text-sage">
                              {language === 'fr' ? tag.labelFr : tag.labelEn}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-lightborder mt-2">
                    <span className="text-charcoal/60">{language === 'fr' ? 'Formule' : 'Plan'}</span>
                    <span className="text-terracotta font-syne font-medium">{language === 'fr' ? tier.name : tier.nameEn} — {tier.price}€</span>
                  </div>
                  {formData.profile_image_url && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-charcoal/60">{language === 'fr' ? 'Photo/Logo' : 'Photo/Logo'}</span>
                      <span className="text-sage font-syne">✓ {language === 'fr' ? 'Uploadé' : 'Uploaded'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
          )}
          
          {/* Navigation */}
          <div className="flex gap-4 pt-6 border-t border-lightborder">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={() => setCurrentStep(prev => prev - 1)}
                className="h-12 px-6 border-charcoal text-charcoal rounded-none font-syne">
                <ArrowLeft className="w-4 h-4 mr-2" /> {language === 'fr' ? 'Retour' : 'Back'}
              </Button>
            )}
            {currentStep < 3 ? (
              <Button type="button" onClick={handleNext}
                className="flex-1 h-12 bg-charcoal text-paper rounded-none font-syne">
                {language === 'fr' ? 'Continuer' : 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}
                className="flex-1 h-14 bg-terracotta hover:bg-terracotta/90 text-paper rounded-none font-syne text-base"
                data-testid="submit-payment">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>{language === 'fr' ? 'Procéder au paiement' : 'Proceed to payment'} — {tier.price}€</>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
