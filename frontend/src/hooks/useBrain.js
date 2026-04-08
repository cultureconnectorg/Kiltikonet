// useBrain.js — Hook CVL Brain câblé sur /api/brain/chat-enriched
import { useState, useCallback, useRef } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

export function useBrain() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "**CVL BRAIN v1.0** — Moteur d'intelligence culturelle souverain.\n\nJe suis connecte a la base de connaissances kiltikonet. Comment puis-je t'aider ?",
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);
  const sessionIdRef = useRef(crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());

  const send = useCallback(async (text, options = {}) => {
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);
    setError(null);

    try {
      const res = await fetch(`${API}/api/brain/chat-enriched`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          messages: [...messages, userMsg],
          use_web_search: options.useWeb || false,
          user_name: options.userName || 'utilisateur',
          user_context: options.userContext || null,
          langue_preference: options.langue || 'fr',
          frek_id: options.frekId || '',
          session_id: sessionIdRef.current,
        }),
        credentials: 'include',
      });

      if (res.status === 429) {
        const data = await res.json();
        const errMsg = data.detail || 'Quota journalier atteint';
        setMessages((prev) => [...prev, { role: 'assistant', content: `**Quota atteint.** ${errMsg}` }]);
        setError(errMsg);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Erreur Brain');
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          meta: {
            web_enriched: data.web_enriched,
            langue_detectee: data.langue_detectee,
            cultural_score: data.cultural_score,
          },
        },
      ]);
    } catch (e) {
      setError(e.message);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `**Erreur:** ${e.message}` },
      ]);
    } finally {
      setIsThinking(false);
    }
  }, [messages]);

  const reset = useCallback(() => {
    sessionIdRef.current = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    setMessages([
      {
        role: 'assistant',
        content: "**CVL BRAIN v1.0** — Nouvelle session. Comment puis-je t'aider ?",
      },
    ]);
    setError(null);
  }, []);

  return { messages, isThinking, error, send, reset, sessionId: sessionIdRef.current };
}
