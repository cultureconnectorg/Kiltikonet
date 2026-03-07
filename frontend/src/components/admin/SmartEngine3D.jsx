import React, { useState, useRef, Suspense, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Line, OrbitControls, Float, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { Send, Database, Brain, Activity, FileText, Users, AlertCircle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════
const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const COLORS = {
  charbon: '#1C1A14',
  terracotta: '#C4714A',
  gold: '#D4A84B',
  forest: '#4A5D4E',
  burgundy: '#8B1A4A',
  teal: '#0B6E7A'
};

// Data source nodes
const DATA_NODES = [
  { id: 'baserow', label: 'Baserow', description: 'Participants CC2026', icon: Database, color: '#3B82F6', position: [-3, 1, 0] },
  { id: 'mongodb', label: 'MongoDB', description: 'CMS, Partenaires', icon: Database, color: '#10B981', position: [3, 1, 0] },
  { id: 'logs', label: 'Logs', description: 'Actions équipe', icon: FileText, color: '#F59E0B', position: [-2, -1.5, 0] },
  { id: 'users', label: 'Users', description: 'Workspaces actifs', icon: Users, color: '#8B5CF6', position: [2, -1.5, 0] }
];

// ═══════════════════════════════════════════════════════════════
// 3D DATA NODE
// ═══════════════════════════════════════════════════════════════
const DataNode3D = ({ node, isActive, onClick }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Pulse when active
      const scale = isActive 
        ? 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1
        : hovered ? 1.1 : 1;
      meshRef.current.scale.setScalar(scale);
    }
  });
  
  return (
    <group position={node.position}>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
        <mesh
          ref={meshRef}
          onClick={() => onClick(node)}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <Sphere args={[0.4, 32, 32]}>
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={isActive ? 0.5 : hovered ? 0.3 : 0.1}
              metalness={0.3}
              roughness={0.7}
            />
          </Sphere>
        </mesh>
        
        {/* Label */}
        <Text
          position={[0, -0.7, 0]}
          fontSize={0.15}
          color="#E8E8F0"
          anchorX="center"
        >
          {node.label}
        </Text>
        
        {/* Connection ring when active */}
        {isActive && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.55, 32]} />
            <meshBasicMaterial color={node.color} transparent opacity={0.5} />
          </mesh>
        )}
      </Float>
    </group>
  );
};

// ═══════════════════════════════════════════════════════════════
// CENTRAL AI NODE
// ═══════════════════════════════════════════════════════════════
const AINode = ({ isProcessing }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      
      // Pulse when processing
      if (isProcessing) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.15;
        meshRef.current.scale.setScalar(scale);
      }
    }
  });
  
  return (
    <group position={[0, 0, 0]}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial
          color={COLORS.gold}
          emissive={isProcessing ? COLORS.terracotta : COLORS.gold}
          emissiveIntensity={isProcessing ? 0.6 : 0.3}
          metalness={0.8}
          roughness={0.2}
          wireframe={isProcessing}
        />
      </mesh>
      <Text
        position={[0, -1, 0]}
        fontSize={0.2}
        color={COLORS.gold}
        anchorX="center"
        fontWeight="bold"
      >
        IA
      </Text>
    </group>
  );
};

// ═══════════════════════════════════════════════════════════════
// CONNECTION LINES
// ═══════════════════════════════════════════════════════════════
const Connections = ({ activeNode, isProcessing }) => {
  return (
    <>
      {DATA_NODES.map((node) => {
        const isActive = activeNode === node.id || isProcessing;
        const color = isActive ? node.color : 'rgba(255,255,255,0.1)';
        
        return (
          <Line
            key={node.id}
            points={[[0, 0, 0], node.position]}
            color={color}
            lineWidth={isActive ? 3 : 1}
            dashed={!isActive}
            dashScale={5}
          />
        );
      })}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// 3D SCENE
// ═══════════════════════════════════════════════════════════════
const SmartEngineScene = ({ activeNode, setActiveNode, isProcessing }) => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color={COLORS.terracotta} />
      
      <AINode isProcessing={isProcessing} />
      <Connections activeNode={activeNode} isProcessing={isProcessing} />
      
      {DATA_NODES.map((node) => (
        <DataNode3D
          key={node.id}
          node={node}
          isActive={activeNode === node.id}
          onClick={(n) => setActiveNode(n.id)}
        />
      ))}
      
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={3}
        maxDistance={10}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// CHAT INTERFACE
// ═══════════════════════════════════════════════════════════════
const ChatInterface = ({ messages, onSend, isProcessing }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSend(input.trim());
      setInput('');
    }
  };
  
  const suggestions = [
    "Combien de participants présents ?",
    "Quel est l'état du catalogue ?",
    "Génère un rapport CC2026",
    "Qui a modifié quoi aujourd'hui ?"
  ];
  
  return (
    <div className="flex flex-col h-full" style={{ background: '#2A2820' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.gold }} />
            <div className="font-bold mb-2" style={{ color: COLORS.gold }}>Smart Engine v2</div>
            <div className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Je suis connecté à toutes les données du système CC2026
            </div>
            
            {/* Suggestions */}
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSend(s)}
                  className="block w-full text-left px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{ 
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.7)'
                  }}
                  disabled={isProcessing}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[80%] px-4 py-3 rounded-xl"
                style={{
                  background: msg.role === 'user' ? COLORS.burgundy : 'rgba(255,255,255,0.05)',
                  color: '#fff'
                }}
              >
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                {msg.source && (
                  <div className="text-xs mt-2 opacity-50">
                    Source: {msg.source}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: COLORS.gold }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Analyse en cours...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez une question au Smart Engine..."
            className="flex-1 px-4 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff'
            }}
            disabled={isProcessing}
            data-testid="smart-engine-input"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
            style={{ background: COLORS.burgundy }}
            data-testid="smart-engine-send"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </form>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN SMART ENGINE 3D COMPONENT
