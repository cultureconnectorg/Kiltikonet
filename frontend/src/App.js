import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { Header } from "./components/Header";
import { RegistrationForm } from "./components/RegistrationForm";
import { ConfirmationScreen } from "./components/ConfirmationScreen";
import { AdminDashboard } from "./components/AdminDashboard";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <LanguageProvider>
      <div className="App noise-overlay">
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<RegistrationForm />} />
            <Route path="/confirmation" element={<ConfirmationScreen />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </BrowserRouter>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#141311',
              border: '1px solid #33312E',
              color: '#F5F5F0',
            },
          }}
        />
      </div>
    </LanguageProvider>
  );
}

export default App;
