import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../services/api";

const CartContext = createContext(null);

const STORAGE_KEY = "bitego_cart_v2";

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load cart from storage:", e);
    }
    return [];
  });

  const [activeRestaurant, setActiveRestaurant] = useState(() => {
    try {
      const saved = localStorage.getItem("bitego_restaurant_v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load restaurant from storage:", e);
    }
    return null;
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem("bitego_coupon_v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load coupon from storage:", e);
    }
    return null;
  });

  const [deliveryInstructions, setDeliveryInstructions] = useState("Leave at security desk");

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
      if (activeRestaurant) {
        localStorage.setItem("bitego_restaurant_v2", JSON.stringify(activeRestaurant));
      } else {
        localStorage.removeItem("bitego_restaurant_v2");
      }
      if (appliedCoupon) {
        localStorage.setItem("bitego_coupon_v2", JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem("bitego_coupon_v2");
      }
    } catch (e) {
      console.error("Failed to persist cart to storage:", e);
    }
  }, [cartItems, activeRestaurant, appliedCoupon]);

  // Load cart from MongoDB for logged-in user on mount
  useEffect(() => {
    const token = localStorage.getItem("bitego_token");
    if (!token) return;

    fetch(`${API_BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.cart && Array.isArray(data.cart.items) && data.cart.items.length > 0) {
          setCartItems(data.cart.items);
          if (data.cart.activeRestaurant) {
            setActiveRestaurant(data.cart.activeRestaurant);
          }
          if (data.cart.appliedCoupon) {
            setAppliedCoupon(data.cart.appliedCoupon);
          }
        }
      })
      .catch((err) => console.error("Error loading cart from backend:", err));
  }, []);

  // Sync cart to MongoDB when modified (debounced)
  useEffect(() => {
    const token = localStorage.getItem("bitego_token");
    if (!token) return;

    const timer = setTimeout(() => {
      fetch(`${API_BASE_URL}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cartItems,
          activeRestaurant,
          appliedCoupon,
        }),
      }).catch((err) => console.error("Failed to sync cart to backend:", err));
    }, 600);

    return () => clearTimeout(timer);
  }, [cartItems, activeRestaurant, appliedCoupon]);

  // Calculations
  const itemTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  const totalItemCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const deliveryFee = 0; // FREE with BiteGo Gold Pass / Promotion
  const taxesAndPackaging = useMemo(() => {
    return itemTotal > 0 ? Number((itemTotal * 0.05).toFixed(2)) : 0;
  }, [itemTotal]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || itemTotal === 0) return 0;
    if (appliedCoupon.discountType === "percentage") {
      const disc = (itemTotal * appliedCoupon.discountAmount) / 100;
      return Number(Math.min(disc, appliedCoupon.maxDiscount || disc).toFixed(2));
    }
    return Number(Math.min(appliedCoupon.discountAmount, itemTotal).toFixed(2));
  }, [appliedCoupon, itemTotal]);

  const finalTotal = useMemo(() => {
    return Math.max(0, Number((itemTotal + taxesAndPackaging + deliveryFee - couponDiscount).toFixed(2)));
  }, [itemTotal, taxesAndPackaging, deliveryFee, couponDiscount]);

  // Add Item to Cart (flexible arguments)
  const addToCart = (dish, arg2 = [], arg3 = 1, arg4 = null) => {
    if (!dish) return;

    let customizations = [];
    let quantity = 1;
    let restaurantInfo = null;

    // Support both (dish, customizations, quantity, restaurantInfo)
    // and (dish, quantity, customizations/null, restaurantInfo)
    if (Array.isArray(arg2)) {
      customizations = arg2;
      quantity = typeof arg3 === "number" ? Math.max(1, arg3) : 1;
      restaurantInfo = arg4;
    } else if (typeof arg2 === "number") {
      quantity = Math.max(1, arg2);
      if (Array.isArray(arg3)) {
        customizations = arg3;
      }
      restaurantInfo = arg4;
    } else if (typeof arg2 === "object" && arg2 !== null) {
      if (Array.isArray(arg2.customizations)) customizations = arg2.customizations;
      if (typeof arg2.quantity === "number") quantity = Math.max(1, arg2.quantity);
      restaurantInfo = arg3 || arg2.restaurantInfo;
    }

    const dishId = dish._id || dish.id;
    const targetRestId =
      restaurantInfo?.id ||
      restaurantInfo?._id ||
      dish.restaurantId ||
      dish.restaurant?._id ||
      dish.restaurant?.id ||
      (typeof dish.restaurant === "string" && dish.restaurant.match(/^[0-9a-fA-F]{24}$/) ? dish.restaurant : null);

    const targetRestName =
      restaurantInfo?.name ||
      (typeof dish.restaurant === "string" ? dish.restaurant : dish.restaurant?.name) ||
      dish.restaurantName ||
      "BiteGo Partner Restaurant";

    // Cross-restaurant check: If cart contains items from another restaurant, confirm before replacing
    if (
      cartItems.length > 0 &&
      activeRestaurant &&
      targetRestId &&
      activeRestaurant.id &&
      activeRestaurant.id.toString() !== targetRestId.toString()
    ) {
      const confirmReset = window.confirm(
        `Your cart contains items from "${activeRestaurant.name}". Would you like to clear your cart and start a new order from "${targetRestName}"?`
      );
      if (!confirmReset) {
        return false;
      }
      // Clear previous restaurant items
      setCartItems([]);
      setAppliedCoupon(null);
    }

    // Generate unique key based on dish id + customizations
    const custKey = Array.isArray(customizations) && customizations.length > 0
      ? customizations
          .map((c) => `${c.group || "opt"}:${c.name}:${c.price || 0}`)
          .sort()
          .join("|")
      : "plain";

    const cartItemId = `${dishId}_${custKey}`;

    // Customization extra price sum
    const extraPrice = Array.isArray(customizations)
      ? customizations.reduce((sum, c) => sum + (Number(c.price) || 0), 0)
      : 0;
    const unitPrice = (Number(dish.price) || 0) + extraPrice;

    const customizationText = Array.isArray(customizations) && customizations.length > 0
      ? customizations.map((c) => c.name).join(", ")
      : "";

    setActiveRestaurant({ id: targetRestId, name: targetRestName });

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.cartItemId === cartItemId || (item.id === dishId && !customizations.length && (!item.customizations || !item.customizations.length))
      );
      if (existingIndex > -1) {
        return prevItems.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prevItems,
        {
          cartItemId,
          id: dishId,
          menuItemId: dishId,
          name: dish.name,
          restaurant: targetRestName,
          restaurantId: targetRestId,
          price: unitPrice,
          basePrice: Number(dish.price) || 0,
          quantity,
          image: dish.image,
          isVeg: dish.isVeg !== undefined ? dish.isVeg : dish.type === "Veg",
          customizations,
          customizationText,
        },
      ];
    });

    setIsCartOpen(true);
    return true;
  };

  // Update Item Quantity
  const updateQuantity = (cartItemId, delta) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.cartItemId === cartItemId || item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Remove Item
  const removeItem = (cartItemId) => {
    setCartItems((prevItems) => {
      const next = prevItems.filter((item) => item.cartItemId !== cartItemId && item.id !== cartItemId);
      if (next.length === 0) {
        setActiveRestaurant(null);
        setAppliedCoupon(null);
      }
      return next;
    });
  };

  // Clear Cart
  const clearCart = () => {
    setCartItems([]);
    setActiveRestaurant(null);
    setAppliedCoupon(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("bitego_restaurant_v2");
    localStorage.removeItem("bitego_coupon_v2");

    const token = localStorage.getItem("bitego_token");
    if (token) {
      fetch(`${API_BASE_URL}/cart`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch((err) => console.error("Error clearing backend cart:", err));
    }
  };

  // Apply Coupon via backend validation
  const applyCoupon = async (code) => {
    try {
      const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, cartTotal: itemTotal }),
      });
      const data = await res.json();
      if (data.success && data.coupon) {
        setAppliedCoupon(data.coupon);
        return { success: true, message: data.message, coupon: data.coupon };
      }
      return { success: false, message: data.message || "Invalid coupon" };
    } catch (err) {
      // Fallback local promo validation if network fails
      if (code.toUpperCase() === "BITEGO50" && itemTotal >= 200) {
        const c = { code: "BITEGO50", discountType: "fixed", discountAmount: 100, description: "Flat ₹100 OFF" };
        setAppliedCoupon(c);
        return { success: true, message: "Coupon applied!", coupon: c };
      }
      return { success: false, message: "Failed to validate coupon" };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem("bitego_coupon_v2");
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        items: cartItems,
        activeRestaurant,
        restaurant: activeRestaurant,
        setActiveRestaurant,
        isCartOpen,
        setIsCartOpen,
        appliedCoupon,
        coupon: appliedCoupon,
        applyCoupon,
        removeCoupon,
        addToCart,
        updateQuantity,
        removeItem,
        removeFromCart: removeItem,
        clearCart,
        itemTotal,
        subtotal: itemTotal,
        totalItemCount,
        deliveryFee,
        taxesAndPackaging,
        couponDiscount,
        finalTotal,
        total: finalTotal,
        deliveryInstructions,
        setDeliveryInstructions,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

const defaultCartContext = {
  cartItems: [],
  items: [],
  activeRestaurant: null,
  isCartOpen: false,
  appliedCoupon: null,
  totalItemCount: 0,
  itemTotal: 0,
  subtotal: 0,
  deliveryFee: 0,
  taxesAndPackaging: 0,
  couponDiscount: 0,
  finalTotal: 0,
  total: 0,
  deliveryInstructions: "",
  setDeliveryInstructions: () => {},
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  setIsCartOpen: () => {},
  applyCoupon: async () => ({ success: false }),
  removeCoupon: () => {},
};

export function useCart() {
  const context = useContext(CartContext);
  return context || defaultCartContext;
}
