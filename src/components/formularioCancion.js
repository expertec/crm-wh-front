// src/components/FormularioCancion.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Form,
  Input,
  Select,
  Button,
  Progress,
  message,
} from 'antd';
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

import 'antd/dist/reset.css';
import './FormularioCancion.css';

const { Option } = Select;
const { useWatch } = Form;

const pasos = [
  { key: 'purpose',       label: 'Selecciona el propósito de la canción' },
  { key: 'genre',         label: '¿Qué género deseas?' },
  { key: 'artist',        label: '¿Qué artista te gusta de este género?' },
  { key: 'voiceType',     label: '¿Qué tipo de voz quieres en tu canción?' },
  { key: 'includeName',   label: 'Si quieres que se incluya el nombre o apodo, escríbelo aquí.' },
  { key: 'anecdotes',     label: 'Cuéntanos alguna anécdota o frase que te gustaría incluir.' },
  { key: 'requesterName', label: '¿Cuál es tu nombre?' },
  { key: 'phone',         label: '¿Cuál es tu número de WhatsApp?' },
];

export default function FormularioCancion() {
  const [current, setCurrent]         = useState(0);
  const [submitting, setSubmitting]   = useState(false);
  const [showCustom, setShowCustom]   = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [form]                        = Form.useForm();
  const { search }                    = useLocation();
  const db                            = getFirestore();
  const containerRef                  = useRef(null);

  // Prefill desde URL
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('phone')) form.setFieldsValue({ phone: params.get('phone') });
    if (params.get('name'))  form.setFieldsValue({ requesterName: params.get('name') });
  }, [search, form]);

  // Ajustar iframe height
  const sendHeight = () => {
    if (containerRef.current) {
      const height = containerRef.current.scrollHeight + 20;
      window.parent.postMessage({ type: 'AUTO_HEIGHT', height }, '*');
    }
  };
  useEffect(() => {
    sendHeight();
    window.addEventListener('resize', sendHeight);
    return () => window.removeEventListener('resize', sendHeight);
  }, []);
  useEffect(() => {
    const t = setTimeout(sendHeight, 50);
    return () => clearTimeout(t);
  }, [current, showCustom, submitting]);

  const handleSelectChange = val => {
    setShowCustom(val === 'Otro');
    if (val !== 'Otro') form.setFieldsValue({ purposeCustom: undefined });
  };

  const next = () => {
    const field =
      current === 0
        ? showCustom ? 'purposeCustom' : 'purpose'
        : pasos[current].key;
    form.validateFields([field])
       .then(() => setCurrent(current + 1))
       .catch(() => {});
  };
  const prev = () => setCurrent(current - 1);

  // Validación en tiempo real de teléfono
  const watchedPhone = useWatch('phone', form);
  const watchedCC    = useWatch('countryCode', form);

  useEffect(() => {
    async function checkPhone() {
      if (!watchedPhone) {
        setPhoneExists(false);
        return;
      }
      const raw  = watchedPhone.replace(/\D/g, '');
      const full = watchedCC === '52'
        ? `521${raw}`
        : `${watchedCC}${raw}`;
      const letrasQ = query(
        collection(db, 'letras'),
        where('leadPhone','==', full)
      );
      const snapL  = await getDocs(letrasQ);
      const snapD  = await getDoc(doc(db, 'leads', `${full}@s.whatsapp.net`));
      setPhoneExists(!snapL.empty || snapD.exists());
    }
    checkPhone();
  }, [watchedPhone, watchedCC, db]);

  const onFinish = async () => {
    setSubmitting(true);
    try {
      const fv = form.getFieldsValue(true);

      // 1) Validar todos los pasos
      for (let i = 0; i < pasos.length; i++) {
        let key = pasos[i].key;
        if (key === 'purpose' && fv.purpose === 'Otro') key = 'purposeCustom';
        if (!fv[key]) {
          message.error('Por favor completa todos los pasos antes de enviar.');
          setSubmitting(false);
          return;
        }
      }
      if (phoneExists) {
        message.error('No puedes enviar: este número ya está registrado.');
        setSubmitting(false);
        return;
      }

      // 2) Normalizar teléfono
      const raw      = fv.phone.replace(/\D/g, '');
      const prefix   = fv.countryCode === '52' ? '521' : fv.countryCode;
      const e164     = `${prefix}${raw}`; // ej. "5218311760335"
      const jid      = `${e164}@s.whatsapp.net`;

      // 3) Crear o actualizar lead
      const leadRef  = doc(db, 'leads', jid);
      const leadSnap = await getDoc(leadRef);
      const cfgSnap  = await getDoc(doc(db, 'config', 'appConfig'));
      const trigger  = cfgSnap.exists ? cfgSnap.data().defaultTrigger || 'NuevoLead' : 'NuevoLead';

      if (!leadSnap.exists()) {
        await setDoc(leadRef, {
          nombre: fv.requesterName,
          telefono: e164,
          fecha_creacion: new Date(),
          estado: 'nuevo',
          source: 'Form',
          etiquetas: [trigger],
          secuenciasActivas: [{
            trigger,
            startTime: new Date().toISOString(),
            index: 0
          }],
          unreadCount: 1,
          lastMessageAt: new Date(),
          letraIds: [],           // inicializamos array de letras
        });
      }

      // 4) Guardar la petición de letra y obtener su ID
      const letraRef = await addDoc(collection(db, 'letras'), {
        leadPhone:      e164,
        leadId:         jid,                                   // relacion lead → letra
        purpose:        fv.purpose === 'Otro' ? fv.purposeCustom : fv.purpose,
        genre:          fv.genre,
        artist:         fv.artist,
        voiceType:      fv.voiceType,
        includeName:    fv.includeName,
        anecdotes:      fv.anecdotes,
        requesterName:  fv.requesterName,
        status:         'Sin letra',
        createdAt:      serverTimestamp(),
      });

      // 5) Añadir referencia de letra en el lead
      await updateDoc(leadRef, {
        letraIds: arrayUnion(letraRef.id)
      });

      message.success('¡Tu canción llegará pronto por WhatsApp! 🎶', 1.5);

      // 6) Redirección
      const redirectUrl = 'https://cantalab.com/mx-confirmacion-de-llenado/';
      if (window.self !== window.top) {
        window.parent.location.href = redirectUrl;
      } else {
        window.location.href = redirectUrl;
      }

    } catch (err) {
      console.error(err);
      message.error('Error al procesar tu solicitud.');
      setSubmitting(false);
    }
  };

  const percent = Math.round(((current + 1) / pasos.length) * 100);

  return (
    <div
      ref={containerRef}
      style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px 20px' }}
    >
      <Progress percent={percent} showInfo={false} strokeLinecap="square" style={{ marginBottom: 24 }} />
      <div style={{ textAlign: 'center', marginBottom: 8, color: '#888' }}>
        {current + 1} of {pasos.length}
      </div>
      <h2 style={{ fontSize: '1.75rem', textAlign: 'center', marginBottom: 24 }}>
        {pasos[current].label}<span style={{ color: 'red' }}> *</span>
      </h2>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* Paso teléfono */}
        {pasos[current].key === 'phone' && (
          <Form.Item>
            <Input.Group compact>
              <Form.Item
                name="countryCode"
                initialValue="52"
                noStyle
                rules={[{ required: true, message: 'Elige país' }]}
              >
                <Select style={{ width: '20%' }} dropdownMatchSelectWidth={false} optionLabelProp="label">
                  <Option value="52" label="🇲🇽 MX">🇲🇽 MX</Option>
                  <Option value="1"  label="🇺🇸 US">🇺🇸 US</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="phone"
                rules={[
                  { required: true, message: 'Ingresa tu número de WhatsApp' },
                  { pattern: /^\d+$/, message: 'Solo dígitos' }
                ]}
                style={{ width: '80%' }}
              >
                <Input className="big-input" placeholder="Ej. 8311760335" maxLength={15} />
              </Form.Item>
            </Input.Group>
            {phoneExists && (
              <div style={{ color: 'red', marginTop: 4 }}>
                Este número ya está registrado
              </div>
            )}
          </Form.Item>
        )}

        {/* Paso 0: propósito */}
        {current === 0 && (
          <>
            <Form.Item
              name="purpose"
              rules={[{ required: true, message: 'Selecciona un propósito' }]}
            >
              <Select
                className="big-select"
                dropdownClassName="big-select"
                placeholder="Seleccione propósito"
                onChange={handleSelectChange}
              >
                {[
                  'Declarar mi amor','Decirle que la/o quiero','Desamor',
                  'Motivación y Superación Personal','Homenajes','Memoriales',
                  'Agradecer su Amistad','Despedida','Un Aniversario','Agradecer',
                  'Reconocimientos y Logros','Felicitación por Cumpleaños',
                  'Propuesta de Matrimonio','Nacimiento de un Bebé',
                  'Día de la Madre o del Padre','Otro'
                ].map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
              </Select>
            </Form.Item>
            {showCustom && (
              <Form.Item
                name="purposeCustom"
                rules={[{ required: true, message: 'Escribe tu propósito' }]}
              >
                <Input.TextArea rows={3} placeholder="Escribe tu propósito" />
              </Form.Item>
            )}
          </>
        )}

        {/* Pasos 1–6 */}
        {current > 0 && pasos[current].key !== 'phone' && (
          <Form.Item
            name={pasos[current].key}
            rules={[{ required: true, message: 'Este campo es requerido' }]}
          >
            {pasos[current].key === 'genre' && (
              <Select placeholder="Selecciona un género">
                {[
                  'Corrido tumbado','Balada Romántica','Regional Mexicano','Pop',
                  'Corrido Norteño','Rock Pop','Reguetón','Bachata','Rap','Salsa',
                  'Rock','Cumbia','Banda','Que un experto elija por mí','Otro'
                ].map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
              </Select>
            )}
            {pasos[current].key === 'voiceType' && (
              <Select placeholder="Selecciona tipo de voz">
                {['Voz Femenina','Voz Masculina','Cualquiera'].map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
              </Select>
            )}
            {['artist','includeName','requesterName'].includes(pasos[current].key) && (
              <Input placeholder={pasos[current].label} />
            )}
            {pasos[current].key === 'anecdotes' && (
              <Input.TextArea rows={3} placeholder={pasos[current].label} />
            )}
          </Form.Item>
        )}

        {/* Navegación */}
        <div style={{ marginTop: 32 }}>
          {current < pasos.length - 1 && (
            <Button type="primary" onClick={next} block size="large">
              Continuar ↵
            </Button>
          )}
          {current === pasos.length - 1 && (
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              disabled={submitting || phoneExists}
              block
              size="large"
            >
              Enviar y recibir canción 🎵
            </Button>
          )}
          {current > 0 && (
            <Button onClick={prev} block style={{ marginTop: 10 }}>
              ← Anterior
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
}
