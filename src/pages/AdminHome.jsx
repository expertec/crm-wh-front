// src/pages/AdminHome.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { useAuth } from '../hooks/useAuth';
import crmHome from '../assets/crmHome.png';

export default function AdminHome() {
  const { user } = useAuth();
  const rawName = user.displayName || user.email || '';
  const firstName = rawName.split(' ')[0];
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: '#08044c',
        borderRadius: 8,
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '16px',
        height: 240,
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '60%' }}>
        <h1 style={{ color: '#fff', fontSize: '2.5rem', marginBottom: 16 }}>
          Bienvenido {firstName}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.25rem', marginBottom: 24 }}>
          🔥 Asigna, chatea y convierte: tu éxito en ventas empieza aquí.
        </p>
        <Button
          type="primary"
          size="large"
          style={{ fontSize: '1.25rem', padding: '0 24px', height: '48px' }}
          onClick={() => navigate('/admin/leads')}
        >
          Ir a vender
        </Button>
      </div>
      <div style={{ maxWidth: '35%', overflow: 'hidden' }}>
        <img
          src={crmHome}
          alt="CRM Home"
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: 8,
            display: 'block',
            WebkitMaskImage: 'radial-gradient(circle at center, black 60%, transparent 100%)',
            maskImage: 'radial-gradient(circle at center, black 60%, transparent 100%)',
          }}
        />
      </div>
    </div>
  );
}
