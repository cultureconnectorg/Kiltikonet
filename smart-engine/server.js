/**
 * KiltiKonet Smart Engine
 * AI-powered matching service for Culture Connect 2026
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const { MongoClient } = require('mongodb');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8002;

// Backend API URL for LLM services
const BACKEND_API = 'http://localhost:8001/api/v1';

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
    
    // Create indexes for vector search optimization
    await db.collection('smart_profiles').createIndex({ 'id': 1 }, { unique: true });
    await db.collection('smart_documents').createIndex({ 'id': 1 }, { unique: true });
    await db.collection('smart_documents').createIndex({ 'category': 1 });
    console.log('✅ Indexes created');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// ================== UTILITY FUNCTIONS ==================

/**
 * Generate embedding using Python backend
 */
async function generateEmbedding(text) {
  try {
    const response = await axios.post(`${BACKEND_API}/llm/embedding`, { text });
    return response.data.embedding;
  } catch (error) {
    console.error('Embedding error:', error.response?.data || error.message);
    throw new Error('Failed to generate embedding');
  }
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
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Generate match reason using Claude
 */
async function generateMatchReason(profileA, profileB, score) {
  try {
    const message = `En une phrase courte en français, explique pourquoi "${profileA.name}" (${profileA.type}, ${profileA.territory}) est compatible à ${score}% avec "${profileB.name}" (${profileB.type}, ${profileB.territory}) dans le contexte culturel afro-caribéen. Sois concis et professionnel.`;
    return await callClaude(message);
  } catch (error) {
    console.error('Match reason error:', error);
    return `Compatibilité basée sur les secteurs et territoires communs.`;
  }
}

/**
 * Create profile text for embedding
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

// ================== API ROUTES ==================

// Health check
app.get('/api/v1/smart-recommendations/health', (req, res) => {
  res.json({ status: 'ok', service: 'KiltiKonet Smart Engine', version: '1.0.0' });
});

// Index a profile
app.post('/api/v1/smart-recommendations/index', async (req, res) => {
  try {
    const { name, type, sector, genres, tags, territory, description, seeking, offering } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    
    const profile = {
      id: uuidv4(),
      name,
      type,
      sector: sector || '',
      genres: genres || [],
      tags: (tags || []).slice(0, 12), // Max 12 tags
      territory: territory || '',
      description: description || '',
      seeking: seeking || '',
      offering: offering || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Generate embedding
    const profileText = createProfileText(profile);
    const embedding = await generateEmbedding(profileText);
    profile.embedding = embedding;
    
    // Store in MongoDB
    await db.collection('smart_profiles').insertOne(profile);
    
    res.json({
      success: true,
      message: 'Profil indexé avec succès',
      profile: {
        id: profile.id,
        name: profile.name,
        type: profile.type,
        territory: profile.territory
      }
    });
  } catch (error) {
    console.error('Index error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'indexation du profil' });
  }
});

// Get recommendations for a profile
app.get('/api/v1/smart-recommendations/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    
    // Get the source profile
    const sourceProfile = await db.collection('smart_profiles').findOne({ id: profileId });
    if (!sourceProfile) {
      return res.status(404).json({ error: 'Profil non trouvé' });
    }
    
    // Get all other profiles
    const allProfiles = await db.collection('smart_profiles').find({ id: { $ne: profileId } }).toArray();
    
    if (allProfiles.length === 0) {
      return res.json({
        source: { id: sourceProfile.id, name: sourceProfile.name },
        recommendations: [],
        message: 'Aucun autre profil disponible pour les recommandations'
      });
    }
    
    // Calculate similarities
    const similarities = allProfiles.map(profile => ({
      profile,
      similarity: cosineSimilarity(sourceProfile.embedding, profile.embedding)
    }));
    
    // Sort by similarity and take top 5
    similarities.sort((a, b) => b.similarity - a.similarity);
    const top5 = similarities.slice(0, 5);
    
    // Generate match reasons for top matches
    const recommendations = await Promise.all(top5.map(async (item, index) => {
      const score = Math.round(item.similarity * 100);
      const matchReason = await generateMatchReason(sourceProfile, item.profile, score);
      
      return {
        rank: index + 1,
        id: item.profile.id,
        name: item.profile.name,
        type: item.profile.type,
        sector: item.profile.sector,
        territory: item.profile.territory,
        genres: item.profile.genres,
        tags: item.profile.tags,
        score,
        matchReason
      };
    }));
    
    res.json({
      source: {
        id: sourceProfile.id,
        name: sourceProfile.name,
        type: sourceProfile.type,
        territory: sourceProfile.territory
      },
      recommendations
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération des recommandations' });
  }
});

// List all profiles
app.get('/api/v1/smart-recommendations/profiles', async (req, res) => {
  try {
    const profiles = await db.collection('smart_profiles')
      .find({}, { projection: { embedding: 0, _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    
    res.json({ profiles, total: profiles.length });
  } catch (error) {
    console.error('List profiles error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des profils' });
  }
});

// Delete a profile
app.delete('/api/v1/smart-recommendations/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('smart_profiles').deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Profil non trouvé' });
    }
    
    res.json({ success: true, message: 'Profil supprimé' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// ================== RAG ENDPOINTS ==================

// Index a document for RAG
app.post('/api/v1/smart-recommendations/rag/index', async (req, res) => {
  try {
    const { title, content, category } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const document = {
      id: uuidv4(),
      title,
      content,
      category: category || 'general',
      created_at: new Date().toISOString()
    };
    
    // Generate embedding
    const embedding = await generateEmbedding(`${title}\n\n${content}`);
    document.embedding = embedding;
    
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
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question requise' });
    }
    
    // Generate embedding for question
    const questionEmbedding = await generateEmbedding(question);
    
    // Get all documents
    const documents = await db.collection('smart_documents').find({}).toArray();
    
    if (documents.length === 0) {
      // No documents, use general knowledge
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Tu es un assistant expert en industries culturelles afro-caribéennes pour Culture Connect 2026 en Martinique. Réponds en français de manière professionnelle et utile.\n\nQuestion: ${question}`
        }]
      });
      
      return res.json({
        answer: message.content[0].text,
        sources: [],
        note: 'Réponse basée sur les connaissances générales (aucun document indexé)'
      });
    }
    
    // Calculate similarities and get top 4
    const similarities = documents.map(doc => ({
      doc,
      similarity: cosineSimilarity(questionEmbedding, doc.embedding)
    }));
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    const relevantDocs = similarities.slice(0, 4);
    
    // Build context
    const context = relevantDocs.map((item, i) => 
      `[Source ${i + 1}: ${item.doc.title}]\n${item.doc.content}`
    ).join('\n\n---\n\n');
    
    // Call Claude with context
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Tu es un assistant expert en industries culturelles afro-caribéennes pour Culture Connect 2026 en Martinique.

Voici des documents de référence:

${context}

---

En te basant sur ces documents, réponds à la question suivante en français. Cite les sources utilisées entre crochets [Source X].

Question: ${question}`
      }]
    });
    
    res.json({
      answer: message.content[0].text,
      sources: relevantDocs.map(item => ({
        title: item.doc.title,
        category: item.doc.category,
        relevance: Math.round(item.similarity * 100)
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
    const documents = await db.collection('smart_documents')
      .find({}, { projection: { embedding: 0, _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    
    res.json({ documents, total: documents.length });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des documents' });
  }
});

// ================== EXPORT ENDPOINT ==================

// Generate export recommendation text
app.post('/api/v1/smart-recommendations/export', async (req, res) => {
  try {
    const { profileA, profileB, score } = req.body;
    
    if (!profileA || !profileB || score === undefined) {
      return res.status(400).json({ error: 'Données de profils requises' });
    }
    
    const prompt = `En 2-3 phrases professionnelles en français, explique pourquoi le profil "${profileA.name}" (type: ${profileA.type}, territoire: ${profileA.territory}, genres: ${(profileA.genres || []).join(', ')}) est compatible à ${score}% avec le profil "${profileB.name}" (type: ${profileB.type}, territoire: ${profileB.territory}) dans le cadre d'un développement culturel afro-caribéen. Formule comme une recommandation officielle pour un dossier de subvention.`;
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });
    
    res.json({
      success: true,
      recommendation: message.content[0].text,
      profileA: { name: profileA.name, type: profileA.type },
      profileB: { name: profileB.name, type: profileB.type },
      score
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération de la recommandation' });
  }
});

// Generate PDF
app.post('/api/v1/smart-recommendations/export/pdf', async (req, res) => {
  try {
    const { profileA, profileB, score, recommendation } = req.body;
    
    if (!profileA || !profileB || !recommendation) {
      return res.status(400).json({ error: 'Données requises manquantes' });
    }
    
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=recommandation_${profileA.name.replace(/\s+/g, '_')}_${profileB.name.replace(/\s+/g, '_')}.pdf`);
      res.send(pdfBuffer);
    });
    
    // Header
    doc.fontSize(24).fillColor('#A65D47').text('Culture Connect 2026', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#C8922A').text('KiltiKonet Smart Engine', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666666').text('Recommandation de Partenariat', { align: 'center' });
    
    // Date
    doc.moveDown(1.5);
    const date = new Date().toLocaleDateString('fr-FR', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    doc.fontSize(10).fillColor('#333333').text(`Date: ${date}`, { align: 'right' });
    
    // Line
    doc.moveDown(1);
    doc.strokeColor('#A65D47').lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
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
    doc.fontSize(14).fillColor('#A65D47').text(`Score de Compatibilité: ${score}%`, { align: 'center' });
    
    // Recommendation
    doc.moveDown(1);
    doc.fontSize(12).fillColor('#1A1A1A').text('RECOMMANDATION', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#333333').text(recommendation, { align: 'justify', lineGap: 4 });
    
    // Footer
    doc.moveDown(2);
    doc.strokeColor('#CCCCCC').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#888888').text(
      'Généré par KiltiKonet Smart Engine — kiltikonet.fr',
      { align: 'center' }
    );
    doc.text(
      'Ce document est généré automatiquement à des fins d\'aide à la décision.',
      { align: 'center' }
    );
    
    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
});

// ================== START SERVER ==================

async function start() {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 KiltiKonet Smart Engine running on port ${PORT}`);
  });
}

start();
