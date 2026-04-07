// useBrain.js — Hook CVL Brain chat
// TODO: Implementer la logique reelle en iter.57
import { useState, useCallback, useRef } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * useBrain() -> {
 *   messages: BrainMessage[],
 *   isThinking: boolean,
 *   tools: BrainTool[],
 *   send: (query, tool?) => Promise<void>,
 *   reset: () => void,
 *   language: 'fr' | 'kw' | 'en'
 * }
 */
export function useBrain() {
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [language, setLanguage] = useState('fr');
  const sessionId = useRef(crypto.randomUUID());

  const tools = [
    { id: 'terminal', label: 'Terminal', icon: 'terminal', endpoint: '/api/brain/chat' },
    { id: 'analyse', label: 'Analyse', icon: 'analytics', endpoint: '/api/brain/analyse' },
    { id: 'web-search', label: 'Recherche', icon: 'globe', endpoint: '/api/brain/web-search' },
    { id: 'code', label: 'Code', icon: 'code', endpoint: '/api/brain/chat' },
  ];

  const send = useCallback(async (query, tool) => {
    const userMsg = { role: 'user', content: query, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const endpoint = tool?.endpoint || `${API}/api/brain/chat`;
      const res = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query, session_id: sessionId.current,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        }),
        credentials: 'include',
      });
      const data = await res.json();
      const assistantMsg = {
        role: 'assistant',
        content: data.reply || data.response || 'Erreur',
        timestamp: new Date().toISOString(),
        thinking: data.thinking,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Erreur: ${e.message}`, timestamp: new Date().toISOString() }]);
    } finally {
      setIsThinking(false);
    }
  }, [messages]);

  const reset = useCallback(() => {
    setMessages([]);
    sessionId.current = crypto.randomUUID();
  }, []);

  return { messages, isThinking, tools, send, reset, language };
}
