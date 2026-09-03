import React from 'react';

export default function Loader() {
  return (
    <div className="loader-screen">
      <div className="spinner"></div>
      <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
        Заряжаем ярмарку чудес... 🔥
      </h2>
      <p style={{ color: '#9ca3af', marginTop: '0.5rem', fontSize: '0.95rem' }}>
        Готовим лучшие товары с улицы Будкина специально для вас
      </p>
    </div>
  );
}