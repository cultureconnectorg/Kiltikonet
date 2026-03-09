/**
 * Contexte de données partagées - Synchronisation automatique entre workspaces
 * Culture Connect 2026
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/shared`;

// Contexte
const SharedDataContext = createContext(null);

// Provider
export const SharedDataProvider = ({ children }) => {
  const [artistes, setArtistes] = useState([]);
  const [prestataires, setPrestataires] = useState([]);
  const [partners, setPartners] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [planning, setPlanning] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Charger toutes les données
  const loadAllData = useCallback(async () => {
    try {
      const [
        artistesRes,
        prestatairesRes,
        partnersRes,
        tasksRes,
        expensesRes,
        contactsRes,
        planningRes
      ] = await Promise.all([
        axios.get(`${API}/artistes`).catch(() => ({ data: [] })),
        axios.get(`${API}/prestataires`).catch(() => ({ data: [] })),
        axios.get(`${API}/partners`).catch(() => ({ data: [] })),
        axios.get(`${API}/tasks`).catch(() => ({ data: [] })),
        axios.get(`${API}/expenses`).catch(() => ({ data: [] })),
        axios.get(`${API}/contacts`).catch(() => ({ data: [] })),
        axios.get(`${API}/planning`).catch(() => ({ data: [] }))
      ]);

      setArtistes(artistesRes.data);
      setPrestataires(prestatairesRes.data);
      setPartners(partnersRes.data);
      setTasks(tasksRes.data);
      setExpenses(expensesRes.data);
      setContacts(contactsRes.data);
      setPlanning(planningRes.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load shared data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialiser les données par défaut si vide
  const initDefaultData = useCallback(async () => {
    try {
      await axios.post(`${API}/init-default-data`);
      await loadAllData();
    } catch (error) {
      console.error('Failed to init default data:', error);
    }
  }, [loadAllData]);

  // Charger au montage et toutes les 10 secondes
  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 10000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  // ═══════════════════════════════════════════════════════════════
  // ARTISTES
  // ═══════════════════════════════════════════════════════════════
  const addArtiste = async (artiste) => {
    const res = await axios.post(`${API}/artistes`, artiste);
    if (res.data.success) {
      setArtistes(prev => [...prev, res.data.artiste]);
      return res.data.artiste;
    }
    throw new Error('Failed to add artiste');
  };

  const updateArtiste = async (id, updates) => {
    const res = await axios.patch(`${API}/artistes/${id}`, updates);
    if (res.data.success) {
      setArtistes(prev => prev.map(a => a.id === id ? res.data.artiste : a));
      return res.data.artiste;
    }
    throw new Error('Failed to update artiste');
  };

  const deleteArtiste = async (id) => {
    const res = await axios.delete(`${API}/artistes/${id}`);
    if (res.data.success) {
      setArtistes(prev => prev.filter(a => a.id !== id));
      return true;
    }
    throw new Error('Failed to delete artiste');
  };

  // ═══════════════════════════════════════════════════════════════
  // PRESTATAIRES
  // ═══════════════════════════════════════════════════════════════
  const addPrestataire = async (prestataire) => {
    const res = await axios.post(`${API}/prestataires`, prestataire);
    if (res.data.success) {
      setPrestataires(prev => [...prev, res.data.prestataire]);
      return res.data.prestataire;
    }
    throw new Error('Failed to add prestataire');
  };

  const updatePrestataire = async (id, updates) => {
    const res = await axios.patch(`${API}/prestataires/${id}`, updates);
    if (res.data.success) {
      setPrestataires(prev => prev.map(p => p.id === id ? res.data.prestataire : p));
      return res.data.prestataire;
    }
    throw new Error('Failed to update prestataire');
  };

  const deletePrestataire = async (id) => {
    const res = await axios.delete(`${API}/prestataires/${id}`);
    if (res.data.success) {
      setPrestataires(prev => prev.filter(p => p.id !== id));
      return true;
    }
    throw new Error('Failed to delete prestataire');
  };

  // ═══════════════════════════════════════════════════════════════
  // PARTENAIRES
  // ═══════════════════════════════════════════════════════════════
  const addPartner = async (partner) => {
    const res = await axios.post(`${API}/partners`, partner);
    if (res.data.success) {
      setPartners(prev => [...prev, res.data.partner]);
      return res.data.partner;
    }
    throw new Error('Failed to add partner');
  };

  const updatePartner = async (id, updates) => {
    const res = await axios.patch(`${API}/partners/${id}`, updates);
    if (res.data.success) {
      setPartners(prev => prev.map(p => p.id === id ? res.data.partner : p));
      return res.data.partner;
    }
    throw new Error('Failed to update partner');
  };

  const deletePartner = async (id) => {
    const res = await axios.delete(`${API}/partners/${id}`);
    if (res.data.success) {
      setPartners(prev => prev.filter(p => p.id !== id));
      return true;
    }
    throw new Error('Failed to delete partner');
  };

  // ═══════════════════════════════════════════════════════════════
  // TÂCHES
  // ═══════════════════════════════════════════════════════════════
  const addTask = async (task) => {
    const res = await axios.post(`${API}/tasks`, task);
    if (res.data.success) {
      setTasks(prev => [...prev, res.data.task]);
      return res.data.task;
    }
    throw new Error('Failed to add task');
  };

  const updateTask = async (id, updates) => {
    const res = await axios.patch(`${API}/tasks/${id}`, updates);
    if (res.data.success) {
      setTasks(prev => prev.map(t => t.id === id ? res.data.task : t));
      return res.data.task;
    }
    throw new Error('Failed to update task');
  };

  const deleteTask = async (id) => {
    const res = await axios.delete(`${API}/tasks/${id}`);
    if (res.data.success) {
      setTasks(prev => prev.filter(t => t.id !== id));
      return true;
    }
    throw new Error('Failed to delete task');
  };

  // ═══════════════════════════════════════════════════════════════
  // DÉPENSES
  // ═══════════════════════════════════════════════════════════════
  const addExpense = async (expense) => {
    const res = await axios.post(`${API}/expenses`, expense);
    if (res.data.success) {
      setExpenses(prev => [...prev, res.data.expense]);
      return res.data.expense;
    }
    throw new Error('Failed to add expense');
  };

  const updateExpense = async (id, updates) => {
    const res = await axios.patch(`${API}/expenses/${id}`, updates);
    if (res.data.success) {
      setExpenses(prev => prev.map(e => e.id === id ? res.data.expense : e));
      return res.data.expense;
    }
    throw new Error('Failed to update expense');
  };

  const deleteExpense = async (id) => {
    const res = await axios.delete(`${API}/expenses/${id}`);
    if (res.data.success) {
      setExpenses(prev => prev.filter(e => e.id !== id));
      return true;
    }
    throw new Error('Failed to delete expense');
  };

  // ═══════════════════════════════════════════════════════════════
  // CONTACTS
  // ═══════════════════════════════════════════════════════════════
  const addContact = async (contact) => {
    const res = await axios.post(`${API}/contacts`, contact);
    if (res.data.success) {
      setContacts(prev => [...prev, res.data.contact]);
      return res.data.contact;
    }
    throw new Error('Failed to add contact');
  };

  const updateContact = async (id, updates) => {
    const res = await axios.patch(`${API}/contacts/${id}`, updates);
    if (res.data.success) {
      setContacts(prev => prev.map(c => c.id === id ? res.data.contact : c));
      return res.data.contact;
    }
    throw new Error('Failed to update contact');
  };

  const deleteContact = async (id) => {
    const res = await axios.delete(`${API}/contacts/${id}`);
    if (res.data.success) {
      setContacts(prev => prev.filter(c => c.id !== id));
      return true;
    }
    throw new Error('Failed to delete contact');
  };

  // ═══════════════════════════════════════════════════════════════
  // PLANNING
  // ═══════════════════════════════════════════════════════════════
  const addPlanningItem = async (item) => {
    const res = await axios.post(`${API}/planning`, item);
    if (res.data.success) {
      // Re-fetch to get sorted list
      const planningRes = await axios.get(`${API}/planning`);
      setPlanning(planningRes.data);
      return res.data.item;
    }
    throw new Error('Failed to add planning item');
  };

  const updatePlanningItem = async (id, updates) => {
    const res = await axios.patch(`${API}/planning/${id}`, updates);
    if (res.data.success) {
      setPlanning(prev => prev.map(p => p.id === id ? res.data.item : p));
      return res.data.item;
    }
    throw new Error('Failed to update planning item');
  };

  const deletePlanningItem = async (id) => {
    const res = await axios.delete(`${API}/planning/${id}`);
    if (res.data.success) {
      setPlanning(prev => prev.filter(p => p.id !== id));
      return true;
    }
    throw new Error('Failed to delete planning item');
  };

  const value = {
    // Data
    artistes,
    prestataires,
    partners,
    tasks,
    expenses,
    contacts,
    planning,
    loading,
    lastUpdate,
    
    // Actions
    refresh: loadAllData,
    initDefaultData,
    
    // Artistes
    addArtiste,
    updateArtiste,
    deleteArtiste,
    
    // Prestataires
    addPrestataire,
    updatePrestataire,
    deletePrestataire,
    
    // Partners
    addPartner,
    updatePartner,
    deletePartner,
    
    // Tasks
    addTask,
    updateTask,
    deleteTask,
    
    // Expenses
    addExpense,
    updateExpense,
    deleteExpense,
    
    // Contacts
    addContact,
    updateContact,
    deleteContact,
    
    // Planning
    addPlanningItem,
    updatePlanningItem,
    deletePlanningItem
  };

  return (
    <SharedDataContext.Provider value={value}>
      {children}
    </SharedDataContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useSharedData = () => {
  const context = useContext(SharedDataContext);
  if (!context) {
    throw new Error('useSharedData must be used within a SharedDataProvider');
  }
  return context;
};

export default SharedDataContext;
