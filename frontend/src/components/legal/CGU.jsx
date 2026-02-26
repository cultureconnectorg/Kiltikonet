import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft } from 'lucide-react';

export const CGU = () => {
  const { language } = useLanguage();
  
  return (
    <div className="min-h-screen bg-paper pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-charcoal/50 hover:text-terracotta mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" />
          {language === 'fr' ? 'Retour' : 'Back'}
        </Link>
        
        <h1 className="font-serif text-3xl text-charcoal mb-8">
          {language === 'fr' ? 'Conditions Générales d\'Utilisation' : 'Terms of Use'}
        </h1>
        
        <div className="prose prose-sm max-w-none text-charcoal/80 space-y-6">
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '1. Objet' : '1. Purpose'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'Les présentes Conditions Générales d\'Utilisation (CGU) régissent l\'accès et l\'utilisation du site Culture Connect 2026 ainsi que les services d\'accréditation proposés pour l\'événement professionnel se tenant du 20 au 23 mai 2026 à Fort-de-France, Martinique.'
                : 'These Terms of Use govern access to and use of the Culture Connect 2026 website and the accreditation services offered for the professional event taking place from May 20-23, 2026 in Fort-de-France, Martinique.'
              }
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '2. Acceptation des conditions' : '2. Acceptance of Terms'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'L\'utilisation de ce site et l\'inscription à l\'événement impliquent l\'acceptation pleine et entière des présentes CGU. Si vous n\'acceptez pas ces conditions, vous ne devez pas utiliser ce site ni vous inscrire à l\'événement.'
                : 'Use of this site and registration for the event implies full acceptance of these Terms of Use. If you do not accept these terms, you should not use this site or register for the event.'
              }
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '3. Services proposés' : '3. Services Offered'}
            </h2>
            <p>{language === 'fr' ? 'Le site propose les services suivants :' : 'The site offers the following services:'}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{language === 'fr' ? 'Inscription et accréditation à l\'événement Culture Connect 2026' : 'Registration and accreditation for Culture Connect 2026 event'}</li>
              <li>{language === 'fr' ? 'Accès au catalogue des participants accrédités' : 'Access to the catalog of accredited participants'}</li>
              <li>{language === 'fr' ? 'Mise en relation professionnelle (networking)' : 'Professional networking'}</li>
              <li>{language === 'fr' ? 'Information sur le programme de l\'événement' : 'Information about the event program'}</li>
              <li>{language === 'fr' ? 'Souscription à des partenariats' : 'Partnership subscriptions'}</li>
            </ul>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '4. Inscription et accréditation' : '4. Registration and Accreditation'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'L\'inscription à l\'événement est soumise au paiement de frais d\'accréditation. Les tarifs sont indiqués sur la page de tarification. L\'accréditation est nominative et non transférable. L\'organisateur se réserve le droit de refuser toute inscription sans avoir à justifier sa décision.'
                : 'Registration for the event is subject to payment of accreditation fees. Rates are shown on the pricing page. Accreditation is personal and non-transferable. The organizer reserves the right to refuse any registration without justification.'
              }
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '5. Tarifs et paiement' : '5. Pricing and Payment'}
            </h2>
            <p>
              {language === 'fr' ? (
                <>
                  Les tarifs d'accréditation sont les suivants :<br />
                  • Émergent : 50€<br />
                  • Professionnel : 150€<br />
                  • Institutionnel : 300€<br /><br />
                  Le paiement s'effectue en ligne par carte bancaire via notre prestataire sécurisé Stripe. Le paiement est exigible immédiatement lors de l'inscription.
                </>
              ) : (
                <>
                  Accreditation rates are as follows:<br />
                  • Emerging: €50<br />
                  • Professional: €150<br />
                  • Institutional: €300<br /><br />
                  Payment is made online by credit card via our secure provider Stripe. Payment is due immediately upon registration.
                </>
              )}
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '6. Annulation et remboursement' : '6. Cancellation and Refund'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'En cas d\'annulation par le participant : aucun remboursement ne sera effectué après validation de l\'accréditation. En cas d\'annulation de l\'événement par l\'organisateur, les frais d\'accréditation seront intégralement remboursés.'
                : 'In case of cancellation by the participant: no refund will be made after accreditation validation. In case of event cancellation by the organizer, accreditation fees will be fully refunded.'
              }
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '7. Catalogue des participants' : '7. Participant Catalog'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'Les participants dont l\'accréditation est validée peuvent apparaître dans le catalogue public du site. Cette visibilité est optionnelle et peut être désactivée à tout moment dans l\'espace personnel ou sur demande.'
                : 'Participants whose accreditation is validated may appear in the public catalog on the site. This visibility is optional and can be disabled at any time in the personal space or upon request.'
              }
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '8. Comportement des utilisateurs' : '8. User Conduct'}
            </h2>
            <p>{language === 'fr' ? 'Les utilisateurs s\'engagent à :' : 'Users agree to:'}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{language === 'fr' ? 'Fournir des informations exactes et à jour' : 'Provide accurate and up-to-date information'}</li>
              <li>{language === 'fr' ? 'Ne pas usurper l\'identité d\'un tiers' : 'Not impersonate another person'}</li>
              <li>{language === 'fr' ? 'Respecter les autres participants et l\'équipe organisatrice' : 'Respect other participants and the organizing team'}</li>
              <li>{language === 'fr' ? 'Ne pas utiliser le site à des fins illicites ou de spam' : 'Not use the site for illegal purposes or spam'}</li>
            </ul>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '9. Propriété intellectuelle' : '9. Intellectual Property'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'Tous les contenus du site (textes, images, logos, vidéos) sont protégés par le droit de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.'
                : 'All site content (texts, images, logos, videos) is protected by intellectual property rights. Any reproduction without authorization is prohibited.'
              }
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '10. Responsabilité' : '10. Liability'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'L\'organisateur ne saurait être tenu responsable des dommages directs ou indirects résultant de l\'utilisation du site ou de la participation à l\'événement, sauf faute prouvée de sa part.'
                : 'The organizer cannot be held liable for direct or indirect damages resulting from use of the site or participation in the event, except in case of proven fault.'
              }
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '11. Modification des CGU' : '11. Modification of Terms'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'L\'organisateur se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle.'
                : 'The organizer reserves the right to modify these Terms at any time. Users will be informed of any substantial changes.'
              }
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '12. Droit applicable et litiges' : '12. Applicable Law and Disputes'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'Les présentes CGU sont régies par le droit français. Tout litige sera soumis à la compétence exclusive des tribunaux de Fort-de-France, Martinique.'
                : 'These Terms are governed by French law. Any dispute shall be subject to the exclusive jurisdiction of the courts of Fort-de-France, Martinique.'
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
