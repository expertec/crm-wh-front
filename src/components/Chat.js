// src/components/Chat.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Input,
  Button,
  List,
  Avatar,
  Tag,
  message,
  Spin,
  Alert,
  Badge,
  Dropdown,
  Modal,
  Form,
  Select,
} from 'antd';
import {
  UserOutlined,
  AudioOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DownloadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { FaSearch, FaPaperPlane } from 'react-icons/fa';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import bgNoChat from '../assets/bgNoChat.png';
import bgChat from '../assets/bgChat.png';
import './styleChat.css';

const { CheckableTag } = Tag;
const PAGE_SIZE = 20;
const TAG_COLORS = [
  'magenta', 'red', 'volcano', 'orange', 'gold',
  'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple',
];

// Formatea timestamp a "HH:MM"
function formatTimestamp(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Burbuja de audio
function AudioBubble({ src, timestamp, incoming }) {
  const audioRef = useRef();
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onMeta = () => setDuration(a.duration);
    const onTime = () => setCurrent(a.currentTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('timeupdate', onTime);
    return () => {
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('timeupdate', onTime);
    };
  }, []);

  const togglePlay = () => {
    const a = audioRef.current;
    playing ? a.pause() : a.play();
    setPlaying(!playing);
  };

  const onSeek = (e) => {
    const a = audioRef.current;
    a.currentTime = Number(e.target.value);
    setCurrent(a.currentTime);
  };

  const toggleRate = () => {
    const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
    audioRef.current.playbackRate = next;
    setRate(next);
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: incoming ? '#AEAEAE' : '#1B91FF',
        color: incoming ? '#fff' : '#000',
        borderRadius: 24,
        padding: '8px 12px',
        maxWidth: '60%',
      }}
    >
      {incoming && (
        <div style={{ position: 'relative', marginRight: 8 }}>
          <Avatar icon={<UserOutlined />} style={{ background: 'rgba(255,255,255,0.2)' }} />
          <AudioOutlined style={{
            position: 'absolute',
            bottom: -4,
            left: 8,
            fontSize: 12,
            color: '#fff',
          }} />
        </div>
      )}
      <Button
        type="text"
        onClick={togglePlay}
        icon={playing
          ? <PauseCircleOutlined style={{ fontSize: 24, color: incoming ? '#fff' : '#000' }} />
          : <PlayCircleOutlined style={{ fontSize: 24, color: incoming ? '#fff' : '#000' }} />
        }
      />
      <input
        type="range"
        min={0}
        max={duration}
        step="0.01"
        value={current}
        onChange={onSeek}
        style={{
          flex: 1,
          margin: '0 8px',
          cursor: 'pointer',
          accentColor: incoming ? '#fff' : '#000',
        }}
      />
      <span style={{ fontSize: 12, marginRight: 8 }}>
        {Math.floor(current / 60)}:{String(Math.floor(current % 60)).padStart(2, '0')}
      </span>
      <span style={{ fontSize: 12, marginRight: 12 }}>
        {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '00')}
      </span>
      <Button
        type="text"
        onClick={toggleRate}
        style={{ fontSize: 12, color: incoming ? '#fff' : '#000', marginRight: 8 }}
      >
        {rate}x
      </Button>
      <a href={src} download style={{ color: incoming ? '#fff' : '#000' }}>
        <DownloadOutlined />
      </a>
      <audio ref={audioRef} src={src} preload="metadata" style={{ display: 'none' }} />
      <div style={{ fontSize: 10, marginLeft: 8 }}>
        {formatTimestamp(timestamp)}
      </div>
    </div>
  );
}

