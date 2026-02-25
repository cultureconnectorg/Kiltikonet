import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Upload, Loader2, ArrowLeft, ArrowRight, Check, User, Building2, Target } from 'lucide-react';
import { countryList, profileTypes, standCategories, howHeardOptions } from '../lib/translations';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const tierInfo = {
  emerging: { name: 'Émergent', nameEn: 'Emerging', price: 50 },
  professional: { name: 'Professionnel', nameEn: 'Professional', price: 150 },
  institutional: { name: 'Institutionnel', nameEn: 'Institutional', price: 300 }
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
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '', organization_name: '', country: '', email: '', phone: '',
    profile_type: '', stand_request: 'no', stand_category: '', bio: '',
    language_preference: language, how_heard: '', siret_number: '', website: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  React.useEffect(() => { window.scrollTo(0, 0); }, [currentStep]);
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Fichier trop volumineux (max 5MB)');
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
    if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, 3));
    else toast.error(language === 'fr' ? 'Veuillez remplir les champs obligatoires' : 'Please fill required fields');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    try {
      // Create Stripe checkout session for payment
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
        how_heard: formData.how_heard
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
    }
  };

  return (
    <div className="min-h-screen bg-paper pt-24 sm:pt-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <button onClick={() => navigate('/pricing')} className="flex items-center gap-2 text-charcoal/50 hover:text-terracotta mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{language === 'fr' ? 'Modifier le forfait' : 'Change plan'}</span>
          </button>
          
          {tier && (
            <div className="inline-flex items-center gap-3 px-4 py-2 border border-terracotta/30 bg-terracotta/5 mb-6">
              <span className="text-terracotta font-syne text-sm">{language === 'fr' ? tier.name : tier.nameEn}</span>
              <span className="text-charcoal/40">—</span>
              <span className="text-charcoal font-medium">{tier.price}€</span>
            </div>
          )}
          
          <h1 className="font-serif text-3xl sm:text-4xl text-charcoal mb-2">
            {language === 'fr' ? 'Demande d\'accréditation' : 'Accreditation Request'}
          </h1>
          <p className="text-charcoal/60">{language === 'fr' ? 'Complétez votre demande en 3 étapes' : 'Complete your request in 3 steps'}</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((step, i) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  disabled={step.id > currentStep}
                  className={`flex items-center gap-2 px-4 py-2 border transition-colors ${
                    isActive ? 'border-terracotta bg-terracotta/5' : isCompleted ? 'border-sage bg-sage/5' : 'border-lightborder'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 text-sage" /> : <StepIcon className={`w-4 h-4 ${isActive ? 'text-terracotta' : 'text-charcoal/40'}`} />}
                  <span className={`text-sm font-syne ${isActive ? 'text-terracotta' : isCompleted ? 'text-sage' : 'text-charcoal/40'}`}>
                    {language === 'fr' ? step.labelFr : step.labelEn}
                  </span>
                </button>
                {i < steps.length - 1 && <div className={`w-8 h-px ${currentStep > step.id ? 'bg-sage' : 'bg-lightborder'}`} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Form */}
        <div className="border border-lightborder bg-cream p-8">
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="font-serif text-xl text-charcoal mb-6">{language === 'fr' ? 'Identité' : 'Identity'}</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-charcoal/70 text-sm">{t('fullName')} *</Label>
                    <Input value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className={`mt-1 h-12 bg-paper border-lightborder rounded-none ${errors.full_name ? 'border-terracotta' : ''}`} />
                  </div>
                  <div>
                    <Label className="text-charcoal/70 text-sm">{t('email')} *</Label>
                    <Input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`mt-1 h-12 bg-paper border-lightborder rounded-none ${errors.email ? 'border-terracotta' : ''}`} />
                  </div>
                  <div>
                    <Label className="text-charcoal/70 text-sm">{t('phone')} *</Label>
                    <Input value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`mt-1 h-12 bg-paper border-lightborder rounded-none ${errors.phone ? 'border-terracotta' : ''}`} />
                  </div>
                  <div>
                    <Label className="text-charcoal/70 text-sm">{t('country')} *</Label>
                    <Select value={formData.country} onValueChange={(v) => handleInputChange('country', v)}>
                      <SelectTrigger className={`mt-1 h-12 bg-paper border-lightborder rounded-none ${errors.country ? 'border-terracotta' : ''}`}>
                        <SelectValue placeholder={t('countryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="bg-paper border-lightborder">
                        {countryList.map(c => <SelectItem key={c.value} value={c.value}>{t(`countries.${c.labelKey}`)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="font-serif text-xl text-charcoal mb-6">{language === 'fr' ? 'Activité' : 'Activity'}</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-charcoal/70 text-sm">{t('organizationName')} *</Label>
                    <Input value={formData.organization_name} onChange={(e) => handleInputChange('organization_name', e.target.value)}
                      className={`mt-1 h-12 bg-paper border-lightborder rounded-none ${errors.organization_name ? 'border-terracotta' : ''}`} />
                  </div>
                  <div>
                    <Label className="text-charcoal/70 text-sm">{t('profileType')} *</Label>
                    <Select value={formData.profile_type} onValueChange={(v) => handleInputChange('profile_type', v)}>
                      <SelectTrigger className={`mt-1 h-12 bg-paper border-lightborder rounded-none ${errors.profile_type ? 'border-terracotta' : ''}`}>
                        <SelectValue placeholder={t('selectProfileType')} />
                      </SelectTrigger>
                      <SelectContent className="bg-paper border-lightborder">
                        {profileTypes.map(p => <SelectItem key={p.value} value={p.value}>{t(p.labelKey)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-charcoal/70 text-sm">{t('bio')} *</Label>
                  <Textarea value={formData.bio} onChange={(e) => e.target.value.length <= 300 && handleInputChange('bio', e.target.value)}
                    className={`mt-1 bg-paper border-lightborder rounded-none min-h-[120px] ${errors.bio ? 'border-terracotta' : ''}`} />
                  <p className="text-xs text-charcoal/40 mt-1 text-right">{300 - formData.bio.length} caractères</p>
                </div>
                <div>
                  <Label className="text-charcoal/70 text-sm">{t('logoUpload')}</Label>
                  <div onClick={() => fileInputRef.current?.click()}
                    className="mt-1 border border-dashed border-lightborder bg-paper p-6 text-center cursor-pointer hover:border-terracotta transition-colors">
                    {logoPreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={logoPreview} alt="" className="w-16 h-16 object-cover" />
                        <span className="text-sm text-terracotta">{logoFile?.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-charcoal/40" />
                        <span className="text-sm text-charcoal/50">{t('uploadLabel')}</span>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
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
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="font-serif text-xl text-charcoal mb-6">{language === 'fr' ? 'Objectifs' : 'Goals'}</h2>
                <div>
                  <Label className="text-charcoal/70 text-sm">{t('howHeard')} *</Label>
                  <Select value={formData.how_heard} onValueChange={(v) => handleInputChange('how_heard', v)}>
                    <SelectTrigger className={`mt-1 h-12 bg-paper border-lightborder rounded-none ${errors.how_heard ? 'border-terracotta' : ''}`}>
                      <SelectValue placeholder={t('selectHowHeard')} />
                    </SelectTrigger>
                    <SelectContent className="bg-paper border-lightborder">
                      {howHeardOptions.map(o => <SelectItem key={o.value} value={o.value}>{t(o.labelKey)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-charcoal/70 text-sm">{t('languagePreference')}</Label>
                  <Select value={formData.language_preference} onValueChange={(v) => handleInputChange('language_preference', v)}>
                    <SelectTrigger className="mt-1 h-12 bg-paper border-lightborder rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-paper border-lightborder">
                      <SelectItem value="fr">{t('french')}</SelectItem>
                      <SelectItem value="en">{t('english')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-lightborder">
              {currentStep > 1 ? (
                <Button type="button" variant="outline" onClick={() => setCurrentStep(prev => prev - 1)}
                  className="h-12 px-6 border-charcoal text-charcoal rounded-none">
                  <ArrowLeft className="w-4 h-4 mr-2" /> {language === 'fr' ? 'Précédent' : 'Previous'}
                </Button>
              ) : <div />}
              
              {currentStep < 3 ? (
                <Button type="button" onClick={handleNext} className="h-12 px-6 bg-charcoal text-paper rounded-none">
                  {language === 'fr' ? 'Suivant' : 'Next'} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="h-12 px-8 bg-terracotta text-paper rounded-none">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <><Check className="w-4 h-4 mr-2" /> {language === 'fr' ? 'Soumettre' : 'Submit'}</>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
