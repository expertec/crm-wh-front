import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button, Input, Card, Typography, Space, message } from "antd";

const { Title, Paragraph } = Typography;
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
console.log("API URL:", API_URL);

const WhatsappConfig = () => {
  const [connectionStatus, setConnectionStatus] = useState("");
  const [qr, setQR] = useState(null);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");

  // Función para iniciar la conexión con WhatsApp
  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/connect`);
      const data = await response.json();
      setConnectionStatus(data.message);
    } catch (error) {
      console.error("Error al conectar:", error);
      setConnectionStatus("Error al conectar con WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  // Función para consultar el estado (QR y conexión)
  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/status`);
      const data = await response.json();
      setConnectionStatus(data.status);
      setQR(data.qr);
    } catch (error) {
      console.error("Error al obtener el estado:", error);
    }
  };

  // Consulta periódica cada 3 segundos para actualizar el estado y el QR
  useEffect(() => {
    const intervalId = setInterval(fetchStatus, 3000);
    return () => clearInterval(intervalId);
  }, []);

  // Funciones para testear el envío de mensajes
  const handleTestText = async () => {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/send/text?phone=${phone}`);
      const data = await response.json();
      console.log("Test texto:", data);
      message.success("Mensaje de texto enviado");
    } catch (error) {
      console.error("Error enviando mensaje de texto:", error);
      message.error("Error enviando mensaje de texto");
    }
  };

  const handleTestImage = async () => {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/send/image?phone=${phone}`);
      const data = await response.json();
      console.log("Test imagen:", data);
      message.success("Mensaje de imagen enviado");
    } catch (error) {
      console.error("Error enviando mensaje de imagen:", error);
      message.error("Error enviando mensaje de imagen");
    }
  };

  const handleTestAudio = async () => {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/send/audio?phone=${phone}`);
      const data = await response.json();
      console.log("Test audio:", data);
      message.success("Mensaje de audio enviado");
    } catch (error) {
      console.error("Error enviando mensaje de audio:", error);
      message.error("Error enviando mensaje de audio");
    }
  };

  return (
    <Card style={{ padding: 24, maxWidth: 600, margin: "auto" }}>
      <Title level={2}>Configuración de Whatsapp</Title>
      <Paragraph>Estado de conexión: {connectionStatus}</Paragraph>

      {qr && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Paragraph>Escanea el siguiente QR:</Paragraph>
          <QRCodeCanvas value={qr} size={256} />
        </div>
      )}

      <Space direction="vertical" style={{ width: "100%", marginTop: 16 }}>
        <Button 
          onClick={handleConnect} 
          type="primary" 
          block 
          loading={loading}
        >
          {loading ? "Conectando..." : "Conectar a Whatsapp"}
        </Button>

        <Title level={4} style={{ marginTop: 24 }}>
          Enviar Mensajes de Prueba
        </Title>
        <Input 
          placeholder="Ingrese número de teléfono" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Space direction="vertical" style={{ width: "100%" }}>
          <Button onClick={handleTestText} block type="primary" style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}>
            Testear mensaje de texto
          </Button>
          <Button onClick={handleTestImage} block type="primary" style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}>
            Testear mensaje de imagen
          </Button>
          <Button onClick={handleTestAudio} block type="primary" style={{ backgroundColor: "#722ed1", borderColor: "#722ed1" }}>
            Testear mensaje de audio
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

export default WhatsappConfig;
