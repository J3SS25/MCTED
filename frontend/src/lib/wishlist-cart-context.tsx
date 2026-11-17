import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Tool } from '@mcteb/shared';
import { useAuth } from './auth-context';

export interface WishlistItem {
  tool: Tool;
  addedAt: string;
}

export interface CartItem {
  tool: Tool;
  quantity: number;
  addedAt: string;
}

interface WishlistCartContextType {
  wishlist: WishlistItem[];
  cart: CartItem[];
  isInWishlist: (toolId: string) => boolean;
  isInCart: (toolId: string) => boolean;
  addToWishlist: (tool: Tool) => void;
  removeFromWishlist: (toolId: string) => void;
  toggleWishlist: (tool: Tool) => boolean;
  moveWishlistItemToCart: (toolId: string, quantity?: number) => void;
  moveAllWishlistToCart: () => void;
  clearWishlist: () => void;
  addToCart: (tool: Tool, quantity?: number) => void;
  updateCartQuantity: (toolId: string, quantity: number) => void;
  removeFromCart: (toolId: string) => void;
  clearCart: () => void;
  cartTotalItems: number;
}

const WishlistCartContext = createContext<WishlistCartContextType | undefined>(undefined);

function readStorageArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeStorageArray<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.error(`Failed to persist ${key}`, err);
  }
}

export function WishlistCartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const scopeKey = user?.id || 'guest';
  const wishlistKey = `mcteb_wishlist_${scopeKey}`;
  const cartKey = `mcteb_cart_${scopeKey}`;

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() =>
    readStorageArray<WishlistItem>(wishlistKey),
  );
  const [cart, setCart] = useState<CartItem[]>(() => readStorageArray<CartItem>(cartKey));

  // Reload scoped wishlist and cart when user changes
  useEffect(() => {
    setWishlist(readStorageArray<WishlistItem>(wishlistKey));
    setCart(readStorageArray<CartItem>(cartKey));
  }, [wishlistKey, cartKey]);

  const persistWishlist = useCallback(
    (updater: (prev: WishlistItem[]) => WishlistItem[]) => {
      setWishlist((prev) => {
        const next = updater(prev);
        writeStorageArray(wishlistKey, next);
        return next;
      });
    },
    [wishlistKey],
  );

  const persistCart = useCallback(
    (updater: (prev: CartItem[]) => CartItem[]) => {
      setCart((prev) => {
        const next = updater(prev);
        writeStorageArray(cartKey, next);
        return next;
      });
    },
    [cartKey],
  );

  const isInWishlist = useCallback(
    (toolId: string) => wishlist.some((item) => item.tool.id === toolId),
    [wishlist],
  );

  const isInCart = useCallback(
    (toolId: string) => cart.some((item) => item.tool.id === toolId),
    [cart],
  );

  const addToWishlist = useCallback(
    (tool: Tool) => {
      persistWishlist((prev) => {
        if (prev.some((i) => i.tool.id === tool.id)) return prev;
        return [{ tool, addedAt: new Date().toISOString() }, ...prev];
      });
    },
    [persistWishlist],
  );

  const removeFromWishlist = useCallback(
    (toolId: string) => {
      persistWishlist((prev) => prev.filter((i) => i.tool.id !== toolId));
    },
    [persistWishlist],
  );

  const toggleWishlist = useCallback(
    (tool: Tool): boolean => {
      const exists = wishlist.some((i) => i.tool.id === tool.id);
      if (exists) {
        removeFromWishlist(tool.id);
        return false;
      }
      addToWishlist(tool);
      return true;
    },
    [wishlist, addToWishlist, removeFromWishlist],
  );

  const addToCart = useCallback(
    (tool: Tool, quantity = 1) => {
      const maxUnits = Math.max(1, tool.available_quantity || tool.total_quantity || 1);
      persistCart((prev) => {
        const existing = prev.find((i) => i.tool.id === tool.id);
        if (existing) {
          return prev.map((i) =>
            i.tool.id === tool.id
              ? { ...i, tool, quantity: Math.min(maxUnits, i.quantity + quantity) }
              : i,
          );
        }
        return [
          ...prev,
          {
            tool,
            quantity: Math.min(maxUnits, Math.max(1, quantity)),
            addedAt: new Date().toISOString(),
          },
        ];
      });
    },
    [persistCart],
  );

  const updateCartQuantity = useCallback(
    (toolId: string, quantity: number) => {
      if (quantity <= 0) {
        persistCart((prev) => prev.filter((i) => i.tool.id !== toolId));
        return;
      }
      persistCart((prev) =>
        prev.map((i) => {
          if (i.tool.id !== toolId) return i;
          const maxUnits = Math.max(1, i.tool.available_quantity || i.tool.total_quantity || 1);
          return { ...i, quantity: Math.min(maxUnits, quantity) };
        }),
      );
    },
    [persistCart],
  );

  const removeFromCart = useCallback(
    (toolId: string) => {
      persistCart((prev) => prev.filter((i) => i.tool.id !== toolId));
    },
    [persistCart],
  );

  const clearCart = useCallback(() => {
    persistCart(() => []);
  }, [persistCart]);

  const clearWishlist = useCallback(() => {
    persistWishlist(() => []);
  }, [persistWishlist]);

  const moveWishlistItemToCart = useCallback(
    (toolId: string, quantity = 1) => {
      const target = wishlist.find((i) => i.tool.id === toolId);
      if (!target) return;
      addToCart(target.tool, quantity);
      removeFromWishlist(toolId);
    },
    [wishlist, addToCart, removeFromWishlist],
  );

  const moveAllWishlistToCart = useCallback(() => {
    const movable = wishlist.filter(
      (w) => w.tool.availability_status === 'Available' && w.tool.available_quantity > 0,
    );
    if (movable.length === 0) return;

    movable.forEach((w) => addToCart(w.tool, 1));
    const movableIds = new Set(movable.map((w) => w.tool.id));
    persistWishlist((prev) => prev.filter((w) => !movableIds.has(w.tool.id)));
  }, [wishlist, addToCart, persistWishlist]);

  const cartTotalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  return (
    <WishlistCartContext.Provider
      value={{
        wishlist,
        cart,
        isInWishlist,
        isInCart,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        moveWishlistItemToCart,
        moveAllWishlistToCart,
        clearWishlist,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartTotalItems,
      }}
    >
      {children}
    </WishlistCartContext.Provider>
  );
}

export function useWishlistCart() {
  const ctx = useContext(WishlistCartContext);
  if (!ctx) {
    throw new Error('useWishlistCart must be used within a WishlistCartProvider');
  }
  return ctx;
}
