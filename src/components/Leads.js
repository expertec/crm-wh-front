// src/components/Leads.js
import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  getDocs,
  arrayUnion,
} from 'firebase/firestore';
import {
  Table,
  Tag,
  Input,
  Tooltip,
  message,
  Dropdown,
  Menu,
  Button,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';

const availableColors = [
  'magenta','volcano','orange','gold',
  'lime','green','cyan','blue','geekblue','purple',
];

// Genera un color fijo según el string
const getColorForTag = tag => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return availableColors[Math.abs(hash) % availableColors.length];
};

const EditableTags = ({ tags, leadId, availableTags }) => {
  const [localTags, setLocalTags] = useState(tags || []);

  useEffect(() => {
    setLocalTags(tags || []);
  }, [tags]);

  const updateSequenceForTag = async tag => {
    try {
      const secSnapshot = await getDocs(collection(db, 'secuencias'));
      const triggers = secSnapshot.docs.map(d => d.data().trigger);
      if (triggers.includes(tag)) {
        await updateDoc(doc(db, 'leads', leadId), {
          secuenciasActivas: arrayUnion({
            trigger: tag,
            startTime: new Date().toISOString(),
            index: 0,
          }),
        });
      }
    } catch (err) {
      console.error('Error al activar secuencia:', err);
    }
  };

  const handleRemove = async removedTag => {
    const newTags = localTags.filter(t => t !== removedTag);
    setLocalTags(newTags);
    try {
      await updateDoc(doc(db, 'leads', leadId), { etiquetas: newTags });
      message.success('Etiqueta eliminada');
    } catch {
      message.error('Error al eliminar etiqueta');
    }
  };

  const handleMenuClick = async ({ key }) => {
    if (!localTags.includes(key)) {
      const newTags = [...localTags, key];
      setLocalTags(newTags);
      try {
        await updateDoc(doc(db, 'leads', leadId), { etiquetas: newTags });
        message.success('Etiqueta agregada');
        await updateSequenceForTag(key);
      } catch {
        message.error('Error al agregar etiqueta');
      }
    } else {
      message.info('Etiqueta ya existente');
    }
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      {availableTags.map(tag => (
        <Menu.Item key={tag}>{tag}</Menu.Item>
      ))}
    </Menu>
  );

  return (
    <>
      {localTags.map(tag => {
        const color = getColorForTag(tag);
        const tagElem = (
          <Tag key={tag} color={color} closable onClose={() => handleRemove(tag)}>
            {tag}
          </Tag>
        );
        return tag.length > 20
          ? <Tooltip title={tag} key={tag}>{tagElem}</Tooltip>
          : tagElem;
      })}
      <Dropdown overlay={menu} trigger={['click']}>
        <Tag style={{ background: '#fff', borderStyle: 'dashed', cursor: 'pointer' }}>
          <PlusOutlined />
        </Tag>
      </Dropdown>
    </>
  );
};

const Leads = () => {
  const { userRole } = useAuth();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const userUid = currentUser?.uid;

  const [leads, setLeads] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [searchText, setSearchText] = useState('');

  // Sólo superAdmin ve columnas Etiquetas/Secuencias
  const isSuperAdmin = userRole === 'superAdmin';

  // Carga en tiempo real
  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('fecha_creacion', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => {
      console.error(err);
      message.error('Error cargando leads');
    });
    return () => unsub();
  }, []);

  // Carga tags disponibles
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'tags'));
        setAvailableTags(snap.docs.map(d => d.data().tag));
      } catch (err) {
        console.error(err);
        message.error('Error cargando etiquetas');
      }
    })();
  }, []);

  const handleAssign = async record => {
    if (!userUid) {
      message.error('Usuario no autenticado');
      return;
    }
    try {
      await updateDoc(doc(db, 'leads', record.id), { assignedTo: userUid });
      message.success('Lead asignado a ti');
    } catch {
      message.error('Error asignando lead');
    }
  };

  // Filtros: sin assignedTo y búsqueda
  const filteredLeads = leads
    .filter(l => !l.assignedTo)
    .filter(l =>
      (l.nombre || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (l.telefono || '').toLowerCase().includes(searchText.toLowerCase())
    );

  const columns = [
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
    {
      title: 'Creación',
      dataIndex: 'fecha_creacion',
      key: 'fecha_creacion',
      render: val => {
        if (!val) return '';
        const d = val.toDate ? val.toDate() : new Date(val);
        return d.toLocaleString();
      }
    },
    { title: 'Teléfono', dataIndex: 'telefono', key: 'telefono' },
    // Sólo superAdmin:
    ...(isSuperAdmin ? [
      {
        title: 'Etiquetas',
        key: 'etiquetas',
        render: (_, record) => (
          <EditableTags
            tags={record.etiquetas}
            leadId={record.id}
            availableTags={availableTags}
          />
        )
      },
      {
        title: 'Secuencias',
        key: 'secuenciasActivas',
        render: (_, record) =>
          Array.isArray(record.secuenciasActivas)
            ? record.secuenciasActivas.length
            : 0
      }
    ] : []),
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => {
        if (!record.assignedTo) {
          return (
            <Button
              type="primary"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => handleAssign(record)}
            >
              Atender
            </Button>
          );
        } else if (record.assignedTo === userUid) {
          return <Tag color="green">Asignado a ti</Tag>;
        } else {
          return <Tag color="red">Asignado</Tag>;
        }
      }
    }
  ];

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: 16 }}>
       Leads sin seguimiento
      </h2>
      <Input.Search
        placeholder="Buscar por nombre o teléfono"
        onChange={e => setSearchText(e.target.value)}
        style={{ marginBottom: 16 }}
        allowClear
      />
      <Table
        dataSource={filteredLeads}
        columns={columns}
        rowKey="id"
        bordered
      />
    </div>
  );
};

export default Leads;
