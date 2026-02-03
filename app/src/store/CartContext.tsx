import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Cart, CartItem, MenuItem } from '../types';
import { storage, STORAGE_KEYS } from '../utils/storage';

interface CartContextValue {
  cart: Cart;
  itemCount: number;
  addItem: (item: MenuItem, quantity: number, modifiers?: CartItem['modifiers'], specialInstructions?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemTotal: (cartItem: CartItem) => number;
}

const EMPTY_CART: Cart = {
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
};

const TAX_RATE = 0.06; // 6% Michigan sales tax

const CartContext = createContext<CartContextValue | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);

  // Load cart from storage on mount
  useEffect(() => {
    const loadCart = async () => {
      const savedCart = await storage.get<Cart>(STORAGE_KEYS.CART);
      if (savedCart) {
        setCart(savedCart);
      }
    };
    loadCart();
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    storage.set(STORAGE_KEYS.CART, cart);
  }, [cart]);

  const calculateTotals = useCallback((items: CartItem[]): Pick<Cart, 'subtotal' | 'tax' | 'total'> => {
    const subtotal = items.reduce((sum, item) => {
      const modifierTotal = item.modifiers?.reduce((mSum, m) => mSum + (m.priceAdjustment || 0), 0) || 0;
      return sum + (item.price + modifierTotal) * item.quantity;
    }, 0);
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    return { subtotal, tax, total };
  }, []);

  const addItem = useCallback((
    menuItem: MenuItem,
    quantity: number,
    modifiers?: CartItem['modifiers'],
    specialInstructions?: string
  ) => {
    setCart(current => {
      const cartItemId = `cart-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const newItem: CartItem = {
        id: cartItemId,
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        modifiers,
        specialInstructions,
        image: menuItem.image || menuItem.imageUrl,
      };

      const newItems = [...current.items, newItem];
      const totals = calculateTotals(newItems);

      return { items: newItems, ...totals };
    });
  }, [calculateTotals]);

  const removeItem = useCallback((cartItemId: string) => {
    setCart(current => {
      const newItems = current.items.filter(item => item.id !== cartItemId);
      const totals = calculateTotals(newItems);
      return { items: newItems, ...totals };
    });
  }, [calculateTotals]);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity < 1) return;

    setCart(current => {
      const newItems = current.items.map(item =>
        item.id === cartItemId ? { ...item, quantity } : item
      );
      const totals = calculateTotals(newItems);
      return { items: newItems, ...totals };
    });
  }, [calculateTotals]);

  const clearCart = useCallback(() => {
    setCart(EMPTY_CART);
  }, []);

  const getItemTotal = useCallback((cartItem: CartItem): number => {
    const modifierTotal = cartItem.modifiers?.reduce((sum, m) => sum + (m.priceAdjustment || 0), 0) || 0;
    return (cartItem.price + modifierTotal) * cartItem.quantity;
  }, []);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      itemCount,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getItemTotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
