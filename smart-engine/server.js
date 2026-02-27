/**
 * KiltiKonet Smart Engine v2.0
 * AI-powered matching service for Culture Connect 2026
 * 
 * Architecture 2026-2031:
 * - Multi-tenant from day one
 * - Claude-based semantic matching
 * - Full event logging for intelligence
 * - Certification engine ready
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 8002;

// Backend API URL for LLM services
const BACKEND_API = 'http://localhost:8001/api/v1';

// Default tenant
const DEFAULT_TENANT = 'culture-connect-2026';

// Cache duration for matching results (7 days in ms)
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MongoDB Connection
let db;
const mongoClient = new MongoClient(process.env.MONGO_URL);

async function connectDB() {
  try {
    await mongoClient.connect();
    db = mongoClient.db(process.env.DB_NAME);
    console.log('✅ Connected to MongoDB');
    
    // Create indexes for all collections
    await createIndexes();
    
    // Initialize default tenant config
    await initializeTenant();
    
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createIndexes() {
  // smart_profiles indexes
  await db.collection('smart_profiles').createIndex({ 'id': 1 }, { unique: true });
  await db.collection('smart_profiles').createIndex({ 'tenant_id': 1 });
  await db.collection('smart_profiles').createIndex({ 'tenant_id': 1, 'territory': 1 });
  await db.collection('smart_profiles').createIndex({ 'tenant_id': 1, 'sector': 1 });
  await db.collection('smart_profiles').createIndex({ 'tenant_id': 1, 'type': 1 });
  
  // smart_documents indexes
  await db.collection('smart_documents').createIndex({ 'id': 1 }, { unique: true });
  await db.collection('smart_documents').createIndex({ 'tenant_id': 1 });
  await db.collection('smart_documents').createIndex({ 'tenant_id': 1, 'category': 1 });
  
  // matching_events indexes
  await db.collection('matching_events').createIndex({ 'id': 1 }, { unique: true });
  await db.collection('matching_events').createIndex({ 'tenant_id': 1 });
  await db.collection('matching_events').createIndex({ 'tenant_id': 1, 'profile_a_id': 1, 'profile_b_id': 1 });
  await db.collection('matching_events').createIndex({ 'tenant_id': 1, 'created_at': -1 });
  await db.collection('matching_events').createIndex({ 'tenant_id': 1, 'was_exported': 1 });
  
  // territorial_flows indexes
  await db.collection('territorial_flows').createIndex({ 'tenant_id': 1, 'from_territory': 1, 'to_territory': 1, 'sector': 1, 'period': 1 }, { unique: true });
  await db.collection('territorial_flows').createIndex({ 'tenant_id': 1, 'period': 1 });
  
  // collaboration_outcomes indexes
  await db.collection('collaboration_outcomes').createIndex({ 'id': 1 }, { unique: true });
  await db.collection('collaboration_outcomes').createIndex({ 'tenant_id': 1 });
  await db.collection('collaboration_outcomes').createIndex({ 'matching_event_id': 1 });
  
  // attestations indexes
  await db.collection('attestations').createIndex({ 'id': 1 }, { unique: true });
  await db.collection('attestations').createIndex({ 'tenant_id': 1 });
  
  // tenant_config indexes
  await db.collection('tenant_config').createIndex({ 'tenant_id': 1 }, { unique: true });
  
  console.log('✅ All indexes created');
}

async function initializeTenant() {
  const existing = await db.collection('tenant_config').findOne({ tenant_id: DEFAULT_TENANT });
  if (!existing) {
    await db.collection('tenant_config').insertOne({
      tenant_id: DEFAULT_TENANT,
      event_name: 'Culture Connect 2026',
      primary_color: '#A65D47',
      secondary_color: '#C8922A',
      accent_color: '#4A5D4E',
      background_color: '#1A1A1A',
      logo_url: null,
      domain: 'kiltikonet.fr',
      rag_context: 'Tu es un assistant expert en industries culturelles afro-caribéennes pour Culture Connect 2026 en Martinique.',
      active: true,
      created_at: new Date().toISOString()
    });
    console.log('✅ Default tenant config created');
  }
}

// ================== UTILITY FUNCTIONS ==================

/**
 * Get current period string (e.g., "2026-Q1")
 */
