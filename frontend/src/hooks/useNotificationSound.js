import { useCallback, useRef, useEffect } from 'react';

const NOTIF_SOUND_URL = '/sounds/notif.mp3';
const NOTIF_SOUND_OGG = '/sounds/notif.ogg';

export function useNotificationSound() {
  const audioCtxRef = useRef(null);
  const bufferRef = useRef(null);
  const enabledRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem('kk_notif_sound');
    enabledRef.current = stored === 'true';
  }, []);

  const loadBuffer = useCallback(async () => {
    if (bufferRef.current) return bufferRef.current;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const canPlayOgg = document.createElement('audio').canPlayType('audio/ogg; codecs=vorbis');
      const url = canPlayOgg ? NOTIF_SOUND_OGG : NOTIF_SOUND_URL;
      const resp = await fetch(url);
      const arrayBuf = await resp.arrayBuffer();
      bufferRef.current = await audioCtxRef.current.decodeAudioData(arrayBuf);
      return bufferRef.current;
    } catch {
      return null;
    }
  }, []);

  const play = useCallback(async () => {
    if (!enabledRef.current) return;
    if (document.hidden) return;
    try {
      const buffer = await loadBuffer();
      if (!buffer || !audioCtxRef.current) return;
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      const gain = audioCtxRef.current.createGain();
      gain.gain.value = 0.6;
      source.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      source.start(0);
    } catch {
      // silent fail
    }
  }, [loadBuffer]);

  const setEnabled = useCallback((val) => {
    enabledRef.current = val;
    localStorage.setItem('kk_notif_sound', val ? 'true' : 'false');
  }, []);

  const isEnabled = useCallback(() => enabledRef.current, []);

  return { play, setEnabled, isEnabled };
}
