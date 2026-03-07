import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
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
// Accreditation System
import { AccreditationSystem } from "./components/AccreditationSystem";
import BadgeScan from "./components/BadgeScan";
// Workspaces
import WorkspaceLaurent from "./components/workspaces/WorkspaceLaurent";
import WorkspaceTwina from "./components/workspaces/WorkspaceTwina";
import WorkspaceGwen from "./components/workspaces/WorkspaceGwen";
import WorkspaceKaige from "./components/workspaces/WorkspaceKaige";
import WorkspaceAlirio from "./components/workspaces/WorkspaceAlirio";
import WorkspaceWudy from "./components/workspaces/WorkspaceWudy";
import WorkspaceFabrice from "./components/workspaces/WorkspaceFabrice";
import WorkspaceAnalyst from "./components/workspaces/WorkspaceAnalyst";
// Protected Route with session expiration
import { ProtectedRoute } from "./components/ProtectedRoute";
// 3D Components - Section 3
import Dashboard3D from "./components/admin/Dashboard3D";
import SmartEngine3D from "./components/admin/SmartEngine3D";

// Layout wrapper that conditionally shows Header
const AppLayout = ({ children }) => {
  const location = useLocation();
  const hideHeaderRoutes = ['/smart-engine', '/admin', '/badge', '/workspace'];
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
    // Skip intro on admin pages, badge scan page, workspace pages
    if (location.startsWith('/admin') || location.startsWith('/smart-engine') || location.startsWith('/badge') || location.startsWith('/workspace')) {
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
              <Route path="/catalogue" element={<CatalogPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/tarifs" element={<PricingPage />} />
              <Route path="/register" element={<RegistrationForm />} />
              <Route path="/inscription" element={<RegistrationForm />} />
              <Route path="/programme" element={<ProgramPage />} />
              <Route path="/confirmation" element={<ConfirmationScreen />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/dashboard-3d" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard3D /></ProtectedRoute>} />
              <Route path="/admin/cms" element={<ProtectedRoute allowedRoles={['admin']}><CMSAdmin /></ProtectedRoute>} />
              <Route path="/admin/cms/visual-editor" element={<ProtectedRoute allowedRoles={['admin']}><VisualEditor /></ProtectedRoute>} />
              <Route path="/admin/accreditation" element={<ProtectedRoute allowedRoles={['admin']}><AccreditationSystem /></ProtectedRoute>} />
              <Route path="/badge/:id" element={<BadgeScan />} />
              <Route path="/participant/:participantId" element={<ParticipantProfile />} />
              {/* Workspaces - Protected */}
              <Route path="/workspace/laurent" element={<ProtectedRoute allowedRoles={['founder']}><WorkspaceLaurent /></ProtectedRoute>} />
              <Route path="/workspace/twina" element={<ProtectedRoute allowedRoles={['design']}><WorkspaceTwina /></ProtectedRoute>} />
              <Route path="/workspace/gwen" element={<ProtectedRoute allowedRoles={['event']}><WorkspaceGwen /></ProtectedRoute>} />
              <Route path="/workspace/kaige" element={<ProtectedRoute allowedRoles={['press']}><WorkspaceKaige /></ProtectedRoute>} />
              <Route path="/workspace/alirio" element={<ProtectedRoute allowedRoles={['business']}><WorkspaceAlirio /></ProtectedRoute>} />
              <Route path="/workspace/wudy" element={<ProtectedRoute allowedRoles={['finance']}><WorkspaceWudy /></ProtectedRoute>} />
              <Route path="/workspace/fabrice" element={<ProtectedRoute allowedRoles={['captions']}><WorkspaceFabrice /></ProtectedRoute>} />
              <Route path="/workspace/analyst" element={<ProtectedRoute allowedRoles={['analyst']}><WorkspaceAnalyst /></ProtectedRoute>} />
              {/* Smart Engine - 3D version */}
              <Route path="/smart-engine" element={<SmartEngineDashboard />} />
              <Route path="/smart-engine-3d" element={<SmartEngine3D />} />
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
