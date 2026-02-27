import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCMSProgram, useCMSTheme } from '../hooks/useCMSContent';
import { ArrowLeft, Calendar, MapPin, Clock, User, Loader2, Download } from 'lucide-react';
import { Button } from './ui/button';
import { LegalFooter } from './legal';

const ProgramPage = () => {
  const navigate = useNavigate();
  const { program, intro, loading: programLoading, error: programError } = useCMSProgram();
  const { theme, loading: themeLoading } = useCMSTheme();

  const loading = programLoading || themeLoading;

  // Theme colors with fallbacks
  const primaryColor = theme?.primary_color || '#A65D47';
  const secondaryColor = theme?.secondary_color || '#C8922A';
  const accentColor = theme?.accent_color || '#4A5D4E';
  const backgroundColor = '#F4F1EA'; // Keeping light background for readability
  const textColor = '#1A1A1A';

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
    <div className="min-h-screen bg-paper">
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

      {/* Hero */}
      <section className="py-16 sm:py-24 bg-charcoal text-cream">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="text-sm font-medium" style={{ color: primaryColor }}>
              20-23 Mai 2026
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl mb-4">
            {intro?.title || 'Programme Officiel'}
          </h1>
          <p className="text-lg text-cream/70 max-w-2xl mx-auto">
            {intro?.text || '4 jours de rencontres professionnelles au cœur de Fort-de-France, Martinique.'}
          </p>
        </div>
      </section>

      {/* Program Days */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          {(!program || program.length === 0) ? (
            <div className="text-center py-12 text-charcoal/50">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Le programme sera bientôt disponible.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {program.map((day, dayIdx) => (
                <div 
                  key={day.id || dayIdx}
                  className={`rounded-2xl overflow-hidden border-2 ${
                    day.is_highlight 
                      ? 'border-terracotta bg-terracotta/5' 
                      : 'border-charcoal/10 bg-white'
                  }`}
                  data-testid={`program-day-${dayIdx + 1}`}
                >
                  {/* Day Header */}
                  <div 
                    className={`px-6 py-5 ${
                      day.is_highlight 
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
                      {day.is_highlight && (
                        <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                          JOURNÉE SPÉCIALE
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
                        <div 
                          key={slotIdx}
                          className="px-6 py-4 flex gap-4 sm:gap-6 items-start hover:bg-charcoal/5 transition-colors"
                        >
                          {/* Time */}
                          <div 
                            className="flex-shrink-0 w-16 sm:w-20 text-right"
                            style={{ color: day.is_highlight ? primaryColor : secondaryColor }}
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
                              <div className="flex items-center gap-1 text-xs" style={{ color: accentColor }}>
                                <User className="w-3 h-3" />
                                <span>{slot.speaker}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
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
            onClick={() => {
              // TODO: Implement PDF download
              alert('Fonctionnalité bientôt disponible');
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger le PDF
          </Button>
        </div>
      </section>

      {/* Footer */}
      <LegalFooter />
    </div>
  );
};

export default ProgramPage;