export default function Chat() {
  const db = getFirestore();
  const { user } = useAuth();

  // Leads & pagination
  const [displayedLeads, setDisplayedLeads] = useState([]);
  const [lastLeadDoc, setLastLeadDoc] = useState(null);
  const [hasMoreLeads, setHasMoreLeads] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const leadsContainerRef = useRef();

  // Status options + modal/form + filter state
  const [statusOptions, setStatusOptions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Chat state & pagination
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadStatus, setLeadStatus] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [lastMsgDoc, setLastMsgDoc] = useState(null);
  const [hasMoreMsgs, setHasMoreMsgs] = useState(true);
  const [loadingMoreMsgs, setLoadingMoreMsgs] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const containerRef = useRef();
  const messagesEndRef = useRef();
  const lastTsRef = useRef(0);

  // Load status options
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'statusOptions'));
      setStatusOptions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, [db]);

  // Change lead status
  const changeLeadStatus = async (contactId, newStatus) => {
    try {
      await updateDoc(doc(db, 'leads', contactId), { estado: newStatus });
      message.success(`Status cambiado a "${newStatus}"`);
    } catch {
      message.error('No se pudo actualizar el status');
    }
  };

  // Add new status
  const handleAddStatus = async ({ name, color }) => {
    try {
      await addDoc(collection(db, 'statusOptions'), {
        name,
        color,
        isConversion: false,
      });
      message.success('Nuevo estado agregado');
      form.resetFields();
      setIsModalOpen(false);
      const snap = await getDocs(collection(db, 'statusOptions'));
      setStatusOptions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      message.error('Error creando nuevo estado');
    }
  };

  // Build dropdown menu items
  const menuItemsBuilder = lead => {
    const items = statusOptions.map(opt => ({
      key: opt.id,
      label: <Tag color={opt.color}>{opt.name}</Tag>,
      onClick: () => changeLeadStatus(lead.contactId, opt.name),
    }));
    items.push({
      key: 'new',
      label: (
        <span>
          <PlusOutlined /> Agregar nuevo estado
        </span>
      ),
      onClick: () => setIsModalOpen(true),
    });
    return items;
  };

  // Subscribe to leads
  useEffect(() => {
    if (!user?.uid) {
      setDisplayedLeads([]);
      return;
    }
    const qLeads = query(
      collection(db, 'leads'),
      where('assignedTo', '==', user.uid),
      orderBy('lastMessageAt', 'desc'),
      limit(PAGE_SIZE)
    );
    const unsub = onSnapshot(
      qLeads,
      snap => {
        let docs = snap.docs.map(d => ({ contactId: d.id, ...d.data() }));
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          docs = docs.filter(
            l =>
              (l.nombre || '').toLowerCase().includes(term) ||
              (l.telefono || '').toLowerCase().includes(term)
          );
        }
        if (statusFilter !== 'Todos') {
          docs = docs.filter(l => l.estado === statusFilter);
        }
        setDisplayedLeads(docs);
        setLastLeadDoc(snap.docs[snap.docs.length - 1] || null);
        setHasMoreLeads(snap.docs.length === PAGE_SIZE);
      },
      () => message.error('No se pudieron cargar los leads.')
    );
    return () => unsub();
  }, [db, user?.uid, searchTerm, statusFilter]);

  // Load more leads on scroll
  const loadMoreLeads = async () => {
    if (!user?.uid || !hasMoreLeads || loadingLeads) return;
    setLoadingLeads(true);
    const qMore = query(
      collection(db, 'leads'),
      where('assignedTo', '==', user.uid),
      orderBy('lastMessageAt', 'desc'),
      startAfter(lastLeadDoc),
      limit(PAGE_SIZE)
    );
    try {
      let docs = (await getDocs(qMore)).docs.map(d => ({ contactId: d.id, ...d.data() }));
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        docs = docs.filter(
          l =>
            (l.nombre || '').toLowerCase().includes(term) ||
            (l.telefono || '').toLowerCase().includes(term)
        );
      }
      if (statusFilter !== 'Todos') {
        docs = docs.filter(l => l.estado === statusFilter);
      }
      setDisplayedLeads(prev => [...prev, ...docs]);
      setLastLeadDoc(docs.length ? docs[docs.length - 1] : lastLeadDoc);
      setHasMoreLeads(docs.length === PAGE_SIZE);
    } catch {
      message.error('Error cargando más leads.');
    } finally {
      setLoadingLeads(false);
    }
  };
  const onLeadsScroll = e => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      loadMoreLeads();
    }
  };

  // Select lead without resetting if same
  const selectLead = async lead => {
    if (selectedLead?.contactId === lead.contactId) return;
    setSelectedLead(lead);
    setLeadStatus(lead.estado || '');
    lastTsRef.current = 0;
    setMsgs([]);
    setLastMsgDoc(null);
    setHasMoreMsgs(true);
    try {
      await updateDoc(doc(db, 'leads', lead.contactId), { unreadCount: 0 });
    } catch (err) {
      console.error('Error reseteando unreadCount:', err);
    }
  };

  // Subscribe to messages for the selected lead
  useEffect(() => {
    let unsub = () => {};
    if (!selectedLead) return;
    const msgsCol = collection(db, 'leads', selectedLead.contactId, 'messages');
    (async () => {
      const q0 = query(msgsCol, orderBy('timestamp', 'desc'), limit(PAGE_SIZE));
      const snap0 = await getDocs(q0);
      const arr0 = snap0.docs.map(d => d.data()).reverse();
      setMsgs(arr0);
      setLastMsgDoc(snap0.docs[snap0.docs.length - 1] || null);
      lastTsRef.current = arr0.length ? arr0[arr0.length - 1].timestamp.toMillis() : 0;

      const subQ = query(msgsCol, orderBy('timestamp', 'asc'));
      unsub = onSnapshot(subQ, snapNew => {
        snapNew.docChanges().forEach(change => {
          if (change.type === 'added') {
            const m = change.doc.data();
            const ms = m.timestamp.toMillis();
            if (ms > lastTsRef.current) {
              setMsgs(prev => [...prev, m]);
              lastTsRef.current = ms;
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
          }
        });
      });
    })();
    return () => unsub();
  }, [db, selectedLead]);

  const loadMoreMsgs = async () => {
    if (!selectedLead || !hasMoreMsgs || loadingMoreMsgs) return;
    setLoadingMoreMsgs(true);
    const msgsCol = collection(db, 'leads', selectedLead.contactId, 'messages');
    const qMore = query(
      msgsCol,
      orderBy('timestamp', 'desc'),
      startAfter(lastMsgDoc),
      limit(PAGE_SIZE)
    );
    try {
      const snap = await getDocs(qMore);
      const older = snap.docs.map(d => d.data()).reverse();
      setMsgs(prev => [...older, ...prev]);
      setLastMsgDoc(snap.docs[snap.docs.length - 1] || lastMsgDoc);
      setHasMoreMsgs(snap.docs.length === PAGE_SIZE);
    } catch {
      message.error('Error cargando más mensajes.');
    } finally {
      setLoadingMoreMsgs(false);
    }
  };

  const handleScrollMsgs = e => {
    if (e.target.scrollTop === 0 && hasMoreMsgs && !loadingMoreMsgs) {
      loadMoreMsgs();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // Send message: remove local echo
  const handleSend = async () => {
    if (!newMessage.trim() || isSending || !selectedLead) return;
    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const { status } = await (await fetch(`${apiUrl}/api/whatsapp/status`)).json();
      if (status !== 'Conectado') throw new Error('WhatsApp no conectado');

      await fetch(`${apiUrl}/api/whatsapp/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedLead.contactId, message: content }),
      });
      message.success('Mensaje enviado.');
    } catch (err) {
      message.error(err.message || 'Error enviando mensaje.');
    } finally {
      setIsSending(false);
    }
  };

  // Render a message
  const renderMessage = (msg, idx) => {
    if (msg.sender === 'system') {
      return (
        <div key={idx} style={{ textAlign: 'center', margin: '12px 0', color: '#888' }}>
          {msg.content}
        </div>
      );
    }
    const inc = msg.sender === 'lead';
    if (msg.mediaType === 'audio') {
      return (
        <div key={idx} style={{ textAlign: inc ? 'left' : 'right', margin: '12px 0' }}>
          <AudioBubble src={msg.mediaUrl} timestamp={msg.timestamp} incoming={inc} />
        </div>
      );
    }
    if (msg.mediaType === 'image') {
      return (
        <div key={idx} style={{ textAlign: inc ? 'left' : 'right', margin: '12px 0' }}>
          <img
            src={msg.mediaUrl}
            alt=""
            style={{ width: '15%', borderRadius: 12, cursor: 'pointer' }}
            onClick={() => window.open(msg.mediaUrl, '_blank')}
          />
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            {formatTimestamp(msg.timestamp)}
          </div>
        </div>
      );
    }
    return (
      <div key={idx} style={{ textAlign: inc ? 'left' : 'right', margin: '12px 0' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: inc ? '#fff' : '#1B91FF',
            color: inc ? '#000' : '#fff',
            borderRadius: 12,
            maxWidth: '70%',
          }}
        >
          {msg.content}
        </div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
          {formatTimestamp(msg.timestamp)}
        </div>
      </div>
    );
  };

  // Render a lead in the list
  const renderLeadItem = lead => {
    const currentOpt = statusOptions.find(o => o.name === lead.estado);
    const tagColor = currentOpt?.color || 'blue';
    const items = menuItemsBuilder(lead);

    return (
      <List.Item
        key={lead.contactId}
        onClick={() => selectLead(lead)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: selectedLead?.contactId === lead.contactId ? '#e6f7ff' : '#fff',
          padding: '8px 16px',
        }}
        extra={lead.unreadCount > 0 && (
          <Badge count={lead.unreadCount} style={{ backgroundColor: '#f5222d' }} />
        )}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar>{(lead.nombre || lead.contactId)[0].toUpperCase()}</Avatar>
          <strong>{lead.nombre || lead.contactId}</strong>
        </div>
        <Dropdown menu={{ items }} trigger={['click']} onClick={e => e.stopPropagation()}>
          <Tag color={tagColor} style={{ cursor: 'pointer' }}>
            {lead.estado || 'Sin estado'}
          </Tag>
        </Dropdown>
      </List.Item>
    );
  };

  const currentHeaderOpt = statusOptions.find(o => o.name === leadStatus);
  const headerTagColor = currentHeaderOpt?.color || 'blue';

  return (
    <>
      <Modal
        title="Nuevo Estado"
        open={isModalOpen}
        onCancel={() => { form.resetFields(); setIsModalOpen(false); }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleAddStatus}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true, message: 'Ingresa el nombre del estado' }]}>
            <Input placeholder="Nombre del estado" />
          </Form.Item>
          <Form.Item name="color" label="Color" rules={[{ required: true, message: 'Selecciona un color' }]}>
            <Select placeholder="Selecciona un color">
              {TAG_COLORS.map(c => (
                <Select.Option key={c} value={c}>
                  <Tag color={c}>{c}</Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <div style={{ display: 'flex', height: '100vh' }}>
        {/* LEFT: leads list */}
        <div
          style={{
            width: 300,
            borderRight: '1px solid #ddd',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: 16, textAlign: 'center' }}>
            <h3>Mis Chats</h3>
          </div>

          {/* Filters + Search */}
          <div style={{ padding: '0 16px 16px' }}>
            <div
              style={{
                display: 'flex',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                gap: 8,
                paddingBottom: 8,
              }}
            >
              <CheckableTag
                key="Todos"
                checked={statusFilter === 'Todos'}
                onChange={() => setStatusFilter('Todos')}
              >
                Todos
              </CheckableTag>
              {statusOptions.map(opt => (
                <CheckableTag
                  key={opt.id}
                  checked={statusFilter === opt.name}
                  onChange={() => setStatusFilter(opt.name)}
                >
                  <Tag color={opt.color}>{opt.name}</Tag>
                </CheckableTag>
              ))}
            </div>

            <Input.Search
              placeholder="Buscar por nombre o teléfono"
              enterButton={<FaSearch />}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              allowClear
            />
          </div>

          <div
            ref={leadsContainerRef}
            onScroll={onLeadsScroll}
            className="hide-scrollbar"
            style={{ flex: 1, overflowY: 'auto' }}
          >
            <List dataSource={displayedLeads} renderItem={renderLeadItem} />
            {loadingLeads && <Spin style={{ width: '100%', padding: 16 }} />}
          </div>
        </div>

        {/* RIGHT: chat window */}
        {selectedLead ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* header */}
            <div style={{ padding: 16, borderBottom: '1px solid #ddd', background: '#fff' }}>
              <Avatar style={{ marginRight: 12 }}>
                {(selectedLead.nombre || selectedLead.contactId)[0].toUpperCase()}
              </Avatar>
              <strong style={{ marginRight: 8 }}>
                {selectedLead.nombre || selectedLead.contactId}
              </strong>
              <Tag color={headerTagColor}>{leadStatus}</Tag>
            </div>

            {/* messages */}
            <div
              ref={containerRef}
              onScroll={handleScrollMsgs}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 16px',
                backgroundImage: `url(${bgChat})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '200px auto',
              }}
            >
              {loadingMoreMsgs && <Spin tip="Cargando mensajes..." style={{ marginBottom: 16 }} />}
              {!hasMoreMsgs && !loadingMoreMsgs && (
                <Alert
                  message="No hay más mensajes"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              {msgs.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>

            {/* input */}
            <div style={{ padding: 16, borderTop: '1px solid #ddd', background: '#fff' }}>
              <Input.Group compact>
                <Input
                  style={{ width: 'calc(100% - 100px)' }}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onPressEnter={handleSend}
                  placeholder="Escribe un mensaje"
                />
                <Button
                  type="primary"
                  icon={<FaPaperPlane />}
                  onClick={handleSend}
                  loading={isSending}
                >
                  Enviar
                </Button>
              </Input.Group>
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#fafafa',
            }}
          >
            <img
              src={bgNoChat}
              alt="Selecciona un chat"
              style={{ maxWidth: '50%', maxHeight: '50%', objectFit: 'contain' }}
            />
          </div>
        )}
      </div>
    </>
  );
}
