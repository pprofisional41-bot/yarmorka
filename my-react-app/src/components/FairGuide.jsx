import React from 'react';

export default function FairGuide() {
  return (
    <section style={{ margin: '4rem 0', background: '#181b22', padding: '2.5rem', borderRadius: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="badge-main">Локация 📍</span>
        <h2 style={{ fontSize: '2rem', color: '#ffffff', marginTop: '0.5rem' }}>Где и как нас найти?</h2>
        <p style={{ color: '#9ca3af' }}>Встречаемся в самом сердце Меленок на улице Будкина! Мимо точно не пройдете.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        
        <div style={{ background: '#212631', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: '#fbbf24', fontSize: '1.2rem', marginBottom: '0.5rem' }}>🗺️ Точный адрес</h3>
          <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Исторический район Меленки, <b>улица Будкина</b> (ориентир — возле школы и зеленой зоны). Ждем вас!
          </p>
        </div>

        <div style={{ background: '#212631', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: '#fbbf24', fontSize: '1.2rem', marginBottom: '0.5rem' }}>🚗 Как добраться</h3>
          <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: '1.5' }}>
            На машине, самокате или пешком по ул. Будкина. Главное помните правило у школы: <i>«Веди машину так, будто дети твои рядом»</i>! 🛑
          </p>
        </div>

        <div style={{ background: '#212631', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: '#fbbf24', fontSize: '1.2rem', marginBottom: '0.5rem' }}>🎒 Что захватить</h3>
          <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Наличные для мастеров, шоппер для покупок и отличное настроение. Оплаты онлайн нет, всё на месте! ✨
          </p>
        </div>

      </div>
    </section>
  );
}