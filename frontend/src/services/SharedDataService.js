/**
 * Service de données partagées - Synchronisation entre workspaces
 * Culture Connect 2026
 */

import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/shared`;

// ═══════════════════════════════════════════════════════════════
// ARTISTES
// ═══════════════════════════════════════════════════════════════

export const artistesService = {
  getAll: async () => {
    const res = await axios.get(`${API}/artistes`);
    return res.data;
  },
  
  create: async (artiste) => {
    const res = await axios.post(`${API}/artistes`, artiste);
    return res.data;
  },
  
  update: async (id, updates) => {
    const res = await axios.patch(`${API}/artistes/${id}`, updates);
    return res.data;
  },
  
  delete: async (id) => {
    const res = await axios.delete(`${API}/artistes/${id}`);
    return res.data;
  }
};

// ═══════════════════════════════════════════════════════════════
// PRESTATAIRES
// ═══════════════════════════════════════════════════════════════

export const prestatairesService = {
  getAll: async () => {
    const res = await axios.get(`${API}/prestataires`);
    return res.data;
  },
  
  create: async (prestataire) => {
    const res = await axios.post(`${API}/prestataires`, prestataire);
    return res.data;
  },
  
  update: async (id, updates) => {
    const res = await axios.patch(`${API}/prestataires/${id}`, updates);
    return res.data;
  },
  
  delete: async (id) => {
    const res = await axios.delete(`${API}/prestataires/${id}`);
    return res.data;
  }
};

// ═══════════════════════════════════════════════════════════════
// TÂCHES
// ═══════════════════════════════════════════════════════════════

export const tasksService = {
  getAll: async (assignedTo = null) => {
    const params = assignedTo ? `?assigned_to=${assignedTo}` : '';
    const res = await axios.get(`${API}/tasks${params}`);
    return res.data;
  },
  
  create: async (task) => {
    const res = await axios.post(`${API}/tasks`, task);
    return res.data;
  },
  
  update: async (id, updates) => {
    const res = await axios.patch(`${API}/tasks/${id}`, updates);
    return res.data;
  },
  
  delete: async (id) => {
    const res = await axios.delete(`${API}/tasks/${id}`);
    return res.data;
  }
};

// ═══════════════════════════════════════════════════════════════
// PARTENAIRES
// ═══════════════════════════════════════════════════════════════

export const partnersService = {
  getAll: async () => {
    const res = await axios.get(`${API}/partners`);
    return res.data;
  },
  
  create: async (partner) => {
    const res = await axios.post(`${API}/partners`, partner);
    return res.data;
  },
  
  update: async (id, updates) => {
    const res = await axios.patch(`${API}/partners/${id}`, updates);
    return res.data;
  },
  
  delete: async (id) => {
    const res = await axios.delete(`${API}/partners/${id}`);
    return res.data;
  }
};

// ═══════════════════════════════════════════════════════════════
// DÉPENSES
// ═══════════════════════════════════════════════════════════════

export const expensesService = {
  getAll: async () => {
    const res = await axios.get(`${API}/expenses`);
    return res.data;
  },
  
  create: async (expense) => {
    const res = await axios.post(`${API}/expenses`, expense);
    return res.data;
  },
  
  update: async (id, updates) => {
    const res = await axios.patch(`${API}/expenses/${id}`, updates);
    return res.data;
  },
  
  delete: async (id) => {
    const res = await axios.delete(`${API}/expenses/${id}`);
    return res.data;
  }
};

// ═══════════════════════════════════════════════════════════════
// CONTACTS
// ═══════════════════════════════════════════════════════════════

export const contactsService = {
  getAll: async (owner = null) => {
    const params = owner ? `?owner=${owner}` : '';
    const res = await axios.get(`${API}/contacts${params}`);
    return res.data;
  },
  
  create: async (contact) => {
    const res = await axios.post(`${API}/contacts`, contact);
    return res.data;
  },
  
  update: async (id, updates) => {
    const res = await axios.patch(`${API}/contacts/${id}`, updates);
    return res.data;
  },
  
  delete: async (id) => {
    const res = await axios.delete(`${API}/contacts/${id}`);
    return res.data;
  }
};

// ═══════════════════════════════════════════════════════════════
// PLANNING
// ═══════════════════════════════════════════════════════════════

export const planningService = {
  getAll: async (date = null) => {
    const params = date ? `?date=${date}` : '';
    const res = await axios.get(`${API}/planning${params}`);
    return res.data;
  },
  
  create: async (item) => {
    const res = await axios.post(`${API}/planning`, item);
    return res.data;
  },
  
  update: async (id, updates) => {
    const res = await axios.patch(`${API}/planning/${id}`, updates);
    return res.data;
  },
  
  delete: async (id) => {
    const res = await axios.delete(`${API}/planning/${id}`);
    return res.data;
  }
};

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

export const initDefaultData = async () => {
  try {
    const res = await axios.post(`${API}/init-default-data`);
    return res.data;
  } catch (error) {
    console.error('Failed to init default data:', error);
    return { success: false };
  }
};

export default {
  artistes: artistesService,
  prestataires: prestatairesService,
  tasks: tasksService,
  partners: partnersService,
  expenses: expensesService,
  contacts: contactsService,
  planning: planningService,
  initDefaultData
};
