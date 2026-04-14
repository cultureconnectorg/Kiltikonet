import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ChevronDown, Search, HelpCircle, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Reveal } from '../hooks/useAnimations';

const API = process.env.REACT_APP_BACKEND_URL;

const FAQItem = ({ faq, language, isOpen, onToggle }) => (
  <div
    className={`border transition-colors ${isOpen ? 'border-terracotta/30 bg-terracotta/5' : 'border-lightborder bg-paper hover:border-terracotta/20'}`}
    data-testid={`faq-item-${faq.id}`}
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-5 text-left"
    >
      <span className="font-serif text-base text-charcoal pr-4">
        {language === 'fr' ? faq.question_fr : faq.question_en}
      </span>
      <ChevronDown
        className={`w-5 h-5 text-terracotta flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
    {isOpen && (
      <div className="px-5 pb-5 text-sm text-charcoal/70 leading-relaxed border-t border-lightborder pt-4">
        {language === 'fr' ? faq.answer_fr : faq.answer_en}
      </div>
    )}
  </div>
);

export const FAQPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const url = activeCategory
          ? `${API}/api/faq?category=${activeCategory}`
          : `${API}/api/faq`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setFaqs(data.faqs || []);
          setCategories(data.categories || []);
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [activeCategory]);

  const categoryLabels = {
    general: { fr: 'Général', en: 'General' },
    jetons: { fr: 'Jetons KT', en: 'KT Tokens' },
    technique: { fr: 'Technique', en: 'Technical' },
    evenement: { fr: 'Événement', en: 'Event' },
    partenariat: { fr: 'Partenariat', en: 'Partnership' },
  };

  const filtered = faqs.filter(f => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (f.question_fr?.toLowerCase().includes(q) || f.answer_fr?.toLowerCase().includes(q) ||
            f.question_en?.toLowerCase().includes(q) || f.answer_en?.toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-paper pt-24 sm:pt-32" data-testid="faq-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Reveal>
          <div className="text-center mb-12">
            <p className="text-terracotta font-syne text-sm tracking-widest uppercase mb-4">
              {language === 'fr' ? 'Centre d\'aide' : 'Help Center'}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-4">
              {language === 'fr' ? 'Questions fréquentes' : 'Frequently Asked Questions'}
            </h1>
            <p className="text-charcoal/60 text-base">
              {language === 'fr'
                ? 'Trouvez rapidement les réponses à vos questions.'
                : 'Quickly find answers to your questions.'}
            </p>
          </div>
        </Reveal>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={language === 'fr' ? 'Rechercher une question...' : 'Search a question...'}
            className="w-full h-12 pl-12 pr-4 bg-cream border border-lightborder text-charcoal rounded-none font-body text-sm focus:border-terracotta focus:outline-none"
            data-testid="faq-search"
          />
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 text-sm font-syne transition-all border ${
                !activeCategory ? 'border-terracotta bg-terracotta text-paper' : 'border-lightborder text-charcoal/60 hover:border-terracotta'
              }`}
              data-testid="faq-filter-all"
            >
              {language === 'fr' ? 'Tout' : 'All'}
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-sm font-syne transition-all border ${
                  activeCategory === cat ? 'border-terracotta bg-terracotta text-paper' : 'border-lightborder text-charcoal/60 hover:border-terracotta'
                }`}
                data-testid={`faq-filter-${cat}`}
              >
                {categoryLabels[cat]?.[language] || cat}
              </button>
            ))}
          </div>
        )}

        {/* FAQ list */}
        {loading ? (
          <div className="text-center py-12 text-charcoal/40">
            <HelpCircle className="w-8 h-8 mx-auto mb-3 animate-pulse" />
            <p className="text-sm">{language === 'fr' ? 'Chargement...' : 'Loading...'}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-8 h-8 mx-auto mb-3 text-charcoal/30" />
            <p className="text-charcoal/50">
              {language === 'fr' ? 'Aucune question trouvée.' : 'No questions found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(faq => (
              <FAQItem
                key={faq.id}
                faq={faq}
                language={language}
                isOpen={openId === faq.id}
                onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
              />
            ))}
          </div>
        )}

        {/* Contact CTA */}
        <Reveal>
          <div className="mt-16 text-center border border-lightborder bg-cream p-8">
            <MessageSquare className="w-8 h-8 text-sage mx-auto mb-4" />
            <h3 className="font-serif text-xl text-charcoal mb-2">
              {language === 'fr' ? 'Vous ne trouvez pas votre réponse ?' : 'Can\'t find your answer?'}
            </h3>
            <p className="text-charcoal/60 text-sm mb-6">
              {language === 'fr'
                ? 'Contactez notre équipe ou soumettez une demande de support.'
                : 'Contact our team or submit a support request.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:contact@kiltikonet.fr"
                className="px-6 py-3 bg-charcoal text-paper font-syne text-sm hover:bg-charcoal/90 transition-colors"
              >
                contact@kiltikonet.fr
              </a>
              <button
                onClick={() => navigate('/support')}
                className="px-6 py-3 border border-terracotta text-terracotta font-syne text-sm hover:bg-terracotta hover:text-paper transition-colors"
                data-testid="faq-support-link"
              >
                {language === 'fr' ? 'Ouvrir un ticket' : 'Open a ticket'}
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
};

export default FAQPage;
