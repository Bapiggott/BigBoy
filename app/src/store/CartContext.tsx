import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Cart, CartItem, MenuItem } from '../types';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { useRewards } from './RewardsContext';

interface CartContextValue {
  cart: Cart;
  itemCount: number;
  addItem: (
    item: MenuItem,
    quantity: number,
    modifiers?: CartItem['modifiers'],
    specialInstructions?: string,
    extras?: Pick<CartItem, 'ingredientOptions' | 'selectedIngredients' | 'addOnOptions' | 'selectedAddOns'>
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItemInstructions: (cartItemId: string, instructions: string) => void;
  updateItemIngredients: (cartItemId: string, selectedIngredients: string[]) => void;
  updateItemAddOns: (cartItemId: string, selectedAddOns: string[]) => void;
  clearCart: () => void;
  getItemTotal: (cartItem: CartItem) => number;
}

const EMPTY_CART: Cart = {
  items: [],
  subtotal: 0,
  discount: 0,
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
  const { appliedCoupon } = useRewards();

  const normalizePrice = (price: number) => {
    if (!Number.isFinite(price)) return 0;
    if (price >= 1000) return price / 100;
    if (price >= 100 && Number.isInteger(price)) return price / 100;
    return price;
  };

  // Load cart from storage on mount
  useEffect(() => {
    const loadCart = async () => {
      const savedCart = await storage.get<Cart>(STORAGE_KEYS.CART);
      if (savedCart) {
        setCart({ ...savedCart, discount: savedCart.discount ?? 0 });
      }
    };
    loadCart();
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    storage.set(STORAGE_KEYS.CART, cart);
  }, [cart]);

  const calculateDiscount = useCallback((items: CartItem[], subtotal: number): number => {
    if (!appliedCoupon) return 0;
    if (subtotal <= 0) return 0;

    if (appliedCoupon.discountType === 'PERCENT') {
      return Math.min(subtotal, (subtotal * appliedCoupon.value) / 100);
    }

    if (appliedCoupon.discountType === 'FIXED') {
      return Math.min(subtotal, appliedCoupon.value);
    }

    if (appliedCoupon.discountType === 'FREE_ITEM') {
      const match = appliedCoupon.match?.toLowerCase();
      if (!match) return 0;
      const eligible = items.find((item) => item.name.toLowerCase().includes(match));
      if (!eligible) return 0;
      const modifierTotal =
        eligible.modifiers?.reduce((sum, m) => sum + normalizePrice(m.priceAdjustment || 0), 0) || 0;
      return Math.min(subtotal, normalizePrice(eligible.price) + modifierTotal);
    }

    return 0;
  }, [appliedCoupon]);

  const calculateTotals = useCallback((items: CartItem[]): Pick<Cart, 'subtotal' | 'discount' | 'tax' | 'total'> => {
    const subtotal = items.reduce((sum, item) => {
      const modifierTotal =
        item.modifiers?.reduce((mSum, m) => mSum + normalizePrice(m.priceAdjustment || 0), 0) || 0;
      return sum + (normalizePrice(item.price) + modifierTotal) * item.quantity;
    }, 0);
    const discount = calculateDiscount(items, subtotal);
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const tax = Math.round(discountedSubtotal * TAX_RATE * 100) / 100;
    const total = Math.round((discountedSubtotal + tax) * 100) / 100;
    return { subtotal, discount, tax, total };
  }, [calculateDiscount]);

  const addItem = useCallback((
    menuItem: MenuItem,
    quantity: number,
    modifiers?: CartItem['modifiers'],
    specialInstructions?: string,
    extras?: Pick<CartItem, 'ingredientOptions' | 'selectedIngredients' | 'addOnOptions' | 'selectedAddOns'>
  ) => {
    setCart(current => {
      const cartItemId = `cart-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const newItem: CartItem = {
        id: cartItemId,
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: normalizePrice(menuItem.price),
        quantity,
        modifiers,
        specialInstructions,
        image: menuItem.image || menuItem.imageUrl,
        ingredientOptions: extras?.ingredientOptions,
        selectedIngredients: extras?.selectedIngredients,
        addOnOptions: extras?.addOnOptions,
        selectedAddOns: extras?.selectedAddOns,
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

  const updateItemInstructions = useCallback((cartItemId: string, instructions: string) => {
    setCart(current => {
      const newItems = current.items.map(item =>
        item.id === cartItemId ? { ...item, specialInstructions: instructions } : item
      );
      const totals = calculateTotals(newItems);
      return { items: newItems, ...totals };
    });
  }, [calculateTotals]);

  const updateItemIngredients = useCallback((cartItemId: string, selectedIngredients: string[]) => {
    setCart(current => {
      const newItems = current.items.map(item =>
        item.id === cartItemId ? { ...item, selectedIngredients } : item
      );
      const totals = calculateTotals(newItems);
      return { items: newItems, ...totals };
    });
  }, [calculateTotals]);

  const updateItemAddOns = useCallback((cartItemId: string, selectedAddOns: string[]) => {
    setCart(current => {
      const newItems = current.items.map(item =>
        item.id === cartItemId ? { ...item, selectedAddOns } : item
      );
      const totals = calculateTotals(newItems);
      return { items: newItems, ...totals };
    });
  }, [calculateTotals]);

  const clearCart = useCallback(() => {
    setCart(EMPTY_CART);
  }, []);

  const getItemTotal = useCallback((cartItem: CartItem): number => {
    const modifierTotal =
      cartItem.modifiers?.reduce((sum, m) => sum + normalizePrice(m.priceAdjustment || 0), 0) || 0;
    return (normalizePrice(cartItem.price) + modifierTotal) * cartItem.quantity;
  }, []);

  useEffect(() => {
    setCart((current) => {
      const totals = calculateTotals(current.items);
      return { ...current, ...totals };
    });
  }, [appliedCoupon, calculateTotals]);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      itemCount,
      addItem,
      removeItem,
      updateQuantity,
      updateItemInstructions,
      updateItemIngredients,
      updateItemAddOns,
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
