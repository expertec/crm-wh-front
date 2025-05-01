// src/components/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Tooltip, Badge } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  WhatsAppOutlined,
  SettingOutlined,
  UsergroupAddOutlined,
  ExperimentOutlined,
  PoweroffOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { getAuth, signOut } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png';

const { Sider, Content } = Layout;

export default function MainLayout() {
  const navigate = useNavigate();
  const auth = getAuth();
  const { userRole } = useAuth();
  const [waStatus, setWaStatus] = useState('');

  const isSuperAdmin = userRole === 'superAdmin';

  // Polling WhatsApp status cada 10s
  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/whatsapp/status`);
        const { status } = await res.json();
        if (mounted) setWaStatus(status);
      } catch {
        if (mounted) setWaStatus('');
      }
    };
    fetchStatus();
    const id = setInterval(fetchStatus, 10000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login', { replace: true });
  };

  // Define ítems, marcando los que solo ve superAdmin
  const menuItems = [
    {
      key: 'admin',
      superAdminOnly: true,
      icon: (
        <Tooltip placement="right" title="Dashboard">
          <HomeOutlined style={{ fontSize: 20 }} />
        </Tooltip>
      ),
      onClick: () => navigate('/admin'),
    },
    {
      key: 'whatsapp',
      superAdminOnly: true,
      icon: (
        <Tooltip placement="right" title="WhatsApp">
          <Badge
            dot
            status={waStatus === 'Conectado' ? 'success' : 'error'}
            offset={[0, 0]}
          >
            <WhatsAppOutlined style={{ fontSize: 20 }} />
          </Badge>
        </Tooltip>
      ),
      onClick: () => navigate('/admin/whatsapp'),
    },
    {
      key: 'secuencias',
      superAdminOnly: true,
      icon: (
        <Tooltip placement="right" title="Secuencias">
          <SettingOutlined style={{ fontSize: 20 }} />
        </Tooltip>
      ),
      onClick: () => navigate('/admin/secuencias'),
    },
    {
      key: 'leads',
      superAdminOnly: false,
      icon: (
        <Tooltip placement="right" title="Leads">
          <UsergroupAddOutlined style={{ fontSize: 20 }} />
        </Tooltip>
      ),
      onClick: () => navigate('/admin/leads'),
    },
    {
      key: 'automations',
      superAdminOnly: true,
      icon: (
        <Tooltip placement="right" title="Automatizaciones">
          <ExperimentOutlined style={{ fontSize: 20 }} />
        </Tooltip>
      ),
      onClick: () => navigate('/admin/automations'),
    },
    {
      key: 'chat',
      superAdminOnly: false,
      icon: (
        <Tooltip placement="right" title="Chat">
          <MessageOutlined style={{ fontSize: 20 }} />
        </Tooltip>
      ),
      onClick: () => navigate('/admin/chat'),
    },
  ];

  // Filtra según rol
  const visibleItems = menuItems
    .filter(item => !item.superAdminOnly || isSuperAdmin)
    .map(item => ({ ...item, label: '' }));

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={80}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          background: 'linear-gradient(to top, #70c2ff, #1890ff)',
          boxShadow: '2px 0 6px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 16,
          overflow: 'hidden',
          zIndex: 1000,
        }}
      >
        {/* Logo */}
        <div style={{ width: '100%', padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
          <Link to="/admin">
            <img src={logo} alt="Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          </Link>
        </div>

        {/* Menú */}
        <Menu
          mode="inline"
          style={{
            background: 'transparent',
            borderRight: 0,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
          }}
          items={visibleItems}
          className="custom-sider-menu"
        />

        {/* Logout */}
        <div style={{ position: 'absolute', bottom: 16, left: 0, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div
            onClick={handleLogout}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Cerrar sesión"
          >
            <PoweroffOutlined style={{ fontSize: 22, color: '#1890ff' }} />
          </div>
        </div>
      </Sider>

      {/* Contenido principal desplazado */}
      <Layout style={{ marginLeft: 80, minHeight: '100vh' }}>
        <Content style={{ padding: 0, height: '100%', boxSizing: 'border-box', overflow: 'visible' }}>
          {waStatus !== 'Conectado' && (
            <div style={{ backgroundColor: '#f5222d', color: '#fff', textAlign: 'center', padding: '8px', fontWeight: 'bold' }}>
              Sesión de WhatsApp cerrada, escanea el código QR.
            </div>
          )}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
