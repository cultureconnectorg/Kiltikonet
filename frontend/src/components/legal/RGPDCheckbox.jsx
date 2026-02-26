import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Checkbox } from '../ui/checkbox';

/**
 * RGPD Consent Checkbox Component
 * To be added to all forms collecting personal data
 * 
 * Usage:
 * const [rgpdConsent, setRgpdConsent] = useState(false);
 * <RGPDCheckbox checked={rgpdConsent} onCheckedChange={setRgpdConsent} />
 */
export const RGPDCheckbox = ({ 
  checked, 
  onCheckedChange, 
  required = true,
  showError = false,
  id = "rgpd-consent"
}) => {
  const { language } = useLanguage();
  
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          className={`mt-0.5 border-lightborder data-[state=checked]:bg-sage data-[state=checked]:border-sage ${
            showError && !checked ? 'border-terracotta' : ''
          }`}
          data-testid="rgpd-checkbox"
        />
        <label 
          htmlFor={id} 
          className="text-sm text-charcoal/70 leading-relaxed cursor-pointer"
        >
          {language === 'fr' ? (
            <>
              J'accepte que mes données personnelles soient traitées conformément à la{' '}
              <Link 
                to="/confidentialite" 
                className="text-terracotta hover:underline"
                target="_blank"
              >
                politique de confidentialité
              </Link>
              {' '}et aux{' '}
              <Link 
                to="/cgu" 
                className="text-terracotta hover:underline"
                target="_blank"
              >
                conditions générales d'utilisation
              </Link>
              . {required && '*'}
            </>
          ) : (
            <>
              I agree that my personal data will be processed in accordance with the{' '}
              <Link 
                to="/confidentialite" 
                className="text-terracotta hover:underline"
                target="_blank"
              >
                privacy policy
              </Link>
              {' '}and{' '}
              <Link 
                to="/cgu" 
                className="text-terracotta hover:underline"
                target="_blank"
              >
                terms of use
              </Link>
              . {required && '*'}
            </>
          )}
        </label>
      </div>
      {showError && !checked && (
        <p className="text-xs text-terracotta pl-7">
          {language === 'fr' 
            ? 'Vous devez accepter pour continuer'
            : 'You must accept to continue'
          }
        </p>
      )}
    </div>
  );
};

/**
 * Catalog visibility consent checkbox
 * For users who want their profile visible in the public catalog
 */
export const CatalogConsentCheckbox = ({ 
  checked, 
  onCheckedChange,
  id = "catalog-consent"
}) => {
  const { language } = useLanguage();
  
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5 border-lightborder data-[state=checked]:bg-sage data-[state=checked]:border-sage"
        data-testid="catalog-checkbox"
      />
      <label 
        htmlFor={id} 
        className="text-sm text-charcoal/70 leading-relaxed cursor-pointer"
      >
        {language === 'fr' 
          ? 'J\'accepte que mon profil soit visible dans le catalogue public des participants (optionnel)'
          : 'I agree that my profile will be visible in the public participant catalog (optional)'
        }
      </label>
    </div>
  );
};