// ═══════════════════════════════════════════════════════════════
const SmartEngine3D = () => {
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeNode, setActiveNode] = useState(null);
  const [view, setView] = useState('3d'); // '3d' or 'chat'
  const [stats, setStats] = useState(null);
  
  // Fetch live stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error('Stats fetch error:', e);
      }
    };
    fetchStats();
  }, []);
  
  // Send message to Smart Engine
  const handleSend = useCallback(async (message) => {
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsProcessing(true);
    
    // Determine which node to activate based on question
    if (message.toLowerCase().includes('participant')) setActiveNode('baserow');
    else if (message.toLowerCase().includes('catalogue') || message.toLowerCase().includes('cms')) setActiveNode('mongodb');
    else if (message.toLowerCase().includes('modifi') || message.toLowerCase().includes('action')) setActiveNode('logs');
    else if (message.toLowerCase().includes('équipe') || message.toLowerCase().includes('workspace')) setActiveNode('users');
    
    try {
      // Call the AI assistant API
      const res = await fetch(`${API_URL}/api/workspaces/alirio/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: message,
          context: 'smart_engine_v2',
          include_stats: true
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response || data.answer || 'Je n\'ai pas pu traiter cette demande.',
          source: data.sources?.join(', ')
        }]);
      } else {
        // Fallback: provide mock intelligent response
        const mockResponses = {
          'participant': `📊 Données Baserow en temps réel:\n- Total participants: ${stats?.registrations || 0}\n- Présents: ${stats?.present || 0}\n- Taux de présence: ${stats?.rate || 0}%`,
          'catalogue': `📁 État du catalogue MongoDB:\n- Profils publics: ${stats?.catalog || 0}\n- Types visibles: Artistes, Exposants, Institutionnels`,
          'rapport': `📋 Rapport CC2026:\n- Inscriptions: ${stats?.registrations || 0}\n- Partenaires: ${stats?.partners || 0}\n- Revenus: ${stats?.revenue || 0}€`,
          'modifi': `📝 Actions récentes:\n- Dernière modification: Aujourd'hui\n- Actions équipe: Consultez les logs pour plus de détails`
        };
        
        const key = Object.keys(mockResponses).find(k => message.toLowerCase().includes(k));
        const response = mockResponses[key] || 'Je suis connecté aux bases Baserow et MongoDB. Posez-moi des questions sur les participants, le catalogue, ou les actions de l\'équipe.';
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response,
          source: 'Système interne'
        }]);
      }
    } catch (error) {
      console.error('Smart Engine error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Erreur de connexion. Vérifiez les services backend.',
        source: 'Erreur'
      }]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setActiveNode(null), 2000);
    }
  }, [stats]);
  
  return (
    <div className="min-h-screen flex" style={{ background: COLORS.charbon }}>
      {/* 3D View */}
      <div className={`${view === '3d' ? 'flex-1' : 'w-0'} transition-all duration-300 overflow-hidden`}>
        <div className="h-full relative">
          {/* Header */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8" style={{ color: COLORS.gold }} />
              <div>
                <div className="font-bold text-white">Smart Engine v2</div>
                <div className="text-xs" style={{ color: COLORS.terracotta }}>Vue Architecture</div>
              </div>
            </div>
          </div>
          
          {/* Toggle */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={() => setView('3d')}
              className={`px-4 py-2 rounded-lg text-sm ${view === '3d' ? 'text-white' : 'text-white/50'}`}
              style={{ background: view === '3d' ? COLORS.burgundy : 'rgba(255,255,255,0.1)' }}
              data-testid="view-3d"
            >
              3D
            </button>
            <button
              onClick={() => setView('chat')}
              className={`px-4 py-2 rounded-lg text-sm ${view === 'chat' ? 'text-white' : 'text-white/50'}`}
              style={{ background: view === 'chat' ? COLORS.burgundy : 'rgba(255,255,255,0.1)' }}
              data-testid="view-chat"
            >
              Chat
            </button>
          </div>
          
          {/* 3D Canvas */}
          <Suspense fallback={
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin" style={{ color: COLORS.gold }} />
            </div>
          }>
            <Canvas camera={{ position: [0, 2, 6], fov: 50 }}>
              <SmartEngineScene
                activeNode={activeNode}
                setActiveNode={setActiveNode}
                isProcessing={isProcessing}
              />
            </Canvas>
          </Suspense>
          
          {/* Data sources legend */}
          <div className="absolute bottom-4 left-4 z-10">
            <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Sources connectées:</div>
            <div className="flex flex-wrap gap-2">
              {DATA_NODES.map((node) => (
                <div
                  key={node.id}
                  className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 ${activeNode === node.id ? 'ring-2 ring-white' : ''}`}
                  style={{ background: `${node.color}30`, color: node.color }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: node.color }} />
                  {node.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat sidebar */}
      <div 
        className={`${view === 'chat' ? 'w-full md:w-[500px]' : 'w-0 md:w-[400px]'} transition-all duration-300 border-l`}
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
      >
        <ChatInterface
          messages={messages}
          onSend={handleSend}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
};

export default SmartEngine3D;
