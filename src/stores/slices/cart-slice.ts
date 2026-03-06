import type { StateCreator } from 'zustand';
import type { CartItem } from '@/types/configurator';

export interface CartSlice {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (moduleId: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const createCartSlice: StateCreator<CartSlice, [], [], CartSlice> = (set, get) => ({
  cartItems: [],

  addToCart: (item) =>
    set((state) => {
      const existing = state.cartItems.find((i) => i.moduleId === item.moduleId);
      if (existing) {
        return {
          cartItems: state.cartItems.map((i) =>
            i.moduleId === item.moduleId ? { ...i, quantity: i.quantity + item.quantity } : i
          ),
        };
      }
      return { cartItems: [...state.cartItems, item] };
    }),

  removeFromCart: (moduleId) =>
    set((state) => ({
      cartItems: state.cartItems.filter((i) => i.moduleId !== moduleId),
    })),

  clearCart: () => set({ cartItems: [] }),

  getTotalPrice: () => {
    return get().cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  },
});
