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

function App() {
  return (
    <LanguageProvider>
      <div className="App">
        <BrowserRouter>
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
              <Route path="/confirmation" element={<ConfirmationScreen />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/cms" element={<CMSAdmin />} />
              <Route path="/participant/:participantId" element={<ParticipantProfile />} />
              {/* Smart Engine */}
              <Route path="/smart-engine" element={<SmartEngineDashboard />} />
              {/* Legal pages */}
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/confidentialite" element={<PolitiqueConfidentialite />} />
              <Route path="/cgu" element={<CGU />} />
              <Route path="/cookies" element={<Cookies />} />
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
