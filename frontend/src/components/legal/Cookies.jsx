import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft } from 'lucide-react';

export const Cookies = () => {
  const { language } = useLanguage();
  
  return (
    <div className="min-h-screen bg-paper pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-charcoal/50 hover:text-terracotta mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" />
          {language === 'fr' ? 'Retour' : 'Back'}
        </Link>
        
        <h1 className="font-serif text-3xl text-charcoal mb-8">
          {language === 'fr' ? 'Politique des Cookies' : 'Cookie Policy'}
        </h1>
        
        <div className="prose prose-sm max-w-none text-charcoal/80 space-y-6">
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '1. Qu\'est-ce qu\'un cookie ?' : '1. What is a Cookie?'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, tablette, smartphone) lors de la visite d\'un site web. Il permet au site de mémoriser des informations sur votre visite, comme vos préférences de langue.'
                : 'A cookie is a small text file placed on your device (computer, tablet, smartphone) when you visit a website. It allows the site to remember information about your visit, such as your language preferences.'
              }
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '2. Cookies utilisés sur ce site' : '2. Cookies Used on This Site'}
            </h2>
            
            <h3 className="font-syne text-base text-charcoal mt-4 mb-2">
              {language === 'fr' ? 'a) Cookies strictement nécessaires' : 'a) Strictly Necessary Cookies'}
            </h3>
            <p>
              {language === 'fr' 
                ? 'Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés.'
                : 'These cookies are essential for the website to function and cannot be disabled.'
              }
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><code className="bg-cream px-1">cc_consent</code> — {language === 'fr' ? 'Mémorise votre choix de consentement aux cookies' : 'Remembers your cookie consent choice'}</li>
              <li><code className="bg-cream px-1">language</code> — {language === 'fr' ? 'Mémorise votre préférence de langue (FR/EN)' : 'Remembers your language preference (FR/EN)'}</li>
            </ul>
            
            <h3 className="font-syne text-base text-charcoal mt-4 mb-2">
              {language === 'fr' ? 'b) Cookies de fonctionnalité' : 'b) Functionality Cookies'}
            </h3>
            <p>
              {language === 'fr' 
                ? 'Ces cookies permettent d\'améliorer votre expérience sur le site.'
                : 'These cookies help improve your experience on the site.'
              }
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><code className="bg-cream px-1">admin_session</code> — {language === 'fr' ? 'Session d\'administration (administrateurs uniquement)' : 'Admin session (administrators only)'}</li>
            </ul>
            
            <h3 className="font-syne text-base text-charcoal mt-4 mb-2">
              {language === 'fr' ? 'c) Cookies tiers' : 'c) Third-Party Cookies'}
            </h3>
            <p>
              {language === 'fr' 
                ? 'Ce site utilise des services tiers qui peuvent déposer leurs propres cookies :'
                : 'This site uses third-party services that may place their own cookies:'
              }
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Stripe</strong> — {language === 'fr' ? 'Traitement sécurisé des paiements' : 'Secure payment processing'}</li>
            </ul>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '3. Gestion de vos préférences' : '3. Managing Your Preferences'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'Lors de votre première visite, une bannière vous permet d\'accepter ou de refuser les cookies non essentiels. Vous pouvez modifier vos préférences à tout moment en cliquant sur le lien "Gérer les cookies" en bas de page.'
                : 'On your first visit, a banner allows you to accept or refuse non-essential cookies. You can change your preferences at any time by clicking the "Manage cookies" link at the bottom of the page.'
              }
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '4. Désactiver les cookies via votre navigateur' : '4. Disabling Cookies via Your Browser'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'Vous pouvez également configurer votre navigateur pour bloquer les cookies. Voici les liens vers les instructions des principaux navigateurs :'
                : 'You can also configure your browser to block cookies. Here are links to instructions for major browsers:'
              }
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">Chrome</a></li>
              <li><a href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies" target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">Firefox</a></li>
              <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge" target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">Edge</a></li>
            </ul>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '5. Durée de conservation' : '5. Retention Period'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'Les cookies déposés sur ce site ont une durée de vie maximale de 13 mois, conformément aux recommandations de la CNIL.'
                : 'Cookies placed on this site have a maximum lifespan of 13 months, in accordance with CNIL recommendations.'
              }
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '6. Contact' : '6. Contact'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'Pour toute question concernant notre utilisation des cookies, contactez-nous à : cultureconnectorg@gmail.com'
                : 'For any questions about our use of cookies, contact us at: cultureconnectorg@gmail.com'
              }
            </p>
          </section>
        </div>
        
        <p className="text-xs text-charcoal/40 mt-12 pt-6 border-t border-lightborder">
          {language === 'fr' 
            ? 'Dernière mise à jour : Février 2026'
            : 'Last updated: February 2026'
          }
        </p>
      </div>
    </div>
  );
};
