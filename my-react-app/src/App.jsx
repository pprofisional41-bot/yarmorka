import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CatalogPage from './pages/CatalogPage';
import CartPage from './pages/CartPage';
import Loader from './components/Loader';

import './styles/global.css';
import './styles/catalog.css';
import './styles/cart.css';
import './styles/fair-guide.css';
import './styles/product-card.css';
import './styles/loader.css';

const IMG_CAT = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%231f2430'/%3E%3Ccircle cx='300' cy='180' r='90' fill='%23f59e0b' opacity='0.2'/%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-size='90'%3E🧺%3C/text%3E%3Ctext x='50%25' y='75%25' dominant-baseline='middle' text-anchor='middle' fill='%23f59e0b' font-family='sans-serif' font-weight='bold' font-size='22'%3EЭко-лежанка из лозы%3C/text%3E%3C/svg%3E";
const IMG_MUG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%231f2430'/%3E%3Ccircle cx='300' cy='180' r='90' fill='%23f59e0b' opacity='0.2'/%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-size='90'%3E🍺%3C/text%3E%3Ctext x='50%25' y='75%25' dominant-baseline='middle' text-anchor='middle' fill='%23f59e0b' font-family='sans-serif' font-weight='bold' font-size='22'%3EКружка из березы%3C/text%3E%3C/svg%3E";
const IMG_CANDLE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%231f2430'/%3E%3Ccircle cx='300' cy='180' r='90' fill='%23f59e0b' opacity='0.2'/%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-size='90'%3E🕯️%3C/text%3E%3Ctext x='50%25' y='75%25' dominant-baseline='middle' text-anchor='middle' fill='%23f59e0b' font-family='sans-serif' font-weight='bold' font-size='22'%3EСвеча с травами%3C/text%3E%3C/svg%3E";
const IMG_SWEATER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%231f2430'/%3E%3Ccircle cx='300' cy='180' r='90' fill='%23f59e0b' opacity='0.2'/%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-size='90'%3E🧶%3C/text%3E%3Ctext x='50%25' y='75%25' dominant-baseline='middle' text-anchor='middle' fill='%23f59e0b' font-family='sans-serif' font-weight='bold' font-size='22'%3EВязаный свитер%3C/text%3E%3C/svg%3E";

const PRODUCT_IMAGES = {
  1: IMG_CAT,
  2: IMG_MUG,
  3: IMG_CANDLE,
  4: IMG_SWEATER
};

const API_URL = '/api';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('fair_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [completedOrder, setCompletedOrder] = useState(() => {
    const saved = localStorage.getItem('fair_active_order');
    return saved ? JSON.parse(saved) : null;
  });

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products?t=${Date.now()}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        const productsWithImages = data.map(item => ({
          ...item,
          image: PRODUCT_IMAGES[item.id] || IMG_CAT
        }));
        setProducts(productsWithImages);
      }
    } catch (error) {
      console.error('Ошибка подключения к FastAPI:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem('fair_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (completedOrder) {
      localStorage.setItem('fair_active_order', JSON.stringify(completedOrder));
    } else {
      localStorage.removeItem('fair_active_order');
    }
  }, [completedOrder]);

  // Авто-опрос и авто-закрытие брони УБРАНЫ.
  // Бронь снимается только кнопкой «Отмена брони».

  const displayedProducts = products.map(p => {
    const cartItem = cart.find(c => c.id === p.id);
    const inCartCount = cartItem ? cartItem.quantity : 0;
    return {
      ...p,
      stock: p.stock - inCartCount
    };
  });

  const handleAddToCart = (product) => {
    const realProduct = products.find(p => p.id === product.id);
    const cartItem = cart.find(item => item.id === product.id);
    const inCartCount = cartItem ? cartItem.quantity : 0;

    if (!realProduct || realProduct.stock - inCartCount <= 0) return;

    if (cartItem) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handleIncrease = (id) => {
    const realProduct = products.find(p => p.id === id);
    const cartItem = cart.find(c => c.id === id);
    if (!realProduct || !cartItem || cartItem.quantity >= realProduct.stock) return;

    setCart(cart.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  };

  const handleDecrease = (id) => {
    const cartItem = cart.find(item => item.id === id);
    if (!cartItem) return;
    if (cartItem.quantity > 1) {
      setCart(cart.map(item => item.id === id ? { ...item, quantity: item.quantity - 1 } : item));
    } else {
      setCart(cart.filter(item => item.id !== id));
    }
  };

  const handleRemove = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleCheckout = async (userInfo) => {
    if (completedOrder) {
      alert('У вас уже есть активный заказ! Завершите или отмените его перед оформлением нового.');
      return;
    }

    try {
      const payload = {
        user: userInfo,
        items: cart.map(item => ({ id: item.id, quantity: item.quantity }))
      };

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Не удалось забронировать товар');
        return;
      }

      const orderData = await response.json();
      const formattedOrder = {
        ...orderData,
        rawId: orderData.id,
        expiresAt: orderData.expires_at * 1000
      };

      setCompletedOrder(formattedOrder);
      setCart([]);
      fetchProducts();
    } catch (error) {
      console.error('Ошибка создания заказа:', error);
      alert('Ошибка соединения с сервером!');
    }
  };

  const handleCancelOrder = async () => {
    if (!completedOrder) return;

    const orderId = completedOrder.rawId || completedOrder.id;

    try {
      const response = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('Заказ отменен, бронь снята');
      } else {
        alert('Не удалось отменить заказ');
      }
    } catch (error) {
      console.error('Ошибка отмены брони:', error);
      alert('Ошибка соединения с сервером');
    } finally {
      setCompletedOrder(null);
      fetchProducts();
    }
  };

  if (loading) return <Loader />;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<CatalogPage products={displayedProducts} cart={cart} onAddToCart={handleAddToCart} />}
        />
        <Route
          path="/cart"
          element={
            <CartPage
              cart={cart}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              onRemove={handleRemove}
              onCheckout={handleCheckout}
              activeOrder={completedOrder}
              onCancelOrder={handleCancelOrder}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}