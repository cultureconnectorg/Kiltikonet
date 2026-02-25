import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { 
  Upload, Loader2, MapPin, Calendar, Sparkles, Users, Crown, ArrowLeft, ArrowRight,
  User, Building2, Target, Check, Globe, Briefcase, GraduationCap, Star
} from 'lucide-react';
import { countryList, profileTypes, standCategories, howHeardOptions } from '../lib/translations';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const tierInfo = {
  emerging: { name: 'ÉMERGENT', nameEn: 'EMERGING', price: 50, icon: Sparkles, color: '#00d4ff' },
  professional: { name: 'PROFESSIONNEL', nameEn: 'PROFESSIONAL', price: 150, icon: Users, color: '#D2A53C' },
  institutional: { name: 'INSTITUTIONNEL', nameEn: 'INSTITUTIONAL', price: 300, icon: Crown, color: '#a855f7' }
};

const steps = [
  { id: 1, icon: User, labelFr: 'Identité', labelEn: 'Identity' },
  { id: 2, icon: Building2, labelFr: 'Activité', labelEn: 'Activity' },
  { id: 3, icon: Target, labelFr: 'Objectifs', labelEn: 'Goals' }
];

export const RegistrationForm = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  
  const selectedTier = location.state?.selectedTier || 'emerging';
  const tier = tierInfo[selectedTier];
  const TierIcon = tier?.icon || Sparkles;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    organization_name: '',
    country: '',
    email: '',
    phone: '',
    profile_type: '',
    stand_request: 'no',
    stand_category: '',
    bio: '',
    language_preference: language,
    how_heard: '',
    // Step 2 - Activity
    siret_number: '',
    website: '',
    years_active: '',
    // Step 3 - Goals
    networking_goals: [],
    looking_for: '',
    offering: ''
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(language === 'fr' ? 'Fichier trop volumineux (max 5MB)' : 'File too large (max 5MB)');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
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
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      toast.error(language === 'fr' ? 'Veuillez remplir les champs obligatoires' : 'Please fill required fields');
    }
  };
  
  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      toast.error(language === 'fr' ? 'Veuillez compléter tous les champs' : 'Please complete all fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const submitData = new FormData();
      submitData.append('full_name', formData.full_name);
      submitData.append('organization_name', formData.organization_name);
      submitData.append('country', formData.country);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('profile_type', formData.profile_type);
      submitData.append('stand_request', formData.stand_request === 'yes');
      if (formData.stand_request === 'yes' && formData.stand_category) {
        submitData.append('stand_category', formData.stand_category);
      }
      submitData.append('bio', formData.bio);
      submitData.append('language_preference', formData.language_preference);
      submitData.append('how_heard', formData.how_heard);
      
      if (logoFile) {
        submitData.append('logo', logoFile);
      }
      
      const response = await axios.post(`${API}/registrations`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      navigate('/confirmation', { state: { registration: response.data } });
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(language === 'fr' ? 'Une erreur est survenue' : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const bioLength = formData.bio.length;
  const maxBioLength = 300;

  const networkingGoals = language === 'fr' 
    ? ['Trouver des artistes', 'Rencontrer des labels', 'Partenariats institutionnels', 'Distribution', 'Formation', 'Média & Presse']
    : ['Find artists', 'Meet labels', 'Institutional partnerships', 'Distribution', 'Training', 'Media & Press'];

  const benefits = language === 'fr' ? [
    'Accès prioritaire aux événements',
    'Base de données B2B',
    'Espace networking VIP',
    'Documentation exclusive'
  ] : [
    'Priority event access',
    'B2B database',
    'VIP networking lounge',
    'Exclusive documentation'
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 sm:pt-24">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00d4ff]/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#D2A53C]/5 rounded-full blur-[120px]" />
        
        {/* Caribbean map pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" viewBox="0 0 100 100">
          <circle cx="30" cy="40" r="2" fill="#00d4ff" />
          <circle cx="70" cy="50" r="2" fill="#D2A53C" />
          <circle cx="50" cy="30" r="2" fill="#a855f7" />
          <line x1="30" y1="40" x2="50" y2="30" stroke="#00d4ff" strokeWidth="0.2" />
          <line x1="50" y1="30" x2="70" y2="50" stroke="#D2A53C" strokeWidth="0.2" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Form */}
          <div>
            {/* Header */}
            <div className="mb-8">
              <button 
                onClick={() => navigate('/pricing')}
                className="inline-flex items-center gap-2 text-white/50 hover:text-[#00d4ff] transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">{language === 'fr' ? 'Modifier le forfait' : 'Change plan'}</span>
              </button>
              
              {tier && (
                <div 
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-xl mb-4"
                  style={{ 
                    background: `linear-gradient(135deg, ${tier.color}20, ${tier.color}10)`,
                    border: `1px solid ${tier.color}40`
                  }}
                >
                  <TierIcon className="w-5 h-5" style={{ color: tier.color }} />
                  <span className="font-semibold" style={{ color: tier.color }}>
                    {language === 'fr' ? tier.name : tier.nameEn}
                  </span>
                  <span className="text-white/60">—</span>
                  <span className="text-white font-bold">{tier.price}€</span>
                </div>
              )}
              
              <h1 className="font-serif text-3xl sm:text-4xl text-white mb-2">
                {language === 'fr' ? 'Portail d\'Accréditation' : 'Accreditation Portal'}
              </h1>
              <p className="text-white/50">
                {language === 'fr' ? 'Complétez votre demande en 3 étapes' : 'Complete your request in 3 steps'}
              </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-8">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <React.Fragment key={step.id}>
                    <button
                      onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-[#00d4ff]/20 border border-[#00d4ff]/50' 
                          : isCompleted
                            ? 'bg-[#4ADE80]/20 border border-[#4ADE80]/30'
                            : 'bg-white/5 border border-white/10'
                      }`}
                      disabled={step.id > currentStep}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 text-[#4ADE80]" />
                      ) : (
                        <StepIcon className={`w-4 h-4 ${isActive ? 'text-[#00d4ff]' : 'text-white/40'}`} />
                      )}
                      <span className={`text-sm font-medium ${
                        isActive ? 'text-[#00d4ff]' : isCompleted ? 'text-[#4ADE80]' : 'text-white/40'
                      }`}>
                        {language === 'fr' ? step.labelFr : step.labelEn}
                      </span>
                    </button>
                    {index < steps.length - 1 && (
                      <div className={`w-8 h-px ${currentStep > step.id ? 'bg-[#4ADE80]' : 'bg-white/20'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Form Card */}
            <div 
              className="rounded-2xl p-6 sm:p-8"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,212,255,0.2)'
              }}
            >
              <form onSubmit={handleSubmit}>
                {/* Step 1: Identity */}
                {currentStep === 1 && (
                  <div className="space-y-5 animate-fade-in">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <User className="w-5 h-5 text-[#00d4ff]" />
                      {language === 'fr' ? 'Identité Professionnelle' : 'Professional Identity'}
                    </h2>
                    
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-white/70">{t('fullName')} <span className="text-[#00d4ff]">*</span></Label>
                        <Input
                          value={formData.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          placeholder={t('fullNamePlaceholder')}
                          className={`bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 focus:border-[#00d4ff] ${errors.full_name ? 'border-red-500' : ''}`}
                          data-testid="input-full-name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white/70">{t('email')} <span className="text-[#00d4ff]">*</span></Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder={t('emailPlaceholder')}
                          className={`bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 focus:border-[#00d4ff] ${errors.email ? 'border-red-500' : ''}`}
                          data-testid="input-email"
                        />
                      </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-white/70">{t('phone')} <span className="text-[#00d4ff]">*</span></Label>
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder={t('phonePlaceholder')}
                          className={`bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 focus:border-[#00d4ff] ${errors.phone ? 'border-red-500' : ''}`}
                          data-testid="input-phone"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white/70">{t('country')} <span className="text-[#00d4ff]">*</span></Label>
                        <Select value={formData.country} onValueChange={(v) => handleInputChange('country', v)}>
                          <SelectTrigger className={`bg-white/5 border-white/10 text-white h-12 focus:border-[#00d4ff] ${errors.country ? 'border-red-500' : ''}`} data-testid="select-country">
                            <SelectValue placeholder={t('countryPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a2e] border-white/10">
                            {countryList.map((c) => (
                              <SelectItem key={c.value} value={c.value} className="text-white hover:bg-white/10">
                                {t(`countries.${c.labelKey}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white/70">{t('languagePreference')}</Label>
                      <Select value={formData.language_preference} onValueChange={(v) => handleInputChange('language_preference', v)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 focus:border-[#00d4ff]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                          <SelectItem value="fr" className="text-white hover:bg-white/10">{t('french')}</SelectItem>
                          <SelectItem value="en" className="text-white hover:bg-white/10">{t('english')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Step 2: Activity */}
                {currentStep === 2 && (
                  <div className="space-y-5 animate-fade-in">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#00d4ff]" />
                      {language === 'fr' ? 'Activité & Organisation' : 'Activity & Organization'}
                    </h2>
                    
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-white/70">{t('organizationName')} <span className="text-[#00d4ff]">*</span></Label>
                        <Input
                          value={formData.organization_name}
                          onChange={(e) => handleInputChange('organization_name', e.target.value)}
                          placeholder={t('organizationPlaceholder')}
                          className={`bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 focus:border-[#00d4ff] ${errors.organization_name ? 'border-red-500' : ''}`}
                          data-testid="input-organization-name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white/70">{t('profileType')} <span className="text-[#00d4ff]">*</span></Label>
                        <Select value={formData.profile_type} onValueChange={(v) => handleInputChange('profile_type', v)}>
                          <SelectTrigger className={`bg-white/5 border-white/10 text-white h-12 focus:border-[#00d4ff] ${errors.profile_type ? 'border-red-500' : ''}`} data-testid="select-profile-type">
                            <SelectValue placeholder={t('selectProfileType')} />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a2e] border-white/10">
                            {profileTypes.map((p) => (
                              <SelectItem key={p.value} value={p.value} className="text-white hover:bg-white/10">
                                {t(p.labelKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-white/70">SIRET / {language === 'fr' ? 'N° Organisation' : 'Org. Number'}</Label>
                        <Input
                          value={formData.siret_number}
                          onChange={(e) => handleInputChange('siret_number', e.target.value)}
                          placeholder={language === 'fr' ? 'Ex: 123 456 789 00012' : 'E.g.: 123 456 789 00012'}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 focus:border-[#00d4ff]"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white/70">{language === 'fr' ? 'Site web' : 'Website'}</Label>
                        <Input
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          placeholder="https://"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 focus:border-[#00d4ff]"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white/70">{t('bio')} <span className="text-[#00d4ff]">*</span></Label>
                      <Textarea
                        value={formData.bio}
                        onChange={(e) => e.target.value.length <= maxBioLength && handleInputChange('bio', e.target.value)}
                        placeholder={t('bioPlaceholder')}
                        className={`bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[120px] focus:border-[#00d4ff] ${errors.bio ? 'border-red-500' : ''}`}
                        data-testid="textarea-bio"
                      />
                      <p className="text-xs text-white/40 text-right">{maxBioLength - bioLength} {t('charactersRemaining')}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white/70">{t('logoUpload')}</Label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-white/20 bg-white/5 p-6 text-center cursor-pointer hover:border-[#00d4ff]/50 transition-colors rounded-lg"
                      >
                        {logoPreview ? (
                          <div className="flex flex-col items-center gap-2">
                            <img src={logoPreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                            <span className="text-sm text-[#00d4ff]">{logoFile?.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-8 h-8 text-[#00d4ff]" />
                            <span className="text-sm text-white/40">{t('uploadLabel')}</span>
                          </div>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-white/70">{t('standRequest')}</Label>
                      <RadioGroup value={formData.stand_request} onValueChange={(v) => handleInputChange('stand_request', v)} className="flex gap-6">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="stand-yes" className="border-[#00d4ff] text-[#00d4ff]" />
                          <Label htmlFor="stand-yes" className="text-white cursor-pointer">{t('yes')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="stand-no" className="border-[#00d4ff] text-[#00d4ff]" />
                          <Label htmlFor="stand-no" className="text-white cursor-pointer">{t('no')}</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {formData.stand_request === 'yes' && (
                      <div className="space-y-2 animate-fade-in">
                        <Label className="text-white/70">{t('standCategory')} <span className="text-[#00d4ff]">*</span></Label>
                        <Select value={formData.stand_category} onValueChange={(v) => handleInputChange('stand_category', v)}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 focus:border-[#00d4ff]">
                            <SelectValue placeholder={t('selectStandCategory')} />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a2e] border-white/10">
                            {standCategories.map((c) => (
                              <SelectItem key={c.value} value={c.value} className="text-white hover:bg-white/10">
                                {t(c.labelKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Goals */}
                {currentStep === 3 && (
                  <div className="space-y-5 animate-fade-in">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#00d4ff]" />
                      {language === 'fr' ? 'Objectifs Networking' : 'Networking Goals'}
                    </h2>
                    
                    <div className="space-y-3">
                      <Label className="text-white/70">{language === 'fr' ? 'Que recherchez-vous ?' : 'What are you looking for?'}</Label>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {networkingGoals.map((goal, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              const goals = formData.networking_goals.includes(goal)
                                ? formData.networking_goals.filter(g => g !== goal)
                                : [...formData.networking_goals, goal];
                              handleInputChange('networking_goals', goals);
                            }}
                            className={`px-4 py-3 rounded-lg text-left text-sm transition-all ${
                              formData.networking_goals.includes(goal)
                                ? 'bg-[#00d4ff]/20 border border-[#00d4ff]/50 text-[#00d4ff]'
                                : 'bg-white/5 border border-white/10 text-white/70 hover:border-white/30'
                            }`}
                          >
                            {goal}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white/70">{language === 'fr' ? 'Ce que vous proposez' : 'What you offer'}</Label>
                      <Textarea
                        value={formData.offering}
                        onChange={(e) => handleInputChange('offering', e.target.value)}
                        placeholder={language === 'fr' ? 'Services, produits, expertise...' : 'Services, products, expertise...'}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px] focus:border-[#00d4ff]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white/70">{t('howHeard')} <span className="text-[#00d4ff]">*</span></Label>
                      <Select value={formData.how_heard} onValueChange={(v) => handleInputChange('how_heard', v)}>
                        <SelectTrigger className={`bg-white/5 border-white/10 text-white h-12 focus:border-[#00d4ff] ${errors.how_heard ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder={t('selectHowHeard')} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                          {howHeardOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value} className="text-white hover:bg-white/10">
                              {t(o.labelKey)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                  {currentStep > 1 ? (
                    <Button type="button" variant="outline" onClick={handlePrev} className="border-white/20 text-white/70 hover:text-white hover:border-white/40">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {language === 'fr' ? 'Précédent' : 'Previous'}
                    </Button>
                  ) : (
                    <div />
                  )}
                  
                  {currentStep < 3 ? (
                    <Button type="button" onClick={handleNext} className="bg-[#00d4ff] text-[#0a0a0f] hover:bg-[#00d4ff]/90">
                      {language === 'fr' ? 'Suivant' : 'Next'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="bg-[#D2A53C] text-[#0a0a0f] hover:bg-[#D2A53C]/90">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {language === 'fr' ? 'Envoi...' : 'Submitting...'}
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          {language === 'fr' ? 'Soumettre ma demande' : 'Submit my request'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar - Benefits */}
          <div className="hidden lg:block">
            <div 
              className="sticky top-28 rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(210,165,60,0.1), rgba(210,165,60,0.02))',
                border: '1px solid rgba(210,165,60,0.2)'
              }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Star className="w-5 h-5 text-[#D2A53C]" />
                <h3 className="font-semibold text-white">
                  {language === 'fr' ? 'Avantages Accréditation' : 'Accreditation Benefits'}
                </h3>
              </div>
              
              <ul className="space-y-4">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#D2A53C] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-white/70">{benefit}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 pt-6 border-t border-[#D2A53C]/20">
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <MapPin className="w-4 h-4" />
                  <span>Fort-de-France, Martinique</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/50 mt-2">
                  <Calendar className="w-4 h-4" />
                  <span>20-23 Mai 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
