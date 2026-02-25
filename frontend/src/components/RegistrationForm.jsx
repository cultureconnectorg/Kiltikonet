import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Upload, Loader2, MapPin, Calendar } from 'lucide-react';
import React from 'react';
import { countryList, profileTypes, standCategories, howHeardOptions } from '../lib/translations';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const RegistrationForm = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Scroll to top on mount
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
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
    how_heard: ''
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
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
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = true;
    if (!formData.organization_name.trim()) newErrors.organization_name = true;
    if (!formData.country) newErrors.country = true;
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = true;
    if (!formData.phone.trim()) newErrors.phone = true;
    if (!formData.profile_type) newErrors.profile_type = true;
    if (!formData.bio.trim()) newErrors.bio = true;
    if (!formData.how_heard) newErrors.how_heard = true;
    if (formData.stand_request === 'yes' && !formData.stand_category) newErrors.stand_category = true;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error(language === 'fr' ? 'Veuillez remplir tous les champs obligatoires' : 'Please fill in all required fields');
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
      
      navigate('/confirmation', { 
        state: { 
          registration: response.data 
        } 
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(language === 'fr' ? 'Une erreur est survenue. Veuillez réessayer.' : 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const bioLength = formData.bio.length;
  const maxBioLength = 300;
  
  return (
    <div className="min-h-screen bg-[#0C0B09] pt-20 sm:pt-24">
      {/* Page Header */}
      <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-6 text-[#D2A53C]/80">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">{t('eventLocation')}</span>
            </div>
            <span className="text-[#2A2825]">|</span>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{t('eventDate')}</span>
            </div>
          </div>
          
          <h1 
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#D2A53C] leading-tight mb-4"
            data-testid="register-page-title"
          >
            {t('formTitle')}
          </h1>
          
          <p className="text-base sm:text-lg text-[#EDE8DC]/60 max-w-2xl mx-auto">
            {language === 'fr' 
              ? 'Remplissez le formulaire ci-dessous pour demander votre accréditation'
              : 'Fill out the form below to request your accreditation'
            }
          </p>
        </div>
      </section>
      
      {/* Registration Form */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#141311] border border-[#2A2825] p-6 sm:p-8 lg:p-10">
            <h2 
              className="font-serif text-2xl sm:text-3xl text-[#D2A53C] mb-8"
              data-testid="form-title"
            >
              {t('formTitle')}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="registration-form">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-[#F5F5F0]">
                  {t('fullName')} <span className="text-[#D2A53C]">*</span>
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder={t('fullNamePlaceholder')}
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className={`bg-[#1A1917] border-[#33312E] text-white placeholder:text-white/30 h-12 focus:border-[#D2A53C] focus:ring-1 focus:ring-[#D2A53C] ${errors.full_name ? 'border-red-500' : ''}`}
                  data-testid="input-full-name"
                />
              </div>
              
              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="organization_name" className="text-[#F5F5F0]">
                  {t('organizationName')} <span className="text-[#D2A53C]">*</span>
                </Label>
                <Input
                  id="organization_name"
                  type="text"
                  placeholder={t('organizationPlaceholder')}
                  value={formData.organization_name}
                  onChange={(e) => handleInputChange('organization_name', e.target.value)}
                  className={`bg-[#1A1917] border-[#33312E] text-white placeholder:text-white/30 h-12 focus:border-[#D2A53C] focus:ring-1 focus:ring-[#D2A53C] ${errors.organization_name ? 'border-red-500' : ''}`}
                  data-testid="input-organization-name"
                />
              </div>
              
              {/* Country */}
              <div className="space-y-2">
                <Label className="text-[#F5F5F0]">
                  {t('country')} <span className="text-[#D2A53C]">*</span>
                </Label>
                <Select 
                  value={formData.country} 
                  onValueChange={(value) => handleInputChange('country', value)}
                >
                  <SelectTrigger 
                    className={`bg-[#1A1917] border-[#33312E] text-white h-12 focus:border-[#D2A53C] focus:ring-1 focus:ring-[#D2A53C] ${errors.country ? 'border-red-500' : ''}`}
                    data-testid="select-country"
                  >
                    <SelectValue placeholder={t('countryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1917] border-[#33312E]">
                    {countryList.map((country) => (
                      <SelectItem 
                        key={country.value} 
                        value={country.value}
                        className="text-white hover:bg-[#2A2825] focus:bg-[#2A2825]"
                      >
                        {t(`countries.${country.labelKey}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#F5F5F0]">
                  {t('email')} <span className="text-[#D2A53C]">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`bg-[#1A1917] border-[#33312E] text-white placeholder:text-white/30 h-12 focus:border-[#D2A53C] focus:ring-1 focus:ring-[#D2A53C] ${errors.email ? 'border-red-500' : ''}`}
                  data-testid="input-email"
                />
              </div>
              
              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#F5F5F0]">
                  {t('phone')} <span className="text-[#D2A53C]">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t('phonePlaceholder')}
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`bg-[#1A1917] border-[#33312E] text-white placeholder:text-white/30 h-12 focus:border-[#D2A53C] focus:ring-1 focus:ring-[#D2A53C] ${errors.phone ? 'border-red-500' : ''}`}
                  data-testid="input-phone"
                />
              </div>
              
              {/* Profile Type */}
              <div className="space-y-2">
                <Label className="text-[#F5F5F0]">
                  {t('profileType')} <span className="text-[#D2A53C]">*</span>
                </Label>
                <Select 
                  value={formData.profile_type} 
                  onValueChange={(value) => handleInputChange('profile_type', value)}
                >
                  <SelectTrigger 
                    className={`bg-[#1A1917] border-[#33312E] text-white h-12 focus:border-[#D2A53C] focus:ring-1 focus:ring-[#D2A53C] ${errors.profile_type ? 'border-red-500' : ''}`}
                    data-testid="select-profile-type"
                  >
                    <SelectValue placeholder={t('selectProfileType')} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1917] border-[#33312E]">
                    {profileTypes.map((profile) => (
                      <SelectItem 
                        key={profile.value} 
                        value={profile.value}
                        className="text-white hover:bg-[#2A2825] focus:bg-[#2A2825]"
                      >
                        {t(profile.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Stand Request */}
              <div className="space-y-3">
                <Label className="text-[#F5F5F0]">{t('standRequest')}</Label>
                <RadioGroup
                  value={formData.stand_request}
                  onValueChange={(value) => handleInputChange('stand_request', value)}
                  className="flex gap-6"
                  data-testid="radio-stand-request"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="yes" 
                      id="stand-yes" 
                      className="border-[#D2A53C] text-[#D2A53C]"
                    />
                    <Label htmlFor="stand-yes" className="text-[#F5F5F0] cursor-pointer">
                      {t('yes')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="no" 
                      id="stand-no" 
                      className="border-[#D2A53C] text-[#D2A53C]"
                    />
                    <Label htmlFor="stand-no" className="text-[#F5F5F0] cursor-pointer">
                      {t('no')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Stand Category (conditional) */}
              {formData.stand_request === 'yes' && (
                <div className="space-y-2 animate-fade-in">
                  <Label className="text-[#F5F5F0]">
                    {t('standCategory')} <span className="text-[#D2A53C]">*</span>
                  </Label>
                  <Select 
                    value={formData.stand_category} 
                    onValueChange={(value) => handleInputChange('stand_category', value)}
                  >
                    <SelectTrigger 
                      className={`bg-[#1A1917] border-[#33312E] text-white h-12 focus:border-[#D2A53C] focus:ring-1 focus:ring-[#D2A53C] ${errors.stand_category ? 'border-red-500' : ''}`}
                      data-testid="select-stand-category"
                    >
                      <SelectValue placeholder={t('selectStandCategory')} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1917] border-[#33312E]">
                      {standCategories.map((category) => (
                        <SelectItem 
                          key={category.value} 
                          value={category.value}
                          className="text-white hover:bg-[#2A2825] focus:bg-[#2A2825]"
                        >
                          {t(category.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-[#F5F5F0]">
                  {t('bio')} <span className="text-[#D2A53C]">*</span>
                </Label>
                <Textarea
                  id="bio"
                  placeholder={t('bioPlaceholder')}
                  value={formData.bio}
                  onChange={(e) => {
                    if (e.target.value.length <= maxBioLength) {
                      handleInputChange('bio', e.target.value);
                    }
                  }}
                  className={`bg-[#1A1917] border-[#33312E] text-white placeholder:text-white/30 min-h-[120px] focus:border-[#D2A53C] focus:ring-1 focus:ring-[#D2A53C] ${errors.bio ? 'border-red-500' : ''}`}
                  data-testid="textarea-bio"
                />
                <p className="text-sm text-[#F5F5F0]/50 text-right">
                  {maxBioLength - bioLength} {t('charactersRemaining')}
                </p>
              </div>
              
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label className="text-[#F5F5F0]">{t('logoUpload')}</Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#33312E] bg-[#1A1917] p-6 text-center cursor-pointer hover:border-[#D2A53C] transition-colors"
                  data-testid="file-upload-area"
                >
                  {logoPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img 
                        src={logoPreview} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded"
                      />
                      <span className="text-sm text-[#D2A53C]">{logoFile?.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-[#D2A53C]" />
                      <span className="text-sm text-[#F5F5F0]/50">{t('uploadLabel')}</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="input-file"
                  />
                </div>
              </div>
              
              {/* Language Preference */}
              <div className="space-y-2">
                <Label className="text-[#F5F5F0]">{t('languagePreference')}</Label>
                <Select 
                  value={formData.language_preference} 
                  onValueChange={(value) => handleInputChange('language_preference', value)}
                >
                  <SelectTrigger 
                    className="bg-[#1A1917] border-[#33312E] text-white h-12 focus:border-[#D2A53C] focus:ring-1 focus:ring-[#D2A53C]"
                    data-testid="select-language-preference"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1917] border-[#33312E]">
                    <SelectItem value="fr" className="text-white hover:bg-[#2A2825] focus:bg-[#2A2825]">
                      {t('french')}
                    </SelectItem>
                    <SelectItem value="en" className="text-white hover:bg-[#2A2825] focus:bg-[#2A2825]">
                      {t('english')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* How Heard */}
              <div className="space-y-2">
                <Label className="text-[#F5F5F0]">
                  {t('howHeard')} <span className="text-[#D2A53C]">*</span>
                </Label>
                <Select 
                  value={formData.how_heard} 
                  onValueChange={(value) => handleInputChange('how_heard', value)}
                >
                  <SelectTrigger 
                    className={`bg-[#1A1917] border-[#33312E] text-white h-12 focus:border-[#D2A53C] focus:ring-1 focus:ring-[#D2A53C] ${errors.how_heard ? 'border-red-500' : ''}`}
                    data-testid="select-how-heard"
                  >
                    <SelectValue placeholder={t('selectHowHeard')} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1917] border-[#33312E]">
                    {howHeardOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="text-white hover:bg-[#2A2825] focus:bg-[#2A2825]"
                      >
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-[#D2A53C] text-[#0C0B09] font-semibold text-base hover:bg-[#E5B84D] hover:shadow-[0_0_20px_rgba(210,165,60,0.3)] transition-all duration-300 disabled:opacity-50"
                data-testid="submit-button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  t('submit')
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};
