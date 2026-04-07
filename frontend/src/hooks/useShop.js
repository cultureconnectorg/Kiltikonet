// useShop.js — Hook boutique/marketplace
// TODO: Implementer la logique reelle en iter.57
import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * useShop() -> {
 *   products: ShopItem[],
 *   packs: ShopPack[],
 *   loading: boolean,
 *   checkout: (itemId, quantity) => Promise<{url: string}>,
 *   refresh: () => void
 * }
 */
export function useShop() {
  const [products, setProducts] = useState([]);
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, packRes] = await Promise.all([
        fetch(`${API}/api/shop/products`),
        fetch(`${API}/api/shop/packages`),
      ]);
      if (prodRes.ok) setProducts((await prodRes.json()).products || []);
      if (packRes.ok) setPacks((await packRes.json()).packages || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const checkout = useCallback(async (itemId, quantity = 1) => {
    const res = await fetch(`${API}/api/fintech/create-checkout`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pack_id: itemId, quantity }), credentials: 'include',
    });
    return res.json();
  }, []);

  return { products, packs, loading, checkout, refresh };
}
