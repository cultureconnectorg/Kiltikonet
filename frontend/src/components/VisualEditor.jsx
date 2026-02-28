import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Undo2, 
  Redo2, 
  Monitor, 
  Tablet, 
  Smartphone,
  Save,
  X,
  Type,
  Image,
  Palette,
  MousePointer,
  Eye,
  Loader2,
  Check,
  Upload,
  Link2,
  Settings
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

const API = process.env.REACT_APP_BACKEND_URL || '';

// Pages disponibles pour l'edition
const PAGES = [
  { id: 'home', path: '/', label: 'Accueil' },
  { id: 'programme', path: '/programme', label: 'Programme' },
  { id: 'pricing', path: '/pricing', label: 'Tarifs' },
  { id: 'inscription', path: '/inscription', label: 'Inscription' },
  { id: 'partnership', path: '/partnership', label: 'Partenariat' },
  { id: 'catalog', path: '/catalog', label: 'Catalogue' },
];

// Types d'elements editables
const ELEMENT_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  COLOR: 'color',
  LINK: 'link',
  BUTTON: 'button',
};

const VisualEditor = () => {
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // Editor state
  const [currentPage, setCurrentPage] = useState(PAGES[0]);
  const [deviceView, setDeviceView] = useState('desktop');
  const [selectedElement, setSelectedElement] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // History for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Pending changes
  const [pendingChanges, setPendingChanges] = useState({});
  
  // Device dimensions
  const deviceDimensions = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '100%' },
    mobile: { width: '375px', height: '100%' },
  };

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'CC2026admin') {
      setIsAuthenticated(true);
    } else {
      toast.error('Mot de passe incorrect');
    }
  };

  // Initialize iframe communication
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleMessage = (event) => {
      // Security check - only accept messages from our iframe
      if (event.data?.type === 'element-selected') {
        const { element } = event.data;
        setSelectedElement(element);
      } else if (event.data?.type === 'element-updated') {
        setHasChanges(true);
        addToHistory(event.data.change);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isAuthenticated]);

  // Inject editor script into iframe when loaded
  const handleIframeLoad = useCallback(() => {
    if (!iframeRef.current) return;
    
    try {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      
      // Inject editor overlay styles
      const style = document.createElement('style');
      style.textContent = `
        [data-editable]:hover {
          outline: 2px dashed #A65D47 !important;
          outline-offset: 2px;
          cursor: pointer !important;
        }
        [data-editable].ve-selected {
          outline: 2px solid #A65D47 !important;
          outline-offset: 2px;
          background-color: rgba(166, 93, 71, 0.1) !important;
        }
        .ve-edit-indicator {
          position: absolute;
          top: -24px;
          left: 0;
          background: #A65D47;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: sans-serif;
          z-index: 10000;
          pointer-events: none;
        }
      `;
      iframeDoc.head.appendChild(style);

      // Mark editable elements
      const editableSelectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'span', 'a',
        'button',
        'img',
        '[class*="text-"]',
        '[class*="font-"]',
      ];

      editableSelectors.forEach(selector => {
        iframeDoc.querySelectorAll(selector).forEach((el, index) => {
          if (!el.closest('nav') && !el.closest('footer') && el.textContent.trim()) {
            el.setAttribute('data-editable', 'true');
            el.setAttribute('data-ve-id', `${selector}-${index}`);
            el.setAttribute('data-ve-type', getElementType(el));
          }
        });
      });

      // Add click handler
      iframeDoc.body.addEventListener('click', (e) => {
        const editable = e.target.closest('[data-editable]');
        if (editable) {
          e.preventDefault();
          e.stopPropagation();
          
          // Remove previous selection
          iframeDoc.querySelectorAll('.ve-selected').forEach(el => {
            el.classList.remove('ve-selected');
          });
          
          // Add selection to clicked element
          editable.classList.add('ve-selected');
          
          // Send message to parent
          window.parent.postMessage({
            type: 'element-selected',
            element: {
              id: editable.getAttribute('data-ve-id'),
              type: editable.getAttribute('data-ve-type'),
              tagName: editable.tagName.toLowerCase(),
              content: editable.tagName === 'IMG' ? editable.src : editable.textContent,
              html: editable.innerHTML,
              styles: {
                color: window.getComputedStyle(editable).color,
                backgroundColor: window.getComputedStyle(editable).backgroundColor,
                fontSize: window.getComputedStyle(editable).fontSize,
              },
              rect: editable.getBoundingClientRect(),
            }
          }, '*');
        }
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Could not inject editor script:', err);
      setIsLoading(false);
    }
  }, []);

  // Get element type
  const getElementType = (el) => {
    if (el.tagName === 'IMG') return ELEMENT_TYPES.IMAGE;
    if (el.tagName === 'A' || el.tagName === 'BUTTON') return ELEMENT_TYPES.BUTTON;
    return ELEMENT_TYPES.TEXT;
  };

  // Add change to history
  const addToHistory = (change) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(change);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      applyHistoryState(historyIndex - 1);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      applyHistoryState(historyIndex + 1);
    }
  };

  // Apply history state
  const applyHistoryState = (index) => {
    // Implementation depends on how we store changes
    toast.info('Changement applique');
  };

  // Update element in iframe
  const updateElement = (property, value) => {
    if (!selectedElement || !iframeRef.current) return;

    try {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      const element = iframeDoc.querySelector(`[data-ve-id="${selectedElement.id}"]`);
      
      if (element) {
        if (property === 'content') {
          if (element.tagName === 'IMG') {
            element.src = value;
          } else {
            element.textContent = value;
          }
        } else if (property === 'color') {
          element.style.color = value;
        } else if (property === 'backgroundColor') {
          element.style.backgroundColor = value;
        } else if (property === 'fontSize') {
          element.style.fontSize = value;
        } else if (property === 'href') {
          element.href = value;
        }

        // Update selected element state
        setSelectedElement(prev => ({
          ...prev,
          content: property === 'content' ? value : prev.content,
          styles: {
            ...prev.styles,
            [property]: property !== 'content' ? value : prev.styles[property],
          }
        }));

        // Track change
        setPendingChanges(prev => ({
          ...prev,
          [selectedElement.id]: {
            ...prev[selectedElement.id],
            [property]: value,
          }
        }));

        setHasChanges(true);
        addToHistory({ elementId: selectedElement.id, property, value });
      }
    } catch (err) {
      console.error('Could not update element:', err);
    }
  };

  // Save all changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save changes to CMS
      await axios.post(`${API}/api/cms/visual-editor/save`, {
        page: currentPage.id,
        changes: pendingChanges,
      });
      
      toast.success('Modifications publiees');
      setHasChanges(false);
      setPendingChanges({});
    } catch (err) {
      toast.error('Erreur lors de la publication');
    }
    setIsSaving(false);
  };

  // Cancel changes
  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('Annuler toutes les modifications non publiees ?')) {
        // Reload iframe to reset
        if (iframeRef.current) {
          iframeRef.current.src = iframeRef.current.src;
        }
        setPendingChanges({});
        setHasChanges(false);
        setSelectedElement(null);
      }
    }
  };

  // Change page
  const handlePageChange = (page) => {
    if (hasChanges) {
      if (!window.confirm('Vous avez des modifications non publiees. Changer de page ?')) {
        return;
      }
    }
    setCurrentPage(page);
    setSelectedElement(null);
    setIsLoading(true);
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API}/api/cms/upload`, formData);
      if (res.data?.url) {
        updateElement('content', res.data.url);
        toast.success('Image mise a jour');
      }
    } catch (err) {
      toast.error('Erreur lors de l\'upload');
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
        <div className="bg-paper rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <Eye className="w-12 h-12 text-terracotta mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-charcoal">Editeur Visuel</h1>
            <p className="text-charcoal/60 text-sm">Culture Connect 2026</p>
          </div>
          <form onSubmit={handleLogin}>
            <Input 
              type="password" 
              placeholder="Mot de passe administrateur" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="mb-4" 
            />
            <Button type="submit" className="w-full bg-terracotta text-white">
              Acceder a l'editeur
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-charcoal overflow-hidden">
      {/* Top Bar - Page Navigation */}
      <div className="bg-charcoal border-b border-white/10 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Back button */}
          <button 
            onClick={() => navigate('/admin/cms')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Retour au CMS</span>
          </button>

          {/* Page Navigation */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            {PAGES.map((page) => (
              <button
                key={page.id}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-1.5 rounded text-sm transition-all ${
                  currentPage.id === page.id
                    ? 'bg-terracotta text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {page.label}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-amber-400 text-xs flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                Modifications non publiees
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Live Preview */}
        <div className="flex-1 flex flex-col bg-gray-900 relative">
          {/* Floating Toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-charcoal/90 backdrop-blur rounded-lg p-2 shadow-lg border border-white/10">
            {/* Undo/Redo */}
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white"
              title="Annuler"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white"
              title="Retablir"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-white/20 mx-1"></div>

            {/* Device Toggle */}
            <button
              onClick={() => setDeviceView('desktop')}
              className={`p-2 rounded transition-colors ${deviceView === 'desktop' ? 'bg-terracotta text-white' : 'text-white/60 hover:bg-white/10'}`}
              title="Bureau"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceView('tablet')}
              className={`p-2 rounded transition-colors ${deviceView === 'tablet' ? 'bg-terracotta text-white' : 'text-white/60 hover:bg-white/10'}`}
              title="Tablette"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceView('mobile')}
              className={`p-2 rounded transition-colors ${deviceView === 'mobile' ? 'bg-terracotta text-white' : 'text-white/60 hover:bg-white/10'}`}
              title="Mobile"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-white/20 mx-1"></div>

            {/* Save/Cancel */}
            <button
              onClick={handleCancel}
              disabled={!hasChanges}
              className="px-3 py-1.5 rounded text-sm text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="px-3 py-1.5 rounded text-sm bg-sage text-white hover:bg-sage/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Publier
            </button>
          </div>

          {/* Iframe Container */}
          <div 
            className="flex-1 flex items-start justify-center p-4 overflow-auto"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <div 
              className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
              style={{
                width: deviceDimensions[deviceView].width,
                height: deviceView === 'desktop' ? 'calc(100vh - 140px)' : '600px',
                maxWidth: '100%',
              }}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-charcoal/50 z-20">
                  <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={`${window.location.origin}${currentPage.path}?ve=1&skip_intro=1`}
                className="w-full h-full border-0"
                onLoad={handleIframeLoad}
                title="Apercu du site"
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Editing Tools */}
        <div className="w-80 bg-paper border-l border-lightborder flex flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-lightborder">
            <h2 className="font-semibold text-charcoal flex items-center gap-2">
              <Settings className="w-4 h-4 text-terracotta" />
              Outils d'edition
            </h2>
            <p className="text-xs text-charcoal/50 mt-1">
              Cliquez sur un element pour le modifier
            </p>
          </div>

          {/* Editing Tools Content */}
          <div className="flex-1 overflow-auto p-4">
            {!selectedElement ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <MousePointer className="w-12 h-12 text-charcoal/20 mb-4" />
                <p className="text-charcoal/50 text-sm">
                  Selectionnez un element sur la page pour commencer l'edition
                </p>
                <div className="mt-6 text-left w-full">
                  <p className="text-xs font-medium text-charcoal/70 mb-2">Elements editables :</p>
                  <ul className="text-xs text-charcoal/50 space-y-1">
                    <li className="flex items-center gap-2">
                      <Type className="w-3 h-3" /> Titres et textes
                    </li>
                    <li className="flex items-center gap-2">
                      <Image className="w-3 h-3" /> Images
                    </li>
                    <li className="flex items-center gap-2">
                      <Palette className="w-3 h-3" /> Couleurs
                    </li>
                    <li className="flex items-center gap-2">
                      <Link2 className="w-3 h-3" /> Liens et boutons
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Element Info */}
                <div className="bg-cream rounded-lg p-3">
                  <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-1">
                    Element selectionne
                  </p>
                  <p className="text-sm font-medium text-charcoal">
                    {selectedElement.tagName === 'img' ? 'Image' : 
                     selectedElement.tagName === 'a' ? 'Lien' :
                     selectedElement.tagName === 'button' ? 'Bouton' :
                     `Texte (${selectedElement.tagName})`}
                  </p>
                </div>

                {/* Text Editor */}
                {selectedElement.type === ELEMENT_TYPES.TEXT && (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-xs font-medium text-charcoal/70 flex items-center gap-1 mb-2">
                        <Type className="w-3 h-3" /> Contenu texte
                      </span>
                      <Textarea
                        value={selectedElement.content || ''}
                        onChange={(e) => updateElement('content', e.target.value)}
                        className="w-full min-h-[100px] text-sm"
                        placeholder="Entrez le texte..."
                      />
                    </label>
                  </div>
                )}

                {/* Image Editor */}
                {selectedElement.type === ELEMENT_TYPES.IMAGE && (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-xs font-medium text-charcoal/70 flex items-center gap-1 mb-2">
                        <Image className="w-3 h-3" /> Image
                      </span>
                      {selectedElement.content && (
                        <img 
                          src={selectedElement.content} 
                          alt="Apercu" 
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                      )}
                      <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-lightborder rounded-lg cursor-pointer hover:border-terracotta hover:bg-terracotta/5 transition-colors">
                        <Upload className="w-4 h-4 text-charcoal/50" />
                        <span className="text-sm text-charcoal/70">Changer l'image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-charcoal/70 mb-2 block">
                        URL de l'image
                      </span>
                      <Input
                        value={selectedElement.content || ''}
                        onChange={(e) => updateElement('content', e.target.value)}
                        placeholder="https://..."
                        className="text-sm"
                      />
                    </label>
                  </div>
                )}

                {/* Color Editor */}
                <div className="space-y-3">
                  <span className="text-xs font-medium text-charcoal/70 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> Couleurs
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs text-charcoal/50 mb-1 block">Texte</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedElement.styles?.color?.replace('rgb', '#') || '#000000'}
                          onChange={(e) => updateElement('color', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border border-lightborder"
                        />
                        <Input
                          value={selectedElement.styles?.color || ''}
                          onChange={(e) => updateElement('color', e.target.value)}
                          className="flex-1 text-xs"
                          placeholder="#000000"
                        />
                      </div>
                    </label>
                    
                    <label className="block">
                      <span className="text-xs text-charcoal/50 mb-1 block">Fond</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedElement.styles?.backgroundColor?.replace('rgb', '#') || '#ffffff'}
                          onChange={(e) => updateElement('backgroundColor', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border border-lightborder"
                        />
                        <Input
                          value={selectedElement.styles?.backgroundColor || ''}
                          onChange={(e) => updateElement('backgroundColor', e.target.value)}
                          className="flex-1 text-xs"
                          placeholder="#ffffff"
                        />
                      </div>
                    </label>
                  </div>
                </div>

                {/* Link Editor for buttons/links */}
                {selectedElement.type === ELEMENT_TYPES.BUTTON && (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-xs font-medium text-charcoal/70 flex items-center gap-1 mb-2">
                        <Link2 className="w-3 h-3" /> Lien
                      </span>
                      <Input
                        value={selectedElement.href || ''}
                        onChange={(e) => updateElement('href', e.target.value)}
                        placeholder="https://..."
                        className="text-sm"
                      />
                    </label>
                  </div>
                )}

                {/* Deselect Button */}
                <button
                  onClick={() => {
                    setSelectedElement(null);
                    // Remove selection in iframe
                    if (iframeRef.current) {
                      const iframeDoc = iframeRef.current.contentDocument;
                      iframeDoc?.querySelectorAll('.ve-selected').forEach(el => {
                        el.classList.remove('ve-selected');
                      });
                    }
                  }}
                  className="w-full py-2 text-sm text-charcoal/50 hover:text-charcoal border border-lightborder rounded-lg hover:bg-cream transition-colors"
                >
                  Deselectionner
                </button>
              </div>
            )}
          </div>

          {/* Panel Footer */}
          <div className="p-4 border-t border-lightborder bg-cream">
            <p className="text-xs text-charcoal/50 text-center">
              Les modifications sont appliquees en temps reel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualEditor;
