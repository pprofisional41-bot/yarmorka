import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/cart.css';

// Компонент живого таймера на 30 минут
function OrderTimer({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      const remaining = Math.floor((expiresAt - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(timer);
        setTimeLeft(0);
        onExpire();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="timer-badge">
      ⏳ Осталось времени на забор: 
      <span className="timer-clock">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

export default function CartPage({ cart, onIncrease, onDecrease, onRemove, onCheckout, activeOrder, onCancelOrder }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Пожалуйста, введите имя и телефон!');
      return;
    }
    
    // Просто передаем имя и телефон в handleCheckout
    onCheckout({ name, phone });
  };

  // ЭКРАН ТАЛОНА С ТАЙМЕРОМ
  if (activeOrder) {
    return (
      <div className="container cart-container page-transition">
        <div className="ticket-box">
          <div className="ticket-badge">🔥 Товар забронирован на 30 минут</div>
          
          {/* НАШ ТАЙМЕР */}
          <OrderTimer expiresAt={activeOrder.expiresAt} onExpire={onCancelOrder} />

          <h2>Талон на получение № {activeOrder.id}</h2>

          <div className="ticket-details">
            <p><strong>Покупатель:</strong> {activeOrder.user.name}</p>
            <p><strong>Телефон:</strong> {activeOrder.user.phone}</p>
            <p><strong>К оплате на месте:</strong> <span className="highlight">{activeOrder.total} ₽</span></p>
          </div>

          <div className="ticket-items">
            <h4>Отложено для вас:</h4>
            <ul>
              {activeOrder.items.map(item => (
                <li key={item.id}>{item.title} — {item.quantity} шт.</li>
              ))}
            </ul>
          </div>

          <div className="ticket-info-alert">
            📍 <strong>Адрес выдачи:</strong> г. Меленки, ул. Будкина.<br/>
            Покажите этот экран мастеру при получении. Если не заберете за 30 минут, бронь сгорит!
          </div>

          <div className="ticket-actions">
            <Link to="/" className="btn-primary">← На главную</Link>
            <button onClick={onCancelOrder} className="btn-secondary">Отменить бронь</button>
          </div>
        </div>
      </div>
    );
  }

  // Обычный экран корзины
  return (
    <div className="container cart-container page-transition">
      <div className="cart-header">
        <h1>Бронирование товаров 🛒</h1>
        <Link to="/" className="btn-primary">← К ярмарке</Link>
      </div>

      {cart.length === 0 ? (
        <div className="cart-box empty">
          <p>В вашей корзине пусто.</p>
          <Link to="/" className="btn-primary" style={{ marginTop: '1rem' }}>Выбрать товары</Link>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="cart-items-list">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <img src={item.image} alt={item.title} className="cart-item-img" />
                  <div>
                    <h4 style={{ margin: 0, color: '#fff' }}>{item.title}</h4>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>{item.price} ₽</span>
                  </div>
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button onClick={() => onDecrease(item.id)} className="quantity-btn">-</button>
                    <span style={{ padding: '0 0.8rem', fontWeight: 700 }}>{item.quantity}</span>
                    <button onClick={() => onIncrease(item.id)} className="quantity-btn">+</button>
                  </div>
                  <button onClick={() => onRemove(item.id)} className="btn-remove">Удалить всё</button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="checkout-form">
            <h3>3️⃣ Заполните данные для брони</h3>
            <p className="form-sub">Товар забронируется за вами на 30 минут.</p>
            
            <div className="form-group">
              <label>Ваше имя</label>
              <input type="text" placeholder="Иван" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Номер телефона</label>
              <input type="tel" placeholder="+7 (900) 000-00-00" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>

            <div className="checkout-total">
              <span>Итого к оплате:</span>
              <span className="total-num">{totalPrice} ₽</span>
            </div>

            <button type="submit" className="btn-primary submit-btn">
              Забронировать на 30 мин ⏱️
            </button>
          </form>
        </div>
      )}
    </div>
  );
}