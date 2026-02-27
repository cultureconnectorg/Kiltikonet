import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Loader2 } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || '';

const DynamicPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPage();
  }, [slug]);

  const loadPage = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pageRes, themeRes] = await Promise.all([
        axios.get(`${API}/api/public/page/${slug}`),
        axios.get(`${API}/api/public/theme`)
      ]);
      setPage(pageRes.data);
      setTheme(themeRes.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Page non trouvée');
      } else {
        setError('Erreur lors du chargement');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1A1A1A' }}>
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ backgroundColor: '#1A1A1A' }}>
        <h1 className="text-4xl font-bold text-white">404</h1>
        <p className="text-white/60">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const primaryColor = theme?.primary_color || '#A65D47';
  const secondaryColor = theme?.secondary_color || '#C8922A';
  const backgroundColor = theme?.background_color || '#1A1A1A';
  const textColor = theme?.text_color || '#F4F1EA';
  const fontFamily = theme?.font_family || 'Inter';

  return (
    <div className="min-h-screen" style={{ backgroundColor, fontFamily }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: `${primaryColor}33` }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: `${textColor}80` }}
            onMouseOver={(e) => e.currentTarget.style.color = primaryColor}
            onMouseOut={(e) => e.currentTarget.style.color = `${textColor}80`}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à Culture Connect
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 
          className="text-4xl font-bold mb-8"
          style={{ color: textColor }}
        >
          {page?.title}
        </h1>
        
        {/* Render HTML content */}
        <article 
          className="prose prose-lg max-w-none"
          style={{ 
            color: textColor,
            '--tw-prose-headings': textColor,
            '--tw-prose-body': textColor,
            '--tw-prose-links': primaryColor,
          }}
          dangerouslySetInnerHTML={{ __html: page?.content || '' }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t mt-12" style={{ borderColor: `${primaryColor}33` }}>
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm" style={{ color: `${textColor}50` }}>
            Culture Connect 2026 — kiltikonet.fr
          </p>
        </div>
      </footer>

      {/* Custom styles for prose */}
      <style>{`
        .prose h2 { color: ${secondaryColor}; margin-top: 2rem; margin-bottom: 1rem; }
        .prose h3 { color: ${primaryColor}; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        .prose p { margin-bottom: 1rem; line-height: 1.8; opacity: 0.9; }
        .prose a { color: ${primaryColor}; text-decoration: underline; }
        .prose a:hover { color: ${secondaryColor}; }
        .prose ul, .prose ol { margin-left: 1.5rem; margin-bottom: 1rem; }
        .prose li { margin-bottom: 0.5rem; }
        .prose blockquote { 
          border-left: 4px solid ${primaryColor}; 
          padding-left: 1rem; 
          margin: 1.5rem 0;
          font-style: italic;
          opacity: 0.8;
        }
        .prose img { border-radius: 0.5rem; margin: 1.5rem 0; }
        .prose hr { border-color: ${primaryColor}33; margin: 2rem 0; }
      `}</style>
    </div>
  );
};

export default DynamicPage;
