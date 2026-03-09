import React, { Suspense, lazy, useEffect, useState } from "react";
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
// Dashboard CC2026 Collaboratif
import DashboardCC2026 from "./components/DashboardCC2026";
// Pro Space (LinkedIn Culturel)
import ProSpaceDashboard, { ProSpaceLogin } from "./components/ProSpaceDashboard";
// PWA Components
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import MobileBottomNav from "./components/MobileBottomNav";
// 3D Components - LAZY LOADED to avoid React 19 compatibility issues
const Dashboard3D = lazy(() => import("./components/admin/Dashboard3D"));
const SmartEngine3D = lazy(() => import("./components/admin/SmartEngine3D"));

// 3D Loading fallback
const Loading3D = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#1C1A14' }}>
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#D4A84B transparent' }} />
      <div style={{ color: 'rgba(255,255,255,0.5)' }}>Chargement 3D...</div>
    </div>
  </div>
);

// Layout wrapper that conditionally shows Header and Mobile Nav
const AppLayout = ({ children }) => {
  const location = useLocation();
  const hideHeaderRoutes = ['/smart-engine', '/admin', '/badge', '/workspace', '/dashboard-cc2026', '/espace-pro'];
  const showHeader = !hideHeaderRoutes.some(route => location.pathname.startsWith(route));
  
  // Check if user is in pro space for nav type
  const isProSpace = location.pathname.startsWith('/espace-pro') && !location.pathname.includes('/connexion');
  const proSession = localStorage.getItem('cc2026_pro_session');
  const userType = isProSpace && proSession ? 'pro' : 'public';
  
  return (
    <>
      {showHeader && <Header />}
      <div className="pb-16 md:pb-0"> {/* Add padding for mobile nav */}
        {children}
      </div>
      <MobileBottomNav userType={userType} />
      <PWAInstallPrompt />
      <CookieBanner />
    </>
  );
};

// Intro wrapper that checks URL
const IntroWrapper = () => {
  const location = window.location.pathname;
  const [showIntro, setShowIntro] = React.useState(() => {
    // Skip intro on admin pages, badge scan page, workspace pages, espace-pro
    if (location.startsWith('/admin') || location.startsWith('/smart-engine') || location.startsWith('/badge') || location.startsWith('/workspace') || location.startsWith('/dashboard-cc2026') || location.startsWith('/espace-pro')) {
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
              <Route path="/admin/dashboard-3d" element={<ProtectedRoute allowedRoles={['admin']}><Suspense fallback={<Loading3D />}><Dashboard3D /></Suspense></ProtectedRoute>} />
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
              {/* Dashboard CC2026 Collaboratif */}
              <Route path="/dashboard-cc2026" element={<ProtectedRoute allowedRoles={['admin', 'design']}><DashboardCC2026 workspaceId="CC2026admin" /></ProtectedRoute>} />
              <Route path="/dashboard-cc2026/laurent" element={<ProtectedRoute allowedRoles={['founder']}><DashboardCC2026 workspaceId="LC2026" /></ProtectedRoute>} />
              <Route path="/dashboard-cc2026/twina" element={<ProtectedRoute allowedRoles={['design']}><DashboardCC2026 workspaceId="Twina2026" /></ProtectedRoute>} />
              <Route path="/dashboard-cc2026/gwen" element={<ProtectedRoute allowedRoles={['event']}><DashboardCC2026 workspaceId="Gwen2026" /></ProtectedRoute>} />
              <Route path="/dashboard-cc2026/fabrice" element={<ProtectedRoute allowedRoles={['captions']}><DashboardCC2026 workspaceId="Fabrice2026" /></ProtectedRoute>} />
              <Route path="/dashboard-cc2026/kaige" element={<ProtectedRoute allowedRoles={['press']}><DashboardCC2026 workspaceId="Kaige2026" /></ProtectedRoute>} />
              <Route path="/dashboard-cc2026/alirio" element={<ProtectedRoute allowedRoles={['business']}><DashboardCC2026 workspaceId="Alirio2026" /></ProtectedRoute>} />
              <Route path="/dashboard-cc2026/wudy" element={<ProtectedRoute allowedRoles={['finance']}><DashboardCC2026 workspaceId="Wudy2026" /></ProtectedRoute>} />
              {/* Smart Engine - 3D version */}
              <Route path="/smart-engine" element={<SmartEngineDashboard />} />
              <Route path="/smart-engine-3d" element={<Suspense fallback={<Loading3D />}><SmartEngine3D /></Suspense>} />
              {/* Espace Pro CC2026 - LinkedIn Culturel */}
              <Route path="/espace-pro" element={<ProSpaceDashboard />} />
              <Route path="/espace-pro/connexion" element={<ProSpaceLogin />} />
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
