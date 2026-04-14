import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowLeft } from 'lucide-react';

export const PolitiqueConfidentialite = () => {
  const { language } = useLanguage();
  
  return (
    <div className="min-h-screen bg-paper pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-charcoal/50 hover:text-terracotta mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" />
          {language === 'fr' ? 'Retour' : 'Back'}
        </Link>
        
        <h1 className="font-serif text-3xl text-charcoal mb-8">
          {language === 'fr' ? 'Politique de Confidentialité' : 'Privacy Policy'}
        </h1>
        
        <div className="prose prose-sm max-w-none text-charcoal/80 space-y-6">
          <p className="text-charcoal/60 italic">
            {language === 'fr' 
              ? 'Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.'
              : 'In accordance with the General Data Protection Regulation (GDPR) and the French Data Protection Act.'
            }
          </p>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '1. Responsable du traitement' : '1. Data Controller'}
            </h2>
            <p>
              {language === 'fr' ? (
                <>
                  Le responsable du traitement des données est :<br />
                  <strong>Factory Maker Studio</strong><br />
                  Email : cultureconnectorg@gmail.com
                </>
              ) : (
                <>
                  The data controller is:<br />
                  <strong>Factory Maker Studio</strong><br />
                  Email: cultureconnectorg@gmail.com
                </>
              )}
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '2. Données collectées' : '2. Data Collected'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'Dans le cadre de votre inscription à Culture Connect 2026, nous collectons les données suivantes :'
                : 'As part of your registration for Culture Connect 2026, we collect the following data:'
              }
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{language === 'fr' ? 'Nom et prénom' : 'First and last name'}</li>
              <li>{language === 'fr' ? 'Adresse email' : 'Email address'}</li>
              <li>{language === 'fr' ? 'Numéro de téléphone' : 'Phone number'}</li>
              <li>{language === 'fr' ? 'Nom de l\'organisation' : 'Organization name'}</li>
              <li>{language === 'fr' ? 'Pays de résidence' : 'Country of residence'}</li>
              <li>{language === 'fr' ? 'Type de profil professionnel' : 'Professional profile type'}</li>
              <li>{language === 'fr' ? 'Photo ou logo (optionnel)' : 'Photo or logo (optional)'}</li>
              <li>{language === 'fr' ? 'Biographie professionnelle' : 'Professional biography'}</li>
              <li>{language === 'fr' ? 'Centres d\'intérêt et expertises' : 'Interests and expertise'}</li>
            </ul>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '3. Finalités du traitement' : '3. Purpose of Processing'}
            </h2>
            <p>{language === 'fr' ? 'Vos données sont utilisées pour :' : 'Your data is used to:'}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{language === 'fr' ? 'Gérer votre accréditation à l\'événement' : 'Manage your event accreditation'}</li>
              <li>{language === 'fr' ? 'Vous envoyer votre badge d\'accès' : 'Send you your access badge'}</li>
              <li>{language === 'fr' ? 'Vous informer sur le programme de l\'événement' : 'Inform you about the event program'}</li>
              <li>{language === 'fr' ? 'Faciliter le networking entre participants (si consentement)' : 'Facilitate networking between participants (if consent)'}</li>
              <li>{language === 'fr' ? 'Publier votre profil dans le catalogue (si consentement)' : 'Publish your profile in the catalog (if consent)'}</li>
            </ul>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '4. Base légale' : '4. Legal Basis'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'Le traitement de vos données repose sur votre consentement explicite donné lors de l\'inscription et sur l\'exécution du contrat d\'accréditation.'
                : 'The processing of your data is based on your explicit consent given during registration and on the execution of the accreditation contract.'
              }
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '5. Destinataires des données' : '5. Data Recipients'}
            </h2>
            <p>{language === 'fr' ? 'Vos données peuvent être transmises à :' : 'Your data may be shared with:'}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{language === 'fr' ? 'Notre équipe d\'organisation' : 'Our organizing team'}</li>
              <li>{language === 'fr' ? 'Stripe (traitement des paiements)' : 'Stripe (payment processing)'}</li>
              <li>{language === 'fr' ? 'Cloudinary (hébergement des images)' : 'Cloudinary (image hosting)'}</li>
              <li>{language === 'fr' ? 'Resend (envoi d\'emails)' : 'Resend (email delivery)'}</li>
            </ul>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '6. Durée de conservation' : '6. Data Retention'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'Vos données sont conservées pendant une durée de 3 ans après l\'événement, sauf demande de suppression de votre part.'
                : 'Your data is retained for 3 years after the event, unless you request deletion.'
              }
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '7. Vos droits' : '7. Your Rights'}
            </h2>
            <p>{language === 'fr' ? 'Conformément au RGPD, vous disposez des droits suivants :' : 'Under GDPR, you have the following rights:'}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{language === 'fr' ? 'Droit d\'accès à vos données' : 'Right to access your data'}</li>
              <li>{language === 'fr' ? 'Droit de rectification' : 'Right to rectification'}</li>
              <li>{language === 'fr' ? 'Droit à l\'effacement ("droit à l\'oubli")' : 'Right to erasure ("right to be forgotten")'}</li>
              <li>{language === 'fr' ? 'Droit à la limitation du traitement' : 'Right to restriction of processing'}</li>
              <li>{language === 'fr' ? 'Droit à la portabilité' : 'Right to data portability'}</li>
              <li>{language === 'fr' ? 'Droit d\'opposition' : 'Right to object'}</li>
              <li>{language === 'fr' ? 'Droit de retirer votre consentement' : 'Right to withdraw consent'}</li>
            </ul>
            <p className="mt-3">
              {language === 'fr' 
                ? 'Pour exercer ces droits, contactez-nous à : cultureconnectorg@gmail.com'
                : 'To exercise these rights, contact us at: cultureconnectorg@gmail.com'
              }
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '8. Réclamation' : '8. Complaint'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'Vous pouvez introduire une réclamation auprès de la CNIL (Commission Nationale de l\'Informatique et des Libertés) : www.cnil.fr'
                : 'You may file a complaint with the CNIL (French Data Protection Authority): www.cnil.fr'
              }
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-xl text-charcoal mb-3">
              {language === 'fr' ? '9. Sécurité' : '9. Security'}
            </h2>
            <p>
              {language === 'fr' 
                ? 'Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction.'
                : 'We implement appropriate technical and organizational measures to protect your data against unauthorized access, modification, disclosure or destruction.'
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
