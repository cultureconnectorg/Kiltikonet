import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowLeft } from 'lucide-react';

export const MentionsLegales = () => {
  const { language } = useLanguage();
  
  return (
    <div className="min-h-screen bg-paper pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-charcoal/50 hover:text-terracotta mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" />
          {language === 'fr' ? 'Retour' : 'Back'}
        </Link>
        
        <h1 className="font-serif text-3xl text-charcoal mb-8">
          {language === 'fr' ? 'Mentions Légales' : 'Legal Notice'}
        </h1>
        
        <div className="prose prose-sm max-w-none text-charcoal/80 space-y-6">
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '1. Éditeur du site' : '1. Site Publisher'}
            </h2>
            <p>
              {language === 'fr' ? (
                <>
                  Le site Culture Connect 2026 est édité par :<br /><br />
                  <strong>Culture Connect</strong> (Powered by Factory Maker Studio)<br />
                  Fort-de-France, Martinique<br />
                  SIRET : 91824710700017<br />
                  Email : contact@kiltikonet.fr
                </>
              ) : (
                <>
                  The Culture Connect 2026 website is published by:<br /><br />
                  <strong>Culture Connect</strong> (Powered by Factory Maker Studio)<br />
                  Fort-de-France, Martinique<br />
                  SIRET: 91824710700017<br />
                  Email: contact@kiltikonet.fr
                </>
              )}
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '2. Directeur de la publication' : '2. Publication Director'}
            </h2>
            <p>Laurent COEURVOLAN</p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '3. Hébergement' : '3. Hosting'}
            </h2>
            <p>
              {language === 'fr' ? (
                <>
                  Ce site est hébergé par :<br /><br />
                  <strong>Emergent Agent</strong><br />
                  Services d'hébergement cloud<br />
                  [Coordonnées de l'hébergeur]
                </>
              ) : (
                <>
                  This site is hosted by:<br /><br />
                  <strong>Emergent Agent</strong><br />
                  Cloud hosting services<br />
                  [Host contact details]
                </>
              )}
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '4. Propriété intellectuelle' : '4. Intellectual Property'}
            </h2>
            <p>
              {language === 'fr' 
                ? "L'ensemble du contenu de ce site (textes, images, vidéos, logos, marques) est protégé par le droit de la propriété intellectuelle. Toute reproduction, représentation, modification ou exploitation non autorisée est interdite."
                : "All content on this site (texts, images, videos, logos, trademarks) is protected by intellectual property law. Any unauthorized reproduction, representation, modification or exploitation is prohibited."
              }
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '5. Crédits' : '5. Credits'}
            </h2>
            <p>
              {language === 'fr' ? (
                <>
                  Conception et développement : Factory Maker Studio<br />
                  Photographies : [Crédits photos à compléter]
                </>
              ) : (
                <>
                  Design and development: Factory Maker Studio<br />
                  Photography: [Photo credits to complete]
                </>
              )}
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '6. Contact' : '6. Contact'}
            </h2>
            <p>
              {language === 'fr' 
                ? "Pour toute question concernant ce site, vous pouvez nous contacter à l'adresse : contact@kiltikonet.fr"
                : "For any questions about this site, you can contact us at: contact@kiltikonet.fr"
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
