// useTrade.js — Hook trading P2P
// TODO: Implementer la logique reelle en iter.58
import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * useTrade() -> {
 *   orders: TradeOrder[],
 *   myOrders: TradeOrder[],
 *   loading: boolean,
 *   createOrder: (offer_type, token_type, amount, price) => Promise<void>,
 *   cancelOrder: (orderId) => Promise<void>,
 *   refresh: () => void
 * }
 */
export function useTrade() {
  const [orders, setOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/omega/trade/orders`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setMyOrders(data.my_orders || []);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createOrder = useCallback(async (offer_type, token_type, amount, price_eur_per_token) => {
    await fetch(`${API}/api/omega/trade/orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offer_type, token_type, amount, price_eur_per_token }),
      credentials: 'include',
    });
    refresh();
  }, [refresh]);

  const cancelOrder = useCallback(async (orderId) => {
    await fetch(`${API}/api/omega/trade/orders/${orderId}`, {
      method: 'DELETE', credentials: 'include',
    });
    refresh();
  }, [refresh]);

  return { orders, myOrders, loading, createOrder, cancelOrder, refresh };
}