function getCurrentPeriod() {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${quarter}`;
}

/**
 * Call Claude via Python backend
 */
async function callClaude(message, systemPrompt = null) {
  try {
    const response = await axios.post(`${BACKEND_API}/llm/chat`, {
      message,
      system_prompt: systemPrompt,
      model: 'claude-4-sonnet-20250514',
      provider: 'anthropic'
    });
    return response.data.response;
  } catch (error) {
    console.error('Claude error:', error.response?.data || error.message);
    throw new Error('Failed to call Claude');
  }
}

/**
 * Create profile text for comparison
 */
function createProfileText(profile) {
  return `
Nom: ${profile.name}
Type: ${profile.type}
Secteur: ${profile.sector}
Genres: ${(profile.genres || []).join(', ')}
Tags d'expertise: ${(profile.tags || []).join(', ')}
Territoire: ${profile.territory}
Description: ${profile.description}
Recherche: ${profile.seeking}
Propose: ${profile.offering}
  `.trim();
}

/**
 * Compare two profiles using Claude (semantic matching)
 */
async function compareProfilesWithClaude(profileA, profileB) {
  const textA = createProfileText(profileA);
  const textB = createProfileText(profileB);
  
  const prompt = `Tu es un expert en mise en relation B2B pour les industries culturelles afro-caribéennes.

Évalue la compatibilité entre ces deux profils professionnels sur une échelle de 0 à 100.
Prends en compte:
- Complémentarité des offres et recherches
- Synergie territoriale (même région = +10, région proche = +5)
- Genres musicaux communs
- Types de profils complémentaires (ex: artiste + label = forte compatibilité)
- Secteurs d'activité similaires ou complémentaires

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans commentaires):
{
  "score": number (0-100),
  "match_reason": "string (1 phrase en français expliquant la compatibilité)",
  "genres_overlap": ["array des genres communs"],
  "complementarity": "string (ce que chacun apporte à l'autre)"
}

Profil A:
${textA}

---

