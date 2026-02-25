import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  Link2, Layers, Sparkles, Calendar, MapPin, Users, 
  Mic2, Building2, GraduationCap, Star, Mail, 
  Instagram, Linkedin, Send, ChevronDown, Music,
  Globe, Handshake, Megaphone
} from 'lucide-react';
import { toast } from 'sonner';

export const LandingPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Intersection Observer for scroll animations
  const observerRef = useRef(null);
  
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    
    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observerRef.current.observe(el);
    });
    
    return () => observerRef.current?.disconnect();
  }, []);
  
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(language === 'fr' ? 'Message envoyé !' : 'Message sent!');
    setContactForm({ name: '', email: '', message: '' });
    setIsSubmitting(false);
  };
  
  const programDays = [
    {
      day: 'Mer. 20 Mai',
      title: language === 'fr' ? 'Accueil & Accréditations' : 'Welcome & Accreditations',
      location: 'Bibliothèque Schœlcher',
      extra: language === 'fr' ? 'Mini-scène rue piétonne' : 'Mini-stage pedestrian street',
      highlight: false
    },
    {
      day: 'Jeu. 21 Mai',
      title: language === 'fr' ? 'Débats Industrie' : 'Industry Debates',
      location: 'Atrium',
      extra: language === 'fr' ? 'Networking · Mini-concert' : 'Networking · Mini-concert',
      highlight: false
    },
    {
      day: 'Ven. 22 Mai',
      title: language === 'fr' ? 'Journée Mondiale de la Culture Africaine' : 'World Day for African Culture',
      location: 'La Savane',
      extra: language === 'fr' ? 'Grande table ronde · Marché Culturel (40-60 stands) · Grand Concert' : 'Main roundtable · Cultural Market (40-60 stands) · Grand Concert',
      highlight: true
    },
    {
      day: 'Sam. 23 Mai',
      title: language === 'fr' ? 'Brunch & Clôture' : 'Brunch & Closing',
      location: 'Fort-de-France',
      extra: 'Networking',
      highlight: false
    }
  ];
  
  const marketZones = [
    { icon: Users, title: language === 'fr' ? 'Stands Accrédités' : 'Accredited Stands', desc: language === 'fr' ? 'Artistes, labels, agences' : 'Artists, labels, agencies' },
    { icon: Mic2, title: language === 'fr' ? 'Scène Démo' : 'Demo Stage', desc: language === 'fr' ? 'Showcases live' : 'Live showcases' },
    { icon: Handshake, title: 'Networking B2B', desc: language === 'fr' ? 'Rendez-vous professionnels' : 'Professional meetings' },
    { icon: Globe, title: language === 'fr' ? 'Stand Ambassadeurs' : 'Ambassador Stand', desc: language === 'fr' ? 'Diaspora & Territoires' : 'Diaspora & Territories' },
    { icon: GraduationCap, title: language === 'fr' ? 'Institutions & Formation' : 'Institutions & Training', desc: language === 'fr' ? 'Écoles, pôles emploi' : 'Schools, employment centers' }
  ];
  
  const partners = [
    'CTM', 'Skillfor Campus', 'ISCA Business School', 'Pôle Emploi', 'SACEM', 'Factory Maker Studio'
  ];
  
  return (
    <div className="min-h-screen bg-[#0C0B09]">
      {/* HERO SECTION */}
      <section 
        id="hero" 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        data-testid="hero-section"
      >
        {/* Particle Animation Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="particles-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0C0B09] via-transparent to-[#0C0B09] opacity-80" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="Culture Connect" 
              className="h-32 sm:h-40 lg:h-48 w-auto"
              data-testid="hero-logo"
            />
          </div>
          <h1 
            className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#D2A53C] mb-6 tracking-tight"
            data-testid="hero-title"
          >
            2026
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-[#EDE8DC] mb-4 font-light tracking-wide">
            Marché Culturel · Fort-de-France · 20→23 Mai 2026
          </p>
          
          <p className="text-base text-[#EDE8DC]/60 mb-10 max-w-2xl mx-auto">
            {language === 'fr' 
              ? 'Industries culturelles afro-descendantes de la Caraïbe'
              : 'Afro-descendant cultural industries of the Caribbean'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => navigate('/pricing')}
              className="h-14 px-8 bg-[#D2A53C] text-[#0C0B09] font-semibold text-base hover:bg-[#E5B84D] hover:shadow-[0_0_30px_rgba(210,165,60,0.4)] transition-all duration-300"
              data-testid="hero-cta-register"
            >
              {language === 'fr' ? "Demander une accréditation" : "Request accreditation"}
            </Button>
            
            <Button
              onClick={() => scrollToSection('programme')}
              variant="outline"
              className="h-14 px-8 border-[#D2A53C] text-[#D2A53C] font-semibold hover:bg-[#D2A53C] hover:text-[#0C0B09] transition-all duration-300"
              data-testid="hero-cta-program"
            >
              {language === 'fr' ? "Découvrir le programme" : "Discover the program"}
            </Button>
          </div>
          
          {/* Scroll indicator */}
          <button 
            onClick={() => scrollToSection('vision')}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#D2A53C]/60 hover:text-[#D2A53C] transition-colors animate-bounce"
            aria-label="Scroll down"
          >
            <ChevronDown className="w-8 h-8" />
          </button>
        </div>
      </section>
      
      {/* VISION SECTION */}
      <section 
        id="vision" 
        className="py-20 sm:py-28 lg:py-36 bg-[#0C0B09]"
        data-testid="vision-section"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#D2A53C] text-center mb-6">
              {language === 'fr' 
                ? 'Une plateforme pour les industries culturelles afro-descendantes'
                : 'A platform for Afro-descendant cultural industries'
              }
            </h2>
            
            <p className="text-[#EDE8DC]/70 text-center max-w-3xl mx-auto mb-16 text-lg leading-relaxed">
              {language === 'fr'
                ? 'Culture Connect relie la diaspora et les territoires d\'origine pour co-construire des stratégies d\'avenir dans les industries culturelles afro-descendantes.'
                : 'Culture Connect connects the diaspora and territories of origin to co-build future strategies in Afro-descendant cultural industries.'
              }
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              { icon: Link2, title: language === 'fr' ? 'Connecter' : 'Connect', desc: language === 'fr' ? 'Créer des ponts entre artistes, labels et institutions à travers la diaspora' : 'Build bridges between artists, labels and institutions across the diaspora' },
              { icon: Layers, title: language === 'fr' ? 'Structurer' : 'Structure', desc: language === 'fr' ? 'Développer des filières professionnelles durables' : 'Develop sustainable professional sectors' },
              { icon: Sparkles, title: language === 'fr' ? 'Rayonner' : 'Shine', desc: language === 'fr' ? 'Porter les cultures afro-descendantes sur la scène internationale' : 'Bring Afro-descendant cultures to the international stage' }
            ].map((item, index) => (
              <div 
                key={item.title}
                className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 text-center"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-[#D2A53C]/10 rounded-full flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-[#D2A53C]" />
                </div>
                <h3 className="font-serif text-2xl text-[#EDE8DC] mb-3">{item.title}</h3>
                <p className="text-[#EDE8DC]/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* PROGRAMME SECTION */}
      <section 
        id="programme" 
        className="py-20 sm:py-28 bg-[#141311]"
        data-testid="programme-section"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#D2A53C] text-center mb-4">
              Programme
            </h2>
            <p className="text-[#EDE8DC]/60 text-center mb-12">
              {language === 'fr' ? '4 jours d\'échanges et de création' : '4 days of exchange and creation'}
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {programDays.map((day, index) => (
              <div 
                key={day.day}
                className={`animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 p-6 border ${
                  day.highlight 
                    ? 'bg-[#D2A53C]/10 border-[#D2A53C]' 
                    : 'bg-[#1A1917] border-[#2A2825]'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                data-testid={`program-day-${index + 1}`}
              >
                {day.highlight && (
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-[#D2A53C] fill-[#D2A53C]" />
                    <span className="text-xs font-medium text-[#D2A53C] uppercase tracking-wider">
                      {language === 'fr' ? 'Jour Principal' : 'Main Day'}
                    </span>
                  </div>
                )}
                <p className={`text-sm font-medium mb-2 ${day.highlight ? 'text-[#D2A53C]' : 'text-[#EDE8DC]/60'}`}>
                  {day.day}
                </p>
                <h3 className={`font-serif text-xl mb-3 ${day.highlight ? 'text-[#D2A53C]' : 'text-[#EDE8DC]'}`}>
                  {day.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-[#EDE8DC]/50 mb-2">
                  <MapPin className="w-3 h-3" />
                  {day.location}
                </div>
                <p className="text-sm text-[#EDE8DC]/40">{day.extra}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* MARCHÉ CULTUREL SECTION */}
      <section 
        id="marche" 
        className="py-20 sm:py-28 bg-[#0C0B09]"
        data-testid="marche-section"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-[#D2A53C]" />
              <span className="text-[#D2A53C] font-medium">22 Mai 2026</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#EDE8DC] text-center mb-4">
              {language === 'fr' ? 'Le Marché Culturel' : 'The Cultural Market'}
            </h2>
            <p className="text-[#EDE8DC]/50 text-center mb-12 italic">
              Inspiré du Mercado Cultural del Caribe
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {marketZones.map((zone, index) => (
              <div 
                key={zone.title}
                className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 bg-[#141311] border border-[#2A2825] p-5 hover:border-[#D2A53C]/50 transition-colors"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <zone.icon className="w-8 h-8 text-[#D2A53C] mb-4" />
                <h3 className="font-serif text-lg text-[#EDE8DC] mb-2">{zone.title}</h3>
                <p className="text-sm text-[#EDE8DC]/50">{zone.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* PARTENAIRES SECTION */}
      <section 
        id="partenaires" 
        className="py-20 sm:py-28 bg-[#141311]"
        data-testid="partenaires-section"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="font-serif text-3xl sm:text-4xl text-[#D2A53C] text-center mb-4">
              {language === 'fr' ? 'Ils soutiennent Culture Connect' : 'They support Culture Connect'}
            </h2>
            <p className="text-[#EDE8DC]/50 text-center mb-12">
              {language === 'fr' ? 'Partenaires institutionnels et privés' : 'Institutional and private partners'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {partners.map((partner, index) => (
              <div 
                key={partner}
                className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 bg-[#1A1917] border border-[#2A2825] p-6 flex items-center justify-center min-h-[100px] hover:border-[#D2A53C]/30 transition-colors"
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <span className="text-[#EDE8DC]/40 text-sm font-medium text-center">{partner}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-10 animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <button 
              onClick={() => navigate('/partnership')}
              className="text-[#D2A53C] hover:text-[#E5B84D] font-medium underline underline-offset-4 transition-colors"
            >
              {language === 'fr' ? 'Devenir partenaire →' : 'Become a partner →'}
            </button>
          </div>
        </div>
      </section>
      
      {/* CTA SECTION */}
      <section 
        id="cta" 
        className="py-20 sm:py-28 bg-[#D2A53C]"
        data-testid="cta-section"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#0C0B09] mb-4">
            {language === 'fr' ? 'Rejoignez Culture Connect 2026' : 'Join Culture Connect 2026'}
          </h2>
          <p className="text-[#0C0B09]/70 mb-8 text-lg">
            {language === 'fr' 
              ? 'Artistes, labels, institutions, presse — déposez votre dossier d\'accréditation'
              : 'Artists, labels, institutions, press — submit your accreditation request'
            }
          </p>
          <Button
            onClick={() => navigate('/pricing')}
            className="h-14 px-10 bg-[#0C0B09] text-[#D2A53C] font-semibold text-base hover:bg-[#1A1917] transition-all duration-300"
            data-testid="cta-register-button"
          >
            {language === 'fr' ? "S'accréditer maintenant" : "Register now"}
          </Button>
        </div>
      </section>
      
      {/* CONTACT SECTION */}
      <section 
        id="contact" 
        className="py-20 sm:py-28 bg-[#0C0B09]"
        data-testid="contact-section"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Info */}
            <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
              <h2 className="font-serif text-3xl sm:text-4xl text-[#D2A53C] mb-6">
                Contact
              </h2>
              
              <div className="space-y-4 mb-8">
                <a 
                  href="mailto:cultureconnectorg@gmail.com" 
                  className="flex items-center gap-3 text-[#EDE8DC] hover:text-[#D2A53C] transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  cultureconnectorg@gmail.com
                </a>
              </div>
              
              <div className="flex items-center gap-4">
                <a 
                  href="#" 
                  className="w-10 h-10 bg-[#1A1917] border border-[#2A2825] flex items-center justify-center text-[#EDE8DC] hover:text-[#D2A53C] hover:border-[#D2A53C] transition-all"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-[#1A1917] border border-[#2A2825] flex items-center justify-center text-[#EDE8DC] hover:text-[#D2A53C] hover:border-[#D2A53C] transition-all"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            {/* Contact Form */}
            <form 
              onSubmit={handleContactSubmit}
              className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 space-y-4"
              style={{ transitionDelay: '150ms' }}
              data-testid="contact-form"
            >
              <Input
                type="text"
                placeholder={language === 'fr' ? 'Votre nom' : 'Your name'}
                value={contactForm.name}
                onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                className="bg-[#1A1917] border-[#2A2825] text-[#EDE8DC] placeholder:text-[#EDE8DC]/30 h-12 focus:border-[#D2A53C] focus:ring-1 focus:ring-[#D2A53C]"
                required
                data-testid="contact-name-input"
              />
              <Input
                type="email"
                placeholder={language === 'fr' ? 'Votre email' : 'Your email'}
                value={contactForm.email}
                onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                className="bg-[#1A1917] border-[#2A2825] text-[#EDE8DC] placeholder:text-[#EDE8DC]/30 h-12 focus:border-[#D2A53C] focus:ring-1 focus:ring-[#D2A53C]"
                required
                data-testid="contact-email-input"
              />
              <Textarea
                placeholder={language === 'fr' ? 'Votre message' : 'Your message'}
                value={contactForm.message}
                onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                className="bg-[#1A1917] border-[#2A2825] text-[#EDE8DC] placeholder:text-[#EDE8DC]/30 min-h-[120px] focus:border-[#D2A53C] focus:ring-1 focus:ring-[#D2A53C]"
                required
                data-testid="contact-message-input"
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-[#D2A53C] text-[#0C0B09] font-semibold hover:bg-[#E5B84D] hover:shadow-[0_0_20px_rgba(210,165,60,0.3)] transition-all duration-300"
                data-testid="contact-submit-button"
              >
                <Send className="w-4 h-4 mr-2" />
                {language === 'fr' ? 'Envoyer' : 'Send'}
              </Button>
            </form>
          </div>
        </div>
      </section>
      
      {/* FOOTER */}
      <footer className="py-8 bg-[#0C0B09] border-t border-[#2A2825]" data-testid="footer">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#EDE8DC]/40">
            <p>Culture Connect 2026 · Fort-de-France, Martinique</p>
            <p>Factory Maker Studio</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
