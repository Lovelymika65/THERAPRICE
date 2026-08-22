import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(null);
const CART_KEY = 'theraprice_cart';

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CART_KEY);
        if (raw) setCartItems(JSON.parse(raw));
      } catch (_) {}
    })();
  }, []);

  const persist = async (items) => {
    setCartItems(items);
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  };

  const addToCart = async (listing, qty = 1) => {
    const existing = cartItems.find((i) => i.id === listing.id);
    const available = Math.max(1, Number(listing.quantity_available) || 1);
    let updated;
    if (existing) {
      updated = cartItems.map((i) =>
        i.id === listing.id ? { ...i, qty: Math.min(available, i.qty + qty) } : i
      );
    } else {
      updated = [...cartItems, { ...listing, qty: Math.min(available, Math.max(1, qty)) }];
    }
    await persist(updated);
  };

  const removeFromCart = async (listingId) => {
    await persist(cartItems.filter((i) => i.id !== listingId));
  };

  const updateQty = async (listingId, qty) => {
    if (qty <= 0) return removeFromCart(listingId);
    await persist(cartItems.map((i) => {
      if (i.id !== listingId) return i;
      const available = Math.max(1, Number(i.quantity_available) || 1);
      return { ...i, qty: Math.min(available, qty) };
    }));
  };

  const clearCart = async () => persist([]);

  const cartTotal = cartItems.reduce((sum, i) => sum + i.price_xaf * i.qty, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQty, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
