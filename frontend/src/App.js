import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { PricingPage } from "./components/PricingPage";
import { PartnershipPage } from "./components/PartnershipPage";
import { PartnerConfirmation } from "./components/PartnerConfirmation";
import { CatalogPage } from "./components/CatalogPage";
import { RegistrationForm } from "./components/RegistrationForm";
import { ConfirmationScreen } from "./components/ConfirmationScreen";
import { AdminDashboard } from "./components/AdminDashboard";
import { ParticipantProfile } from "./components/ParticipantProfile";
import { Toaster } from "./components/ui/sonner";
// Legal pages
import { MentionsLegales, PolitiqueConfidentialite, CGU, Cookies, CookieBanner } from "./components/legal";
// Smart Engine
import SmartEngineDashboard from "./components/SmartEngineDashboard";
// CMS Admin
import CMSAdmin from "./components/CMSAdmin";
// Visual Editor
import VisualEditor from "./components/VisualEditor";
// Dynamic Pages
import DynamicPage from "./components/DynamicPage";
// Program Page
import ProgramPage from "./components/ProgramPage";
// Intro Sequence
import IntroSequence, { ReturnWelcome } from "./components/IntroSequence";

// Layout wrapper that conditionally shows Header
const AppLayout = ({ children }) => {
  const location = useLocation();
  const hideHeaderRoutes = ['/smart-engine', '/admin'];
  const showHeader = !hideHeaderRoutes.some(route => location.pathname.startsWith(route));
  
  return (
    <>
      {showHeader && <Header />}
      {children}
      <CookieBanner />
    </>
  );
};

// Intro wrapper that checks URL
const IntroWrapper = () => {
  const location = window.location.pathname;
  const [showIntro, setShowIntro] = React.useState(() => {
    // Skip intro on admin pages
    if (location.startsWith('/admin') || location.startsWith('/smart-engine')) {
      return false;
    }
    // Skip intro if visual editor mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('ve') === '1' || urlParams.get('skip_intro') === '1') {
      return false;
    }
    // Only show intro on first visit
    return typeof window !== 'undefined' && !localStorage.getItem('kk_visited');
  });

  if (!showIntro) return null;
  
  return <IntroSequence onComplete={() => setShowIntro(false)} />;
};

function App() {
  return (
    <LanguageProvider>
      <div className="App">
        {/* Intro Sequence - only on first visit, not on admin pages */}
        <IntroWrapper />
        
        <BrowserRouter>
          {/* Return welcome message for returning visitors */}
          <ReturnWelcome />
          
          <AppLayout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/partnership" element={<PartnershipPage />} />
              <Route path="/partenaires" element={<PartnershipPage />} />
              <Route path="/partenaire/confirmation" element={<PartnerConfirmation />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/register" element={<RegistrationForm />} />
              <Route path="/inscription" element={<RegistrationForm />} />
              <Route path="/programme" element={<ProgramPage />} />
              <Route path="/confirmation" element={<ConfirmationScreen />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/cms" element={<CMSAdmin />} />
              <Route path="/admin/cms/visual-editor" element={<VisualEditor />} />
              <Route path="/participant/:participantId" element={<ParticipantProfile />} />
              {/* Smart Engine */}
              <Route path="/smart-engine" element={<SmartEngineDashboard />} />
              {/* Legal pages */}
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/confidentialite" element={<PolitiqueConfidentialite />} />
              <Route path="/cgu" element={<CGU />} />
              <Route path="/cookies" element={<Cookies />} />
              {/* Dynamic CMS Pages */}
              <Route path="/p/:slug" element={<DynamicPage />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#141311',
              border: '1px solid #2A2825',
              color: '#EDE8DC',
            },
          }}
        />
      </div>
    </LanguageProvider>
  );
}

export default App;
