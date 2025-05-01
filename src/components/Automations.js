import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { Card, Form, Switch, Select, Typography, message } from "antd";

const { Option } = Select;
const { Title } = Typography;

const Automations = () => {
  const [autoSaveLeads, setAutoSaveLeads] = useState(true);
  const [defaultTrigger, setDefaultTrigger] = useState("");
  const [tag24h, setTag24h] = useState("");
  const [tag48h, setTag48h] = useState("");
  const [tags, setTags] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Cargar configuración
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configRef = doc(db, "config", "appConfig");
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          const data = configSnap.data();
          setAutoSaveLeads(data.autoSaveLeads ?? true);
          setDefaultTrigger(data.defaultTrigger ?? "");
          setTag24h(data.tagAfter24h ?? "");
          setTag48h(data.tagAfter48h ?? "");
        }
      } catch (error) {
        console.error(error);
        message.error("Error al cargar la configuración.");
      } finally {
        setLoadingConfig(false);
      }
    };
    loadConfig();
  }, []);

  // Cargar todas las etiquetas definidas en /tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const snap = await getDocs(collection(db, "tags"));
        setTags(snap.docs.map(d => d.data().tag));
      } catch {
        message.error("Error al cargar etiquetas.");
      }
    };
    loadTags();
  }, []);

  // Actualizar config en Firestore
  const updateConfig = async (fields) => {
    try {
      await setDoc(doc(db, "config", "appConfig"), fields, { merge: true });
      message.success("Configuración actualizada.");
    } catch {
      message.error("Error al actualizar configuración.");
    }
  };

  return (
    <Card style={{ maxWidth: 600, margin: "20px auto" }}>
      <Title level={3}>Configuración Global</Title>
      <Form layout="vertical">
        <Form.Item label="Guardado automático de leads">
          <Switch
            checked={autoSaveLeads}
            onChange={checked => {
              setAutoSaveLeads(checked);
              updateConfig({ autoSaveLeads: checked });
            }}
            loading={loadingConfig}
          />
        </Form.Item>

        <Form.Item label="Trigger predeterminado">
          <Select
            value={defaultTrigger}
            onChange={value => {
              setDefaultTrigger(value);
              updateConfig({ defaultTrigger: value });
            }}
            loading={loadingConfig}
            placeholder="Selecciona un trigger"
          >
            {tags.map(tag => (
              <Option key={tag} value={tag}>{tag}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Etiqueta después de 24 h">
          <Select
            value={tag24h}
            onChange={value => {
              setTag24h(value);
              updateConfig({ tagAfter24h: value });
            }}
            loading={loadingConfig}
            placeholder="Selecciona etiqueta 24 h"
          >
            {tags.map(tag => (
              <Option key={tag} value={tag}>{tag}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Etiqueta después de 48 h">
          <Select
            value={tag48h}
            onChange={value => {
              setTag48h(value);
              updateConfig({ tagAfter48h: value });
            }}
            loading={loadingConfig}
            placeholder="Selecciona etiqueta 48 h"
          >
            {tags.map(tag => (
              <Option key={tag} value={tag}>{tag}</Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Automations;
