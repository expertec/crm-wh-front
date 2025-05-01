// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MainLayout from "./components/MainLayout";
import AdminHome from "./pages/AdminHome";
import WhatsappConfig from "./components/WhatsappConfig";
import Secuencias from "./components/Secuencias";
import Leads from "./components/Leads";
import Automations from "./components/Automations";
import LandingPage from "./components/LandingPage";
import Chat from "./components/Chat";
import FormularioCancion from "./components/formularioCancion";
import WhatsappButton from "./components/whatsappButton";

// ProtectedRoute que acepta múltiples roles y espera a que useAuth cargue
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, userRole, loading } = useAuth();

  // Mientras carga el estado de autenticación y rol, no renderizar nada
  if (loading) return null;

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si el rol no está permitido, redirigir al login
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  // Caso contrario, renderizar la ruta protegida
  return children;
};

const App = () => (
  <Router>
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/lead" element={<LandingPage />} />

      {/* Formulario de canción público */}
      <Route path="/formulario-cancion" element={<FormularioCancion />} />

      {/* Botón público de WhatsApp */}
      <Route
        path="/whatsapp-button"
        element={
          <div style={{ padding: 20, textAlign: "center" }}>
            <WhatsappButton messageText="¡Hola! Ya llené el formulario, envíame mi letra 🎵" />
          </div>
        }
      />

      {/* Rutas de admin y superAdmin */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["admin", "superAdmin"]}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="whatsapp" element={<WhatsappConfig />} />
        <Route path="secuencias" element={<Secuencias />} />
        <Route path="leads" element={<Leads />} />
        <Route path="automations" element={<Automations />} />
        <Route path="chat" element={<Chat />} />
      </Route>

      {/* Ruta para cobrador */}
      <Route
        path="/cobrador"
        element={
          <ProtectedRoute allowedRoles={["Cobrador"]}>
            <div>Área de Cobrador</div>
          </ProtectedRoute>
        }
      />

      {/* Rutas públicas adicionales */}
      <Route path="/negocio/:businessId" element={<LandingPage />} />
      <Route path="/recibo" element={<LandingPage />} />

      {/* Redirecciones por defecto */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </Router>
);

export default App;
