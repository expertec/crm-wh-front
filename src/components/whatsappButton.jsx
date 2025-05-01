import React, { useState, useEffect } from 'react';
import { Button, Spin, Alert } from 'antd';
import { WhatsAppOutlined } from '@ant-design/icons';

export default function WhatsappButton() {
  const [phone, setPhone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/whatsapp/number')
      .then(async res => {
        const data = await res.json();
        if (res.ok) {
          setPhone(data.phone);
        } else {
          setError(data.error || 'WhatsApp no conectado');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Spin tip="Cargando..." />;
  }
  if (error) {
    return <Alert message={error} type="error" />;
  }

  // Texto que se prellenará en el chat
  const text = 'Hola, ya llené el formulario para que puedan enviarme mi letra de canción';
  const url = `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <Button type="primary" icon={<WhatsAppOutlined />} size="large">
        Envíame mi canción 🎵
      </Button>
    </a>
  );
}
