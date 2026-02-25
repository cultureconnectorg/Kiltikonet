import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <LanguageProvider>
      <div className="App">
        <BrowserRouter>
          <Header />
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
          </Routes>
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