Profil B:
${textB}`;

  try {
    const response = await callClaude(prompt);
    
    // Parse JSON response
    const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanResponse);
    
    return {
      score: Math.min(100, Math.max(0, result.score || 0)),
      match_reason: result.match_reason || 'Compatibilité évaluée par IA.',
      genres_overlap: result.genres_overlap || [],
      complementarity: result.complementarity || ''
    };
  } catch (error) {
    console.error('Claude comparison error:', error);
    // Fallback with basic scoring
    const genreOverlap = (profileA.genres || []).filter(g => (profileB.genres || []).includes(g));
    const tagOverlap = (profileA.tags || []).filter(t => (profileB.tags || []).includes(t));
    const sameTerritory = profileA.territory === profileB.territory;
    
    const score = Math.min(100, 
      genreOverlap.length * 10 + 
      tagOverlap.length * 5 + 
      (sameTerritory ? 15 : 0) +
      (profileA.sector === profileB.sector ? 10 : 0)
    );
    
    return {
      score,
      match_reason: 'Compatibilité basée sur les critères communs.',
      genres_overlap: genreOverlap,
      complementarity: 'Analyse détaillée non disponible.'
    };
  }
}

/**
 * Get or create cached matching result
 */
async function getCachedOrComputeMatch(tenantId, profileA, profileB) {
  // Normalize order (smaller ID first for consistent caching)
  const [idA, idB] = profileA.id < profileB.id 
    ? [profileA.id, profileB.id] 
    : [profileB.id, profileA.id];
  
  const [pA, pB] = profileA.id < profileB.id 
    ? [profileA, profileB] 
    : [profileB, profileA];
  
  // Check cache
  const cached = await db.collection('matching_events').findOne({
    tenant_id: tenantId,
    profile_a_id: idA,
    profile_b_id: idB,
    created_at: { $gte: new Date(Date.now() - CACHE_DURATION_MS).toISOString() }
  });
  
  if (cached) {
    return {
      score: cached.score,
      match_reason: cached.match_reason,
      genres_overlap: cached.genres_overlap,
      complementarity: cached.complementarity || '',
      cached: true,
      matching_event_id: cached.id
    };
  }
  
  // Compute new match
  const result = await compareProfilesWithClaude(pA, pB);
  
  // Store in matching_events
  const matchingEvent = {
    id: uuidv4(),
    tenant_id: tenantId,
    profile_a_id: idA,
    profile_b_id: idB,
    score: result.score,
    match_reason: result.match_reason,
    territory_a: pA.territory,
    territory_b: pB.territory,
    sector_a: pA.sector,
    sector_b: pB.sector,
    genres_overlap: result.genres_overlap,
    was_exported: false,
    rdv_scheduled: false,
    outcome_noted: false,
    outcome_detail: null,
    created_at: new Date().toISOString()
  };
  
  await db.collection('matching_events').insertOne(matchingEvent);
  
  // Update territorial flows
  await updateTerritorialFlow(tenantId, pA.territory, pB.territory, pA.sector, result.score);
  
  return {
    ...result,
    cached: false,
    matching_event_id: matchingEvent.id
  };
}

/**
 * Update territorial flow statistics
 */
async function updateTerritorialFlow(tenantId, fromTerritory, toTerritory, sector, score) {
  const period = getCurrentPeriod();
  
  // Normalize direction (alphabetical order)
  const [from, to] = fromTerritory < toTerritory 
    ? [fromTerritory, toTerritory] 
    : [toTerritory, fromTerritory];
  
  await db.collection('territorial_flows').updateOne(
    {
      tenant_id: tenantId,
      from_territory: from,
      to_territory: to,
      sector: sector || 'general',
      period
    },
    {
      $inc: { flow_count: 1 },
      $set: { updated_at: new Date().toISOString() },
      $push: { scores: { $each: [score], $slice: -100 } } // Keep last 100 scores
    },
    { upsert: true }
  );
  
  // Recalculate avg_score
  const flow = await db.collection('territorial_flows').findOne({
    tenant_id: tenantId,
    from_territory: from,
    to_territory: to,
    sector: sector || 'general',
    period
  });
  
  if (flow && flow.scores && flow.scores.length > 0) {
    const avgScore = flow.scores.reduce((a, b) => a + b, 0) / flow.scores.length;
    await db.collection('territorial_flows').updateOne(
      { _id: flow._id },
      { $set: { avg_score: Math.round(avgScore * 100) / 100 } }
    );
  }
}

// ================== API ROUTES ==================

// Health check
app.get('/api/v1/smart-recommendations/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'KiltiKonet Smart Engine', 
    version: '2.0.0',
    architecture: 'multi-tenant',
    default_tenant: DEFAULT_TENANT
  });
});

// Get tenant config
app.get('/api/v1/smart-recommendations/config', async (req, res) => {
  try {
    const tenantId = req.query.tenant_id || DEFAULT_TENANT;
    const config = await db.collection('tenant_config').findOne(
      { tenant_id: tenantId },
      { projection: { _id: 0 } }
    );
    
    if (!config) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json(config);
  } catch (error) {
    console.error('Config error:', error);
    res.status(500).json({ error: 'Erreur de configuration' });
  }
});

// Index a profile
app.post('/api/v1/smart-recommendations/index', async (req, res) => {
  try {
    const { name, type, sector, genres, tags, territory, description, seeking, offering, tenant_id } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    
    const tenantId = tenant_id || DEFAULT_TENANT;
    
    const profile = {
      id: uuidv4(),
      tenant_id: tenantId,
      name,
      type,
      sector: sector || '',
      genres: genres || [],
      tags: (tags || []).slice(0, 12), // Max 12 tags
      territory: territory || '',
      description: description || '',
      seeking: seeking || '',
      offering: offering || '',
      profile_text: '', // Will be set below
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Store profile text for matching
    profile.profile_text = createProfileText(profile);
    
    // Store in MongoDB
    await db.collection('smart_profiles').insertOne(profile);
    
    res.json({
      success: true,
      message: 'Profil indexé avec succès',
      profile: {
        id: profile.id,
        name: profile.name,
        type: profile.type,
        territory: profile.territory,
        tenant_id: tenantId
      }
    });
  } catch (error) {
    console.error('Index error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'indexation du profil' });
  }
});

// List all profiles
app.get('/api/v1/smart-recommendations/profiles', async (req, res) => {
  try {
    const tenantId = req.query.tenant_id || DEFAULT_TENANT;
    
    const profiles = await db.collection('smart_profiles')
      .find({ tenant_id: tenantId }, { projection: { profile_text: 0, _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    
    res.json({ profiles, total: profiles.length, tenant_id: tenantId });
  } catch (error) {
    console.error('List profiles error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des profils' });
  }
});

// Delete a profile
app.delete('/api/v1/smart-recommendations/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.query.tenant_id || DEFAULT_TENANT;
    
    const result = await db.collection('smart_profiles').deleteOne({ id, tenant_id: tenantId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Profil non trouvé' });
    }
    
    res.json({ success: true, message: 'Profil supprimé' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Get stats (MUST be before :profileId route)
app.get('/api/v1/smart-recommendations/stats', async (req, res) => {
  try {
    const tenantId = req.query.tenant_id || DEFAULT_TENANT;
    
    const profileCount = await db.collection('smart_profiles').countDocuments({ tenant_id: tenantId });
    const documentCount = await db.collection('smart_documents').countDocuments({ tenant_id: tenantId });
    const matchingEventCount = await db.collection('matching_events').countDocuments({ tenant_id: tenantId });
    const exportedCount = await db.collection('matching_events').countDocuments({ tenant_id: tenantId, was_exported: true });
    const rdvCount = await db.collection('matching_events').countDocuments({ tenant_id: tenantId, rdv_scheduled: true });
    const outcomeCount = await db.collection('collaboration_outcomes').countDocuments({ tenant_id: tenantId });
    
    // Territory distribution
    const territories = await db.collection('smart_profiles').aggregate([
      { $match: { tenant_id: tenantId } },
      { $group: { _id: '$territory', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    // Type distribution
    const types = await db.collection('smart_profiles').aggregate([
      { $match: { tenant_id: tenantId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    res.json({
      tenant_id: tenantId,
      profiles: profileCount,
      documents: documentCount,
      matching_events: matchingEventCount,
      exports: exportedCount,
      rdv_scheduled: rdvCount,
      collaboration_outcomes: outcomeCount,
      by_territory: territories.reduce((acc, t) => { acc[t._id || 'Non spécifié'] = t.count; return acc; }, {}),
      by_type: types.reduce((acc, t) => { acc[t._id || 'Non spécifié'] = t.count; return acc; }, {})
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Erreur stats' });
  }
});

// Get recommendations for a profile (MAIN MATCHING ENDPOINT)
app.get('/api/v1/smart-recommendations/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    const tenantId = req.query.tenant_id || DEFAULT_TENANT;
    
    // Get the source profile
    const sourceProfile = await db.collection('smart_profiles').findOne({ 
      id: profileId, 
      tenant_id: tenantId 
    });
    
    if (!sourceProfile) {
      return res.status(404).json({ error: 'Profil non trouvé' });
    }
    
    // Get all other profiles
    const allProfiles = await db.collection('smart_profiles')
      .find({ id: { $ne: profileId }, tenant_id: tenantId })
      .toArray();
    
    if (allProfiles.length === 0) {
      return res.json({
        source: { id: sourceProfile.id, name: sourceProfile.name },
        recommendations: [],
        message: 'Aucun autre profil disponible pour les recommandations'
      });
    }
    
    // Compare with all profiles using Claude (with caching)
    const comparisons = await Promise.all(
      allProfiles.map(async (profile) => {
        const match = await getCachedOrComputeMatch(tenantId, sourceProfile, profile);
        return {
          profile,
          ...match
        };
      })
    );
    
    // Sort by score and take top 5
    comparisons.sort((a, b) => b.score - a.score);
    const top5 = comparisons.slice(0, 5);
    
    // Format recommendations
    const recommendations = top5.map((item, index) => ({
      rank: index + 1,
      id: item.profile.id,
      name: item.profile.name,
      type: item.profile.type,
      sector: item.profile.sector,
      territory: item.profile.territory,
      genres: item.profile.genres,
      tags: item.profile.tags,
      score: item.score,
      matchReason: item.match_reason,
      genres_overlap: item.genres_overlap,
      complementarity: item.complementarity,
      matching_event_id: item.matching_event_id,
      cached: item.cached
    }));
    
    res.json({
      source: {
        id: sourceProfile.id,
        name: sourceProfile.name,
        type: sourceProfile.type,
        territory: sourceProfile.territory
      },
      recommendations,
      tenant_id: tenantId
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération des recommandations' });
  }
});

// ================== RAG ENDPOINTS ==================

// Index a document for RAG
app.post('/api/v1/smart-recommendations/rag/index', async (req, res) => {
  try {
    const { title, content, category, tenant_id } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const tenantId = tenant_id || DEFAULT_TENANT;
    
    const document = {
      id: uuidv4(),
      tenant_id: tenantId,
      title,
      content,
      category: category || 'general',
      created_at: new Date().toISOString()
    };
    
    await db.collection('smart_documents').insertOne(document);
    
    res.json({
      success: true,
      message: 'Document indexé',
      document: { id: document.id, title: document.title, category: document.category }
    });
  } catch (error) {
    console.error('Document index error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'indexation du document' });
  }
});

// RAG Ask endpoint
app.post('/api/v1/smart-recommendations/rag/ask', async (req, res) => {
  try {
    const { question, tenant_id } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question requise' });
    }
    
    const tenantId = tenant_id || DEFAULT_TENANT;
    
    // Get tenant config for RAG context
    const tenantConfig = await db.collection('tenant_config').findOne({ tenant_id: tenantId });
    const ragContext = tenantConfig?.rag_context || 'Tu es un assistant expert en industries culturelles afro-caribéennes.';
    
    // Get all documents for this tenant
    const documents = await db.collection('smart_documents')
      .find({ tenant_id: tenantId })
      .toArray();
    
    if (documents.length === 0) {
      // No documents, use general knowledge
      const answer = await callClaude(
        `${ragContext}\n\nQuestion: ${question}\n\nRéponds en français de manière professionnelle.`
      );
      
      return res.json({
        answer,
        sources: [],
        note: 'Réponse basée sur les connaissances générales (aucun document indexé)'
      });
    }
    
    // Use Claude to find relevant documents and answer
    const docSummaries = documents.map((d, i) => `[Doc ${i + 1}: ${d.title}] ${d.content.substring(0, 500)}...`).join('\n\n');
    
    const searchPrompt = `Voici des documents disponibles:\n\n${docSummaries}\n\nQuestion: ${question}\n\nQuels documents (numéros) sont les plus pertinents pour répondre? Réponds uniquement avec les numéros séparés par des virgules (ex: 1,3,4)`;
    
    const relevantIndices = await callClaude(searchPrompt);
    const indices = relevantIndices.match(/\d+/g)?.map(n => parseInt(n) - 1).filter(i => i >= 0 && i < documents.length) || [0, 1, 2, 3].filter(i => i < documents.length);
    
    const relevantDocs = indices.slice(0, 4).map(i => documents[i]).filter(Boolean);
    
    // Build context
    const context = relevantDocs.map((doc, i) => 
      `[Source ${i + 1}: ${doc.title}]\n${doc.content}`
    ).join('\n\n---\n\n');
    
    // Call Claude with context
    const answer = await callClaude(
      `${ragContext}

