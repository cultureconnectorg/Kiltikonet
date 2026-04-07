// useNFC.js — Hook scanner NFC/QR terrain
// TODO: Implementer la logique reelle en iter.57
import { useState, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * useNFC() -> {
 *   lastScan: NFCScanResult | null,
 *   scanning: boolean,
 *   error: string | null,
 *   scan: (badge_id, zone, event_day, scan_type) => Promise<NFCScanResult>,
 *   reset: () => void
 * }
 */
export function useNFC() {
  const [lastScan, setLastScan] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  const scan = useCallback(async (badge_id, zone_access, event_day, scan_type = 'QR') => {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/terrain/scan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badge_id, zone_access, event_day, scan_type }),
        credentials: 'include',
      });
      const data = await res.json();
      setLastScan(data);
      return data;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setScanning(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLastScan(null);
    setError(null);
  }, []);

  return { lastScan, scanning, error, scan, reset };
}
