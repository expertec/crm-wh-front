// src/pages/LoginPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/logo.png";
import { Card, Form, Input, Button, Alert } from "antd";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const onFinish = async (values) => {
    setError("");
    try {
      const role = await login(values.email, values.password);

      if (role === "admin" || role === "superAdmin") {
        navigate("/admin", { replace: true });
      } else if (role === "Cobrador") {
        navigate("/cobrador", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError("Credenciales inválidas. Intenta nuevamente.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(to top, var(--color-primary), white)",
      }}
    >
      <Card
        style={{ width: 400, borderRadius: 8 }}
        bodyStyle={{ padding: "24px" }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <img src={logo} alt="Logo" style={{ width: 80, height: 80, objectFit: "contain" }} />
        </div>
        <h2 style={{ textAlign: "center", marginBottom: 24, color: "#083416" }}>
          Iniciar Sesión
        </h2>
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Correo Electrónico"
            name="email"
            rules={[
              { required: true, message: "Ingresa tu correo electrónico" },
              { type: "email", message: "Correo electrónico inválido" },
            ]}
          >
            <Input placeholder="Ingresa tu correo electrónico" />
          </Form.Item>
          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ required: true, message: "Ingresa tu contraseña" }]}
          >
            <Input.Password placeholder="Ingresa tu contraseña" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Iniciar Sesión
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
