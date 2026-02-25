import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  ArrowRight, MapPin, Calendar, Users, Globe, Layers,
  Mail, Instagram, Linkedin, Send, ChevronDown, Star
} from 'lucide-react';
import { toast } from 'sonner';

export const LandingPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [contactForm, setContactForm] = React.useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
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
      { threshold: 0.1 }
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(language === 'fr' ? 'Message envoyé !' : 'Message sent!');
    setContactForm({ name: '', email: '', message: '' });
    setIsSubmitting(false);
  };
  
  const programDays = [
    { day: 'Mer. 20 Mai', title: language === 'fr' ? 'Accueil & Accréditations' : 'Welcome', location: 'Bibliothèque Schœlcher' },
    { day: 'Jeu. 21 Mai', title: language === 'fr' ? 'Débats Industrie' : 'Industry Debates', location: 'Atrium' },
    { day: 'Ven. 22 Mai', title: language === 'fr' ? 'Marché Culturel' : 'Cultural Market', location: 'La Savane', highlight: true },
    { day: 'Sam. 23 Mai', title: language === 'fr' ? 'Brunch & Clôture' : 'Brunch & Closing', location: 'Fort-de-France' }
  ];
  
  const partners = [
    'CTM', 'Skillfor Campus', 'ISCA Business School', 'France Travail', 'SACEM', 'Factory Maker Studio', 'Direction des Affaires Culturelles'
  ];

  return (
    <div className="min-h-screen bg-paper">
      {/* HERO */}
      <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 lg:pt-48 lg:pb-40" data-testid="hero-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            {/* Eyebrow */}
            <p className="text-terracotta font-syne text-sm tracking-widest uppercase mb-6">
              Fort-de-France, Martinique · 20—23 Mai 2026
            </p>
            
            {/* Logo */}
            <div className="mb-8">
              <img 
                src="/logo.png" 
                alt="Culture Connect" 
                className="h-20 sm:h-24 lg:h-28 w-auto"
              />
            </div>
            
            {/* Title */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-charcoal leading-tight mb-6">
              {language === 'fr' 
                ? 'Marché professionnel des industries culturelles afro-descendantes'
                : 'Professional market for Afro-descendant cultural industries'
              }
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-charcoal/70 font-body max-w-2xl mb-10">
              {language === 'fr'
                ? 'Connecter la diaspora et les territoires d\'origine pour façonner l\'avenir de la culture caribéenne.'
                : 'Connecting the diaspora and territories of origin to shape the future of Caribbean culture.'
              }
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate('/pricing')}
                className="h-14 px-8 bg-terracotta text-paper font-syne text-sm tracking-wide hover:bg-terracotta/90 rounded-none"
                data-testid="hero-cta-register"
              >
                {language === 'fr' ? "Demander une accréditation" : "Request accreditation"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button
                onClick={() => scrollToSection('programme')}
                variant="outline"
                className="h-14 px-8 border-charcoal text-charcoal font-syne text-sm tracking-wide hover:bg-charcoal hover:text-paper rounded-none"
                data-testid="hero-cta-program"
              >
                {language === 'fr' ? "Découvrir le programme" : "Discover the program"}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <button 
          onClick={() => scrollToSection('vision')}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-charcoal/40 hover:text-terracotta transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-lightborder" />
      </div>

      {/* VISION */}
      <section id="vision" className="py-24 sm:py-32" data-testid="vision-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-on-scroll">
              <p className="text-terracotta font-syne text-sm tracking-widest uppercase mb-4">
                {language === 'fr' ? 'Notre vision' : 'Our vision'}
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-charcoal mb-6">
                {language === 'fr' 
                  ? 'Une plateforme pour les industries culturelles afro-descendantes'
                  : 'A platform for Afro-descendant cultural industries'
                }
              </h2>
              <p className="text-charcoal/70 font-body text-lg leading-relaxed">
                {language === 'fr'
                  ? 'Culture Connect relie la diaspora et les territoires d\'origine pour co-construire des stratégies d\'avenir. Un espace de rencontre entre artistes, labels, institutions et professionnels de la culture.'
                  : 'Culture Connect connects the diaspora and territories of origin to co-build future strategies. A meeting space for artists, labels, institutions and cultural professionals.'
                }
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Globe, title: language === 'fr' ? 'Connecter' : 'Connect' },
                { icon: Layers, title: language === 'fr' ? 'Structurer' : 'Structure' },
                { icon: Star, title: language === 'fr' ? 'Rayonner' : 'Shine' }
              ].map((item, i) => (
                <div 
                  key={item.title}
                  className="animate-on-scroll text-center p-6 border border-lightborder bg-cream"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <item.icon className="w-8 h-8 text-sage mx-auto mb-4" />
                  <p className="font-syne text-sm text-charcoal">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMME */}
      <section id="programme" className="py-24 sm:py-32 bg-cream" data-testid="programme-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <p className="text-terracotta font-syne text-sm tracking-widest uppercase mb-4">
              {language === 'fr' ? '4 jours d\'événements' : '4 days of events'}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-charcoal">
              Programme
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {programDays.map((day, i) => (
              <div 
                key={day.day}
                className={`animate-on-scroll p-6 border bg-paper ${
                  day.highlight 
                    ? 'border-terracotta' 
                    : 'border-lightborder'
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {day.highlight && (
                  <p className="text-terracotta font-syne text-xs tracking-widest uppercase mb-3">
                    {language === 'fr' ? 'Jour principal' : 'Main day'}
                  </p>
                )}
                <p className={`text-sm mb-2 ${day.highlight ? 'text-terracotta' : 'text-charcoal/50'}`}>
                  {day.day}
                </p>
                <h3 className="font-serif text-xl text-charcoal mb-3">{day.title}</h3>
                <p className="text-sm text-charcoal/50 flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  {day.location}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARCHÉ */}
      <section className="py-24 sm:py-32" data-testid="marche-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: language === 'fr' ? 'Stands Accrédités' : 'Accredited Stands', num: '40-60' },
                  { title: language === 'fr' ? 'Scène Démo' : 'Demo Stage', num: 'Live' },
                  { title: 'Networking B2B', num: 'VIP' },
                  { title: language === 'fr' ? 'Institutions' : 'Institutions', num: '5+' }
                ].map((item, i) => (
                  <div 
                    key={item.title}
                    className="animate-on-scroll p-6 border border-lightborder bg-cream"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <p className="font-serif text-2xl text-terracotta mb-2">{item.num}</p>
                    <p className="text-sm text-charcoal/70">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="order-1 lg:order-2 animate-on-scroll">
              <p className="text-terracotta font-syne text-sm tracking-widest uppercase mb-4">
                22 Mai 2026
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-charcoal mb-6">
                {language === 'fr' ? 'Le Marché Culturel' : 'The Cultural Market'}
              </h2>
              <p className="text-charcoal/70 font-body text-lg leading-relaxed mb-4">
                {language === 'fr'
                  ? 'Un espace de rencontre unique pour les professionnels de l\'industrie musicale et culturelle caribéenne. Exposants, showcases live, rencontres B2B.'
                  : 'A unique meeting space for Caribbean music and cultural industry professionals. Exhibitors, live showcases, B2B meetings.'
                }
              </p>
              <p className="text-charcoal/50 text-sm italic">
                Inspiré du Mercado Cultural del Caribe
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PARTENAIRES */}
      <section id="partenaires" className="py-24 sm:py-32 bg-cream" data-testid="partenaires-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <p className="text-sage font-syne text-sm tracking-widest uppercase mb-4">
              {language === 'fr' ? 'Nos soutiens' : 'Our supporters'}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-charcoal">
              {language === 'fr' ? 'Ils soutiennent Culture Connect' : 'They support Culture Connect'}
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-12">
            {partners.map((partner, i) => (
              <div 
                key={partner}
                className="animate-on-scroll p-4 border border-lightborder bg-paper flex items-center justify-center min-h-[80px]"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-charcoal/50 text-xs font-syne text-center">{partner}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center animate-on-scroll">
            <button 
              onClick={() => {
                navigate('/partnership');
                setTimeout(() => {
                  document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="text-terracotta hover:text-terracotta/80 font-syne text-sm tracking-wide underline underline-offset-4 transition-colors"
            >
              {language === 'fr' ? 'Devenir partenaire →' : 'Become a partner →'}
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32 bg-charcoal" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl text-paper mb-6">
            {language === 'fr' ? 'Rejoignez Culture Connect 2026' : 'Join Culture Connect 2026'}
          </h2>
          <p className="text-paper/70 font-body text-lg mb-10 max-w-2xl mx-auto">
            {language === 'fr' 
              ? 'Artistes, labels, institutions, presse — déposez votre dossier d\'accréditation'
              : 'Artists, labels, institutions, press — submit your accreditation request'
            }
          </p>
          <Button
            onClick={() => navigate('/pricing')}
            className="h-14 px-10 bg-terracotta text-paper font-syne text-sm tracking-wide hover:bg-terracotta/90 rounded-none"
          >
            {language === 'fr' ? "S'accréditer maintenant" : "Register now"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 sm:py-32" data-testid="contact-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div className="animate-on-scroll">
              <p className="text-terracotta font-syne text-sm tracking-widest uppercase mb-4">
                Contact
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-charcoal mb-6">
                {language === 'fr' ? 'Restons en contact' : 'Stay in touch'}
              </h2>
              
              <div className="space-y-4 mb-8">
                <a 
                  href="mailto:cultureconnectorg@gmail.com" 
                  className="flex items-center gap-3 text-charcoal/70 hover:text-terracotta transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  cultureconnectorg@gmail.com
                </a>
              </div>
              
              <div className="flex items-center gap-4">
                <a 
                  href="https://www.instagram.com/culturconnect?igsh=ODB1cXF1enVya3cz&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 border border-lightborder flex items-center justify-center text-charcoal/50 hover:text-terracotta hover:border-terracotta transition-all"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="w-12 h-12 border border-lightborder flex items-center justify-center text-charcoal/50 hover:text-terracotta hover:border-terracotta transition-all"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <form 
              onSubmit={handleContactSubmit}
              className="animate-on-scroll space-y-5"
              style={{ animationDelay: '150ms' }}
            >
              <Input
                type="text"
                placeholder={language === 'fr' ? 'Votre nom' : 'Your name'}
                value={contactForm.name}
                onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                className="h-12 bg-cream border-lightborder text-charcoal placeholder:text-charcoal/40 rounded-none focus:border-terracotta"
                required
              />
              <Input
                type="email"
                placeholder={language === 'fr' ? 'Votre email' : 'Your email'}
                value={contactForm.email}
                onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                className="h-12 bg-cream border-lightborder text-charcoal placeholder:text-charcoal/40 rounded-none focus:border-terracotta"
                required
              />
              <Textarea
                placeholder={language === 'fr' ? 'Votre message' : 'Your message'}
                value={contactForm.message}
                onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                className="bg-cream border-lightborder text-charcoal placeholder:text-charcoal/40 min-h-[120px] rounded-none focus:border-terracotta"
                required
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-charcoal text-paper font-syne text-sm tracking-wide hover:bg-charcoal/90 rounded-none"
              >
                <Send className="w-4 h-4 mr-2" />
                {language === 'fr' ? 'Envoyer' : 'Send'}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-lightborder" data-testid="footer">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-charcoal/50">
            <p>Culture Connect 2026 · Fort-de-France, Martinique</p>
            <p>Factory Maker Studio</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
