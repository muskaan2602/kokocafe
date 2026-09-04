"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import type { CartItem } from "@/lib/supabase/types";

interface CartState {
  items: CartItem[];
  tableToken: string;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QTY"; payload: { menuItemId: string; quantity: number } }
  | { type: "UPDATE_INSTRUCTIONS"; payload: { menuItemId: string; instructions: string } }
  | { type: "CLEAR_CART" }
  | { type: "SET_TABLE"; payload: string };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (i) => i.menuItemId === action.payload.menuItemId
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.menuItemId === action.payload.menuItemId
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.menuItemId !== action.payload),
      };
    case "UPDATE_QTY":
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (i) => i.menuItemId !== action.payload.menuItemId
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.menuItemId === action.payload.menuItemId
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };
    case "UPDATE_INSTRUCTIONS":
      return {
        ...state,
        items: state.items.map((i) =>
          i.menuItemId === action.payload.menuItemId
            ? { ...i, specialInstructions: action.payload.instructions }
            : i
        ),
      };
    case "CLEAR_CART":
      return { ...state, items: [] };
    case "SET_TABLE":
      return { ...state, tableToken: action.payload };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  tableToken: string;
  totalItems: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQty: (menuItemId: string, quantity: number) => void;
  updateInstructions: (menuItemId: string, instructions: string) => void;
  clearCart: () => void;
  setTable: (token: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function getStorageKey(token: string) {
  return `koko_cart_${token}`;
}

export function CartProvider({
  children,
  tableToken,
}: {
  children: React.ReactNode;
  tableToken: string;
}) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    tableToken,
  });

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(tableToken));
      if (saved) {
        const items: CartItem[] = JSON.parse(saved);
        items.forEach((item) =>
          dispatch({ type: "ADD_ITEM", payload: item })
        );
      }
    } catch {}
  }, [tableToken]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        getStorageKey(tableToken),
        JSON.stringify(state.items)
      );
    } catch {}
  }, [state.items, tableToken]);

  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = state.items.reduce(
    (s, i) => s + i.price * i.quantity,
    0
  );

  const addItem = useCallback(
    (item: CartItem) => dispatch({ type: "ADD_ITEM", payload: item }),
    []
  );
  const removeItem = useCallback(
    (menuItemId: string) =>
      dispatch({ type: "REMOVE_ITEM", payload: menuItemId }),
    []
  );
  const updateQty = useCallback(
    (menuItemId: string, quantity: number) =>
      dispatch({ type: "UPDATE_QTY", payload: { menuItemId, quantity } }),
    []
  );
  const updateInstructions = useCallback(
    (menuItemId: string, instructions: string) =>
      dispatch({
        type: "UPDATE_INSTRUCTIONS",
        payload: { menuItemId, instructions },
      }),
    []
  );
  const clearCart = useCallback(() => dispatch({ type: "CLEAR_CART" }), []);
  const setTable = useCallback(
    (token: string) => dispatch({ type: "SET_TABLE", payload: token }),
    []
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        tableToken: state.tableToken,
        totalItems,
        subtotal,
        addItem,
        removeItem,
        updateQty,
        updateInstructions,
        clearCart,
        setTable,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