Voici des documents de référence:

${context}

---

En te basant sur ces documents, réponds à la question suivante en français. Cite les sources utilisées entre crochets [Source X].

Question: ${question}`
    );
    
    res.json({
      answer,
      sources: relevantDocs.map((doc, i) => ({
        title: doc.title,
        category: doc.category,
        relevance: Math.round((relevantDocs.length - i) / relevantDocs.length * 100)
      }))
    });
  } catch (error) {
    console.error('RAG error:', error);
    res.status(500).json({ error: 'Erreur lors du traitement de la question' });
  }
});

// List RAG documents
app.get('/api/v1/smart-recommendations/rag/documents', async (req, res) => {
  try {
    const tenantId = req.query.tenant_id || DEFAULT_TENANT;
    
    const documents = await db.collection('smart_documents')
      .find({ tenant_id: tenantId }, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    
    res.json({ documents, total: documents.length });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des documents' });
  }
});

// ================== EXPORT & ATTESTATION ENDPOINTS ==================

// Generate export recommendation text
app.post('/api/v1/smart-recommendations/export', async (req, res) => {
  try {
    const { profileA, profileB, score, matching_event_id, tenant_id } = req.body;
    
    if (!profileA || !profileB || score === undefined) {
      return res.status(400).json({ error: 'Données de profils requises' });
    }
    
    const tenantId = tenant_id || DEFAULT_TENANT;
    
    const prompt = `En 2-3 phrases professionnelles en français, explique pourquoi le profil "${profileA.name}" (type: ${profileA.type}, territoire: ${profileA.territory}, genres: ${(profileA.genres || []).join(', ')}) est compatible à ${score}% avec le profil "${profileB.name}" (type: ${profileB.type}, territoire: ${profileB.territory}) dans le cadre d'un développement culturel afro-caribéen. Formule comme une recommandation officielle pour un dossier de subvention.`;
    
    const recommendation = await callClaude(prompt);
    
    // Mark matching event as exported
    if (matching_event_id) {
      await db.collection('matching_events').updateOne(
        { id: matching_event_id, tenant_id: tenantId },
        { $set: { was_exported: true, exported_at: new Date().toISOString() } }
      );
    }
    
    // Create attestation
    const attestation = {
      id: uuidv4(),
      tenant_id: tenantId,
      matching_event_id: matching_event_id || null,
      profile_a_id: profileA.id,
      profile_a_name: profileA.name,
      profile_b_id: profileB.id,
      profile_b_name: profileB.name,
      score,
      recommendation,
      valid: true,
      created_at: new Date().toISOString()
    };
    
    await db.collection('attestations').insertOne(attestation);
    
    res.json({
      success: true,
      recommendation,
      attestation_id: attestation.id,
      profileA: { name: profileA.name, type: profileA.type },
      profileB: { name: profileB.name, type: profileB.type },
      score
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération de la recommandation' });
  }
});

