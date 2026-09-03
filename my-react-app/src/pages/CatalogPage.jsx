import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import FairGuide from '../components/FairGuide';

export default function CatalogPage({ products, cart, onAddToCart }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(item => item.category === selectedCategory);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="container page-transition">
      <header className="catalog-header">
        <span className="badge-main">Ждем всех на нашей ярмарке! 🎉</span>
        
        <h1 className="catalog-title">Крафтовая Ярмарка Чудес</h1>
        
        <p className="catalog-subtitle">
          Всё сделано своими руками с душой. Выбирай, бронируй на сайте и забирай лично у мастеров.
        </p>

        <Link to="/cart" className="btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
          🛒 Перейти к моей брони ({totalCartCount})
        </Link>

        {/* Дополнительные плашки для наполнения пространства */}
        <div className="header-features">
          <span className="feature-tag">📍 Меленки, ул. Будкина</span>
          <span className="feature-tag">🪵 100% Ручная работа</span>
          <span className="feature-tag">🤝 Оплата при получении</span>
        </div>
      </header>

      <div className="catalog-filters">
        <button 
          onClick={() => setSelectedCategory('all')} 
          className={`btn-primary filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
        >
          Все подряд ✨
        </button>
        <button 
          onClick={() => setSelectedCategory('home')} 
          className={`btn-primary filter-btn ${selectedCategory === 'home' ? 'active' : ''}`}
        >
          Для дома и уюта 🏡
        </button>
        <button 
          onClick={() => setSelectedCategory('craft')} 
          className={`btn-primary filter-btn ${selectedCategory === 'craft' ? 'active' : ''}`}
        >
          Крафт и дерево 🪵
        </button>
        <button 
          onClick={() => setSelectedCategory('clothes')} 
          className={`btn-primary filter-btn ${selectedCategory === 'clothes' ? 'active' : ''}`}
        >
          Шмотки и тепло 🧶
        </button>
      </div>

      <div className="grid">
        {filteredProducts.map(product => (
          <ProductCard 
            key={product.id}
            {...product}
            onBuy={() => onAddToCart(product)}
          />
        ))}
      </div>

      <FairGuide />
    </div>
  );
}