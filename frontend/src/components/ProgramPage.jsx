import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCMSProgram, useCMSTheme } from '../hooks/useCMSContent';
import { useIntersectionObserver } from '../hooks/useAnimations';
import { ArrowLeft, Calendar, MapPin, Clock, User, Loader2, Download } from 'lucide-react';
import { Button } from './ui/button';
import { LegalFooter } from './legal';

// Animated Day Card with timeline
const AnimatedDayCard = ({ day, dayIdx, totalDays }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.15 });
  const [hasPulsed, setHasPulsed] = useState(false);
  const isHighlight = day.is_highlight;
  const isLast = dayIdx === totalDays - 1;
  const direction = dayIdx % 2 === 0 ? 'left' : 'right';
  
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Pulse effect for highlight card
  useEffect(() => {
    if (isVisible && isHighlight && !hasPulsed) {
      setHasPulsed(true);
    }
  }, [isVisible, isHighlight, hasPulsed]);

  const getTransform = () => {
    if (prefersReducedMotion) return 'none';
    if (!isVisible) {
      if (isHighlight) {
        return 'translateY(40px) scale(0.95)';
      }
      return direction === 'left' ? 'translateX(-60px)' : 'translateX(60px)';
    }
    return 'translateX(0) translateY(0) scale(1)';
  };

  return (
    <div 
      ref={ref}
      className="relative"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: prefersReducedMotion 
          ? 'opacity 0.3s ease-out' 
          : `opacity 0.6s ease-out ${dayIdx * 0.15}s, transform 0.6s ease-out ${dayIdx * 0.15}s`,
      }}
    >
      {/* Timeline connector */}
      {dayIdx < totalDays - 1 && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-terracotta/30 transition-all duration-700"
          style={{
            top: '100%',
            height: isVisible ? '2rem' : '0',
            transitionDelay: `${dayIdx * 0.15 + 0.3}s`
          }}
        />
      )}

      <div 
        className={`rounded-2xl overflow-hidden border-2 transition-all duration-500 ${
          isHighlight 
            ? `border-terracotta bg-terracotta/5 ${hasPulsed && isVisible ? 'animate-pulse-border-3x' : ''}` 
            : 'border-charcoal/10 bg-white hover:border-charcoal/20'
        }`}
        data-testid={`program-day-${dayIdx + 1}`}
      >
        {/* Day Header */}
        <div 
          className={`px-6 py-5 ${
            isHighlight 
              ? 'bg-terracotta text-white' 
              : 'bg-charcoal text-cream'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl mb-1">
                {day.label || `Jour ${dayIdx + 1}`}
              </h2>
              <div className="flex items-center gap-2 opacity-80">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{day.site || 'Fort-de-France'}</span>
              </div>
            </div>
            {isHighlight && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                JOURNÉE PRINCIPALE
              </span>
            )}
          </div>
        </div>

        {/* Slots */}
        <div className="divide-y divide-charcoal/10">
          {(!day.slots || day.slots.length === 0) ? (
            <div className="px-6 py-8 text-center text-charcoal/40">
              Programme à venir
            </div>
          ) : (
            day.slots.map((slot, slotIdx) => (
              <SlotItem 
                key={slotIdx} 
                slot={slot} 
                isHighlight={isHighlight}
                slotIdx={slotIdx}
                parentVisible={isVisible}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Individual slot with staggered animation
const SlotItem = ({ slot, isHighlight, slotIdx, parentVisible }) => {
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div 
      className="px-6 py-4 flex gap-4 sm:gap-6 items-start hover:bg-charcoal/5 transition-colors"
      style={{
        opacity: parentVisible ? 1 : 0,
        transform: parentVisible ? 'translateY(0)' : 'translateY(10px)',
        transition: prefersReducedMotion 
          ? 'opacity 0.2s ease-out' 
          : `opacity 0.4s ease-out ${slotIdx * 0.1}s, transform 0.4s ease-out ${slotIdx * 0.1}s`,
      }}
    >
      {/* Time */}
      <div 
        className="flex-shrink-0 w-16 sm:w-20 text-right"
        style={{ color: isHighlight ? '#A65D47' : '#C8922A' }}
      >
        <div className="flex items-center justify-end gap-1">
          <Clock className="w-3 h-3 opacity-70" />
          <span className="font-mono font-bold">
            {slot.time || '--:--'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-charcoal mb-1">
          {slot.title || 'Sans titre'}
        </h3>
        {slot.description && (
          <p className="text-sm text-charcoal/60 mb-2">
            {slot.description}
          </p>
        )}
        {slot.speaker && (
          <div className="flex items-center gap-1 text-xs text-sage">
            <User className="w-3 h-3" />
            <span>{slot.speaker}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ProgramPage = () => {
  const navigate = useNavigate();
  const { program, intro, loading: programLoading, error: programError } = useCMSProgram();
  const { theme, loading: themeLoading } = useCMSTheme();
  const [heroVisible, setHeroVisible] = useState(false);

  const loading = programLoading || themeLoading;
  const primaryColor = theme?.primary_color || '#A65D47';

  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero animation trigger
  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
      </div>
    );
  }

  if (programError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-paper">
        <h1 className="text-2xl font-bold text-charcoal">Erreur de chargement</h1>
        <p className="text-charcoal/60">{programError}</p>
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-charcoal/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-charcoal/60 hover:text-terracotta transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Retour</span>
          </button>
          <h1 className="font-serif text-xl text-charcoal">Culture Connect 2026</h1>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Hero with animations */}
      <section className="py-16 sm:py-24 bg-charcoal text-cream overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 text-center">
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ 
              backgroundColor: `${primaryColor}20`,
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(-20px)',
              transition: prefersReducedMotion ? 'opacity 0.3s' : 'opacity 0.5s ease-out, transform 0.5s ease-out',
            }}
          >
            <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="text-sm font-medium" style={{ color: primaryColor }}>
              20-23 Mai 2026
            </span>
          </div>

          {/* Title - drops from above */}
          <h1 
            className="font-serif text-4xl sm:text-5xl lg:text-6xl mb-4"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(-30px)',
              transition: prefersReducedMotion 
                ? 'opacity 0.3s ease-out' 
                : 'opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s',
            }}
          >
            {intro?.title || 'Programme Officiel'}
          </h1>

          {/* Subtitle - fades up */}
          <p 
            className="text-lg text-cream/70 max-w-2xl mx-auto"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: prefersReducedMotion 
                ? 'opacity 0.3s ease-out' 
                : 'opacity 0.6s ease-out 0.4s, transform 0.6s ease-out 0.4s',
            }}
          >
            {intro?.text || '4 jours de rencontres professionnelles au cœur de Fort-de-France, Martinique.'}
          </p>
        </div>
      </section>

      {/* Timeline section */}
      <section className="py-16 relative">
        {/* Vertical timeline line */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-terracotta/20 hidden sm:block" />
        
        <div className="max-w-4xl mx-auto px-4 relative">
          {(!program || program.length === 0) ? (
            <div className="text-center py-12 text-charcoal/50">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Le programme sera bientôt disponible.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {program.map((day, dayIdx) => (
                <AnimatedDayCard 
                  key={day.id || dayIdx}
                  day={day}
                  dayIdx={dayIdx}
                  totalDays={program.length}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Download CTA */}
      <section className="py-12 bg-charcoal/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="font-serif text-2xl text-charcoal mb-4">
            Téléchargez le programme complet
          </h3>
          <p className="text-charcoal/60 mb-6">
            Recevez le programme détaillé au format PDF avec tous les horaires et intervenants.
          </p>
          <Button 
            className="bg-terracotta hover:bg-terracotta/90 text-white"
            onClick={() => alert('Fonctionnalité bientôt disponible')}
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger le PDF
          </Button>
        </div>
      </section>

      {/* Footer */}
      <LegalFooter />

      {/* Animation styles */}
      <style>{`
        @keyframes pulse-border-3x {
          0%, 100% { box-shadow: 0 0 0 0 rgba(166, 93, 71, 0); }
          16.67%, 50%, 83.33% { box-shadow: 0 0 0 4px rgba(166, 93, 71, 0.4); }
          33.33%, 66.67% { box-shadow: 0 0 0 0 rgba(166, 93, 71, 0); }
        }
        .animate-pulse-border-3x {
          animation: pulse-border-3x 1.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProgramPage;