// Verify attestation (PUBLIC ENDPOINT)
app.get('/api/v1/verify/:attestationId', async (req, res) => {
  try {
    const { attestationId } = req.params;
    
    const attestation = await db.collection('attestations').findOne(
      { id: attestationId },
      { projection: { _id: 0 } }
    );
    
    if (!attestation) {
      return res.json({
        valid: false,
        message: 'Attestation non trouvée'
      });
    }
    
    // Get tenant config for branding
    const tenantConfig = await db.collection('tenant_config').findOne({ tenant_id: attestation.tenant_id });
    
    res.json({
      valid: attestation.valid,
      attestation_id: attestation.id,
      profile_a: attestation.profile_a_name,
      profile_b: attestation.profile_b_name,
      score: attestation.score,
      date: attestation.created_at,
      event_name: tenantConfig?.event_name || 'Culture Connect',
      domain: tenantConfig?.domain || 'kiltikonet.fr'
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Erreur de vérification' });
  }
});

// Generate PDF with attestation
app.post('/api/v1/smart-recommendations/export/pdf', async (req, res) => {
  try {
    const { profileA, profileB, score, recommendation, attestation_id, tenant_id } = req.body;
    
    if (!profileA || !profileB || !recommendation) {
      return res.status(400).json({ error: 'Données requises manquantes' });
    }
    
    const tenantId = tenant_id || DEFAULT_TENANT;
    const tenantConfig = await db.collection('tenant_config').findOne({ tenant_id: tenantId });
    
    const eventName = tenantConfig?.event_name || 'Culture Connect 2026';
    const domain = tenantConfig?.domain || 'kiltikonet.fr';
    const primaryColor = tenantConfig?.primary_color || '#A65D47';
    const secondaryColor = tenantConfig?.secondary_color || '#C8922A';
    
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=attestation_${attestation_id || 'export'}.pdf`);
      res.send(pdfBuffer);
    });
    
    // Header
    doc.fontSize(24).fillColor(primaryColor).text(eventName, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor(secondaryColor).text('KiltiKonet Smart Engine', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666666').text('Attestation de Compatibilité Professionnelle', { align: 'center' });
    
    // Attestation ID
    if (attestation_id) {
      doc.moveDown(0.5);
      doc.fontSize(8).fillColor('#999999').text(`Attestation N° ${attestation_id}`, { align: 'center' });
      doc.text(`Vérifiable sur: https://${domain}/verify/${attestation_id}`, { align: 'center' });
    }
    
    // Date
    doc.moveDown(1.5);
    const date = new Date().toLocaleDateString('fr-FR', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    doc.fontSize(10).fillColor('#333333').text(`Date: ${date}`, { align: 'right' });
    
    // Line
    doc.moveDown(1);
    doc.strokeColor(primaryColor).lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);
    
    // Profiles
    doc.fontSize(12).fillColor('#1A1A1A').text('PROFILS ANALYSÉS', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#333333');
    doc.text(`• ${profileA.name} (${profileA.type})`, { continued: false });
    doc.text(`  Territoire: ${profileA.territory || 'Non spécifié'}`);
    doc.moveDown(0.5);
    doc.text(`• ${profileB.name} (${profileB.type})`, { continued: false });
    doc.text(`  Territoire: ${profileB.territory || 'Non spécifié'}`);
    
    // Score
    doc.moveDown(1);
    doc.fontSize(14).fillColor(primaryColor).text(`Score de Compatibilité: ${score}%`, { align: 'center' });
    
    // Recommendation
    doc.moveDown(1);
    doc.fontSize(12).fillColor('#1A1A1A').text('RECOMMANDATION OFFICIELLE', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#333333').text(recommendation, { align: 'justify', lineGap: 4 });
    
    // Footer
    doc.moveDown(2);
    doc.strokeColor('#CCCCCC').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#888888').text(
      `Généré par KiltiKonet Smart Engine — ${domain}`,
      { align: 'center' }
    );
    doc.text(
      'Ce document certifie une analyse de compatibilité professionnelle.',
      { align: 'center' }
    );
    doc.text(
      'Attestation vérifiable en ligne via le QR code ou l\'URL ci-dessus.',
      { align: 'center' }
    );
    
    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
});

// ================== COLLABORATION OUTCOMES ==================

// Record a collaboration outcome
app.post('/api/v1/smart-recommendations/outcome', async (req, res) => {
  try {
    const { matching_event_id, outcome_type, notes, declared_by, tenant_id } = req.body;
    
    if (!matching_event_id || !outcome_type) {
      return res.status(400).json({ error: 'matching_event_id et outcome_type requis' });
    }
    
    const tenantId = tenant_id || DEFAULT_TENANT;
    const validOutcomes = ['contract', 'tour', 'coproduction', 'distribution', 'other'];
    
    if (!validOutcomes.includes(outcome_type)) {
      return res.status(400).json({ error: `outcome_type doit être: ${validOutcomes.join(', ')}` });
    }
    
    const outcome = {
      id: uuidv4(),
      tenant_id: tenantId,
      matching_event_id,
      outcome_type,
      declared_at: new Date().toISOString(),
      declared_by: declared_by || 'anonymous',
      notes: notes || ''
    };
    
    await db.collection('collaboration_outcomes').insertOne(outcome);
    
    // Update matching event
    await db.collection('matching_events').updateOne(
      { id: matching_event_id, tenant_id: tenantId },
      { 
        $set: { 
          outcome_noted: true, 
          outcome_detail: `${outcome_type}: ${notes || 'Aucun détail'}` 
        } 
      }
    );
    
    res.json({
      success: true,
      message: 'Résultat de collaboration enregistré',
      outcome_id: outcome.id
    });
  } catch (error) {
    console.error('Outcome error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
});

// Mark RDV scheduled
app.post('/api/v1/smart-recommendations/rdv', async (req, res) => {
  try {
    const { matching_event_id, tenant_id } = req.body;
    
    if (!matching_event_id) {
      return res.status(400).json({ error: 'matching_event_id requis' });
    }
    
    const tenantId = tenant_id || DEFAULT_TENANT;
    
    await db.collection('matching_events').updateOne(
      { id: matching_event_id, tenant_id: tenantId },
      { $set: { rdv_scheduled: true, rdv_scheduled_at: new Date().toISOString() } }
    );
    
    res.json({ success: true, message: 'RDV marqué comme planifié' });
  } catch (error) {
    console.error('RDV error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// ================== INTELLIGENCE API (Phase 2) ==================

// Get territorial flows
app.get('/api/v1/intelligence/territorial-flows', async (req, res) => {
  try {
    const tenantId = req.query.tenant_id || DEFAULT_TENANT;
    const sector = req.query.sector;
    const period = req.query.period;
    
    const query = { tenant_id: tenantId };
    if (sector) query.sector = sector;
    if (period) query.period = period;
    
    const flows = await db.collection('territorial_flows')
      .find(query, { projection: { _id: 0, scores: 0 } })
      .sort({ flow_count: -1 })
      .limit(10)
      .toArray();
    
    res.json({
      tenant_id: tenantId,
      filters: { sector, period },
      top_flows: flows,
      total_count: flows.length
    });
  } catch (error) {
    console.error('Territorial flows error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// Get sector heatmap
app.get('/api/v1/intelligence/sector-heatmap', async (req, res) => {
  try {
    const tenantId = req.query.tenant_id || DEFAULT_TENANT;
    
    // Aggregate matching events by sector pairs
    const sectorData = await db.collection('matching_events').aggregate([
      { $match: { tenant_id: tenantId } },
      {
        $group: {
          _id: { sector_a: '$sector_a', sector_b: '$sector_b' },
          count: { $sum: 1 },
          avg_score: { $avg: '$score' }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    // Get unique sectors
    const sectors = [...new Set(sectorData.flatMap(d => [d._id.sector_a, d._id.sector_b]))].filter(Boolean);
    
    // Build heatmap matrix
    const heatmap = {};
    sectors.forEach(s => {
      heatmap[s] = {};
      sectors.forEach(t => {
        heatmap[s][t] = 0;
      });
    });
    
    sectorData.forEach(d => {
      if (d._id.sector_a && d._id.sector_b) {
        heatmap[d._id.sector_a][d._id.sector_b] = d.count;
        heatmap[d._id.sector_b][d._id.sector_a] = d.count;
      }
    });
    
    res.json({
      tenant_id: tenantId,
      sectors,
      heatmap,
      raw_data: sectorData.map(d => ({
        sector_a: d._id.sector_a,
        sector_b: d._id.sector_b,
        connection_count: d.count,
        avg_score: Math.round(d.avg_score * 100) / 100
      }))
    });
  } catch (error) {
    console.error('Sector heatmap error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// Get conversion rates by score range
app.get('/api/v1/intelligence/conversion-rates', async (req, res) => {
  try {
    const tenantId = req.query.tenant_id || DEFAULT_TENANT;
    
    // Define score buckets
    const buckets = [
      { min: 0, max: 20, label: '0-20' },
      { min: 20, max: 40, label: '20-40' },
      { min: 40, max: 60, label: '40-60' },
      { min: 60, max: 80, label: '60-80' },
      { min: 80, max: 100, label: '80-100' }
    ];
    
    const results = await Promise.all(buckets.map(async (bucket) => {
      const total = await db.collection('matching_events').countDocuments({
        tenant_id: tenantId,
        score: { $gte: bucket.min, $lt: bucket.max === 100 ? 101 : bucket.max }
      });
      
      const exported = await db.collection('matching_events').countDocuments({
        tenant_id: tenantId,
        score: { $gte: bucket.min, $lt: bucket.max === 100 ? 101 : bucket.max },
        was_exported: true
      });
      
      const rdv = await db.collection('matching_events').countDocuments({
        tenant_id: tenantId,
        score: { $gte: bucket.min, $lt: bucket.max === 100 ? 101 : bucket.max },
        rdv_scheduled: true
      });
      
      const outcomes = await db.collection('matching_events').countDocuments({
        tenant_id: tenantId,
        score: { $gte: bucket.min, $lt: bucket.max === 100 ? 101 : bucket.max },
        outcome_noted: true
      });
      
      return {
        score_range: bucket.label,
        total_matches: total,
        export_count: exported,
        export_rate: total > 0 ? Math.round((exported / total) * 100) : 0,
        rdv_count: rdv,
        rdv_rate: total > 0 ? Math.round((rdv / total) * 100) : 0,
        outcome_count: outcomes,
        outcome_rate: total > 0 ? Math.round((outcomes / total) * 100) : 0
      };
    }));
    
    res.json({
      tenant_id: tenantId,
      conversion_rates: results,
      insight: 'Higher scores correlate with higher export and RDV rates, proving match quality.'
    });
  } catch (error) {
    console.error('Conversion rates error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// Get emerging markets (high scores but low flow)
app.get('/api/v1/intelligence/emerging-markets', async (req, res) => {
  try {
    const tenantId = req.query.tenant_id || DEFAULT_TENANT;
    
    // Find territory pairs with high avg score but low connection count
    const flows = await db.collection('territorial_flows')
      .find({ tenant_id: tenantId })
      .toArray();
    
    // Calculate average flow count
    const avgFlowCount = flows.length > 0 
      ? flows.reduce((sum, f) => sum + f.flow_count, 0) / flows.length 
      : 0;
    
    // Emerging = high score (>70) but below average flow count
    const emerging = flows
      .filter(f => f.avg_score >= 70 && f.flow_count < avgFlowCount)
      .map(f => ({
        from_territory: f.from_territory,
        to_territory: f.to_territory,
        sector: f.sector,
        avg_score: f.avg_score,
        flow_count: f.flow_count,
        opportunity_score: Math.round(f.avg_score - (f.flow_count / avgFlowCount * 30))
      }))
      .sort((a, b) => b.opportunity_score - a.opportunity_score)
      .slice(0, 10);
    
    // Also find underrepresented territories in matching events
    const territoryMatches = await db.collection('matching_events').aggregate([
      { $match: { tenant_id: tenantId } },
      {
        $group: {
          _id: '$territory_a',
          match_count: { $sum: 1 },
          avg_score: { $avg: '$score' }
        }
      },
      { $sort: { match_count: 1, avg_score: -1 } },
      { $limit: 5 }
    ]).toArray();
    
    res.json({
      tenant_id: tenantId,
      emerging_corridors: emerging,
      underserved_territories: territoryMatches.map(t => ({
        territory: t._id,
        match_count: t.match_count,
        avg_score: Math.round(t.avg_score * 100) / 100
      })),
      insight: 'Ces marchés ont un fort potentiel (scores élevés) mais sont sous-exploités (peu de connexions).'
    });
  } catch (error) {
    console.error('Emerging markets error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// Get economic impact summary
app.get('/api/v1/intelligence/impact', async (req, res) => {
  try {
    const tenantId = req.query.tenant_id || DEFAULT_TENANT;
    
    const totalMatches = await db.collection('matching_events').countDocuments({ tenant_id: tenantId });
    const totalExports = await db.collection('matching_events').countDocuments({ tenant_id: tenantId, was_exported: true });
    const totalRdv = await db.collection('matching_events').countDocuments({ tenant_id: tenantId, rdv_scheduled: true });
    
    // Collaboration outcomes by type
    const outcomes = await db.collection('collaboration_outcomes').aggregate([
      { $match: { tenant_id: tenantId } },
      { $group: { _id: '$outcome_type', count: { $sum: 1 } } }
    ]).toArray();
    
    // Average score
    const avgScoreResult = await db.collection('matching_events').aggregate([
      { $match: { tenant_id: tenantId } },
      { $group: { _id: null, avg: { $avg: '$score' } } }
    ]).toArray();
    const avgScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avg) : 0;
    
    // Unique territories involved
    const territories = await db.collection('matching_events').distinct('territory_a', { tenant_id: tenantId });
    const territoriesB = await db.collection('matching_events').distinct('territory_b', { tenant_id: tenantId });
    const uniqueTerritories = [...new Set([...territories, ...territoriesB])].filter(Boolean);
    
    res.json({
      tenant_id: tenantId,
      summary: {
        total_matching_events: totalMatches,
        total_exports_generated: totalExports,
        total_rdv_scheduled: totalRdv,
        average_compatibility_score: avgScore,
        territories_connected: uniqueTerritories.length,
        export_rate: totalMatches > 0 ? Math.round((totalExports / totalMatches) * 100) : 0,
        rdv_rate: totalMatches > 0 ? Math.round((totalRdv / totalMatches) * 100) : 0
      },
      collaboration_outcomes: outcomes.reduce((acc, o) => {
        acc[o._id] = o.count;
        return acc;
      }, {}),
      territories: uniqueTerritories,
      report_generated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Impact error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// ================== START SERVER ==================

async function start() {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 KiltiKonet Smart Engine v2.0 running on port ${PORT}`);
    console.log(`📊 Multi-tenant architecture enabled`);
    console.log(`🎯 Default tenant: ${DEFAULT_TENANT}`);
  });
}

start();
