import React from 'react';

export default function ProductCard({ title, price, description, image, badge, stock, onBuy }) {
  const isOutOfStock = stock <= 0;

  return (
    <div className="product-card">
      <div className="card-image-wrapper">
        {badge && <span className="card-badge">{badge}</span>}
        <img src={image} alt={title} className="card-img" />
      </div>

      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>

        <div className="card-stock-info">
          {isOutOfStock ? (
            <span className="stock-tag out">❌ Всё раскупили</span>
          ) : (
            <span className="stock-tag in">📦 Осталось: {stock} шт.</span>
          )}
        </div>

        <div className="card-footer">
          <div className="card-price">{price} ₽</div>
          <button 
            onClick={onBuy} 
            disabled={isOutOfStock}
            className={`card-button ${isOutOfStock ? 'disabled' : ''}`}
          >
            {isOutOfStock ? 'Нет в наличии' : 'Забронировать 🎁'}
          </button>
        </div>
      </div>
    </div>
  );
}