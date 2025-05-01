// src/components/Secuencias.js
import React, { useState, useEffect } from 'react';
import { db, storage } from "../config/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Upload,
  message
} from "antd";
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';

const { Option } = Select;

const Secuencias = () => {
  const [sequences, setSequences] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const secuenciasRef = collection(db, "secuencias");
  const tagsRef = collection(db, "tags");

  useEffect(() => {
    fetchSequences();
    fetchTags();
  }, []);

  const fetchSequences = async () => {
    try {
      const snapshot = await getDocs(secuenciasRef);
      setSequences(snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      })));
    } catch (error) {
      console.error('Error fetching sequences:', error);
      message.error('Error al obtener secuencias');
    }
  };

  const fetchTags = async () => {
    try {
      const snapshot = await getDocs(tagsRef);
      setTags(snapshot.docs.map(docSnap => docSnap.data().tag));
    } catch (error) {
      console.error('Error fetching tags:', error);
      message.error('Error al obtener etiquetas');
    }
  };

  const openModal = () => {
    setEditingId(null);
    setModalOpen(true);
    form.resetFields();
    form.setFieldsValue({
      id: null,
      name: '',
      trigger: '',
      messages: [{ type: 'texto', contenido: '', delay: 0 }],
      active: true,
    });
  };

  const closeModal = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingId(null);
  };

  const handleFileChange = async (file) => {
    if (!file) return;
    try {
      const storageRef = ref(storage, `uploads/${Date.now()}-${file.name}`);
      const snap = await uploadBytes(storageRef, file);
      return await getDownloadURL(snap.ref);
    } catch (error) {
      console.error('Error uploading file:', error);
      message.error('Error al subir archivo');
    }
  };

  const handleCreateSequence = async (values) => {
    if (!tags.includes(values.trigger)) {
      await addDoc(tagsRef, { tag: values.trigger });
      fetchTags();
    }

    const processedMessages = values.messages.map(msg => {
      const { trigger, ...rest } = msg;
      return rest;
    });

    const seqData = {
      name: values.name,
      trigger: values.trigger,
      messages: processedMessages,
      active: values.active,
    };

    try {
      if (values.id) {
        await updateDoc(doc(db, "secuencias", values.id), seqData);
        message.success('Secuencia actualizada correctamente');
      } else {
        await addDoc(secuenciasRef, seqData);
        message.success('Secuencia creada correctamente');
      }
      fetchSequences();
      closeModal();
    } catch (error) {
      console.error('Error saving sequence:', error);
      message.error('Error al guardar la secuencia');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "secuencias", id));
      fetchSequences();
      message.success('Secuencia eliminada');
    } catch (error) {
      console.error('Error deleting sequence:', error);
      message.error('Error al eliminar la secuencia');
    }
  };

  const toggleActivation = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, "secuencias", id), { active: !currentStatus });
      fetchSequences();
      message.success('Estado de secuencia actualizado');
    } catch (error) {
      console.error('Error toggling sequence activation:', error);
      message.error('Error al actualizar el estado');
    }
  };

  const handleEdit = (sequence) => {
    setEditingId(sequence.id);
    form.setFieldsValue({
      id: sequence.id,
      name: sequence.name,
      trigger: sequence.trigger,
      messages: sequence.messages,
      active: sequence.active,
    });
    setModalOpen(true);
  };

  const columns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Etiqueta', dataIndex: 'trigger', key: 'trigger' },
    {
      title: 'Estado', dataIndex: 'active', key: 'active',
      render: active => active ? 'Activo' : 'Inactivo'
    },
    {
      title: 'Acciones', key: 'acciones', render: (_, record) => (
        <>
          <Button type="primary" size="small" onClick={() => handleEdit(record)} style={{ marginRight: 8 }}>
            Editar
          </Button>
          <Button size="small" onClick={() => toggleActivation(record.id, record.active)} style={{ marginRight: 8 }}>
            {record.active ? 'Desactivar' : 'Activar'}
          </Button>
          <Button danger size="small" onClick={() => handleDelete(record.id)}>
            Borrar
          </Button>
        </>
      )
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: 16 }}>
        Gestión de Secuencias
      </h2>
      <Button type="primary" onClick={openModal} style={{ marginBottom: 16 }}>
        Crear Nueva Secuencia
      </Button>
      <Table dataSource={sequences} columns={columns} rowKey="id" bordered />

      <Modal
        title={editingId ? 'Editar Secuencia' : 'Crear Secuencia'}
        visible={modalOpen}
        onCancel={closeModal}
        footer={null}
        width="60%"
      >
        <Form form={form} layout="vertical" onFinish={handleCreateSequence}>
          <Form.Item name="id" noStyle hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Nombre de la secuencia"
            name="name"
            rules={[{ required: true, message: 'Ingresa el nombre de la secuencia' }]}
          >
            <Input placeholder="Nombre de la secuencia" />
          </Form.Item>

          <Form.Item
            label="Etiqueta disparadora"
            name="trigger"
            rules={[{ required: true, message: 'Ingresa la etiqueta disparadora' }]}
          >
            <Input placeholder="ej. NuevoLead, Cliente, Cobro-recurrente" list="tags-list" />
          </Form.Item>
          <datalist id="tags-list">
            {tags.map((tag, idx) => <option key={idx} value={tag} />)}
          </datalist>

          <Form.Item name="active" valuePropName="checked" initialValue={true} hidden>
            <Input />
          </Form.Item>

          <Form.Item label="Mensajes">
            <Form.List name="messages">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(field => (
                    <div
                      key={field.key}
                      style={{
                        border: '1px solid #d9d9d9',
                        padding: 16,
                        marginBottom: 16,
                        borderRadius: 4,
                      }}
                    >
                      <Form.Item
                        {...field}
                        label="Tipo de mensaje"
                        name={[field.name, 'type']}
                        fieldKey={[field.fieldKey, 'type']}
                        rules={[{ required: true, message: 'Selecciona el tipo de mensaje' }]}
                      >
                        <Select>
                          <Option value="texto">Texto</Option>
                          <Option value="imagen">Imagen</Option>
                          <Option value="audio">Audio</Option>
                          <Option value="video">Video</Option>  {/* Añadido */}
                          <Option value="formulario">Formulario</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item shouldUpdate>
                        {() => {
                          const type = form.getFieldValue(['messages', field.name, 'type']);
                          if (type === 'texto') {
                            return (
                              <Form.Item
                                {...field}
                                label="Contenido (texto)"
                                name={[field.name, 'contenido']}
                                fieldKey={[field.fieldKey, 'contenido']}
                                rules={[{ required: true, message: 'Ingresa el contenido del mensaje' }]}
                              >
                                <Input.TextArea rows={4} placeholder="Ingresa el contenido del mensaje" />
                              </Form.Item>
                            );
                          }
                          if (['imagen','audio','video'].includes(type)) {
                            // mismo flujo para imagen, audio y video
                            return (
                              <>
                                <Form.Item label="Subir archivo">
                                  <Upload
                                    beforeUpload={() => false}
                                    onChange={async ({ file }) => {
                                      const url = await handleFileChange(file);
                                      const msgs = form.getFieldValue('messages');
                                      msgs[field.name].contenido = url;
                                      form.setFieldsValue({ messages: msgs });
                                    }}
                                  >
                                    <Button icon={<UploadOutlined />}>Seleccionar Archivo</Button>
                                  </Upload>
                                </Form.Item>
                                <Form.Item
                                  {...field}
                                  label="Contenido (URL)"
                                  name={[field.name, 'contenido']}
                                  fieldKey={[field.fieldKey, 'contenido']}
                                  rules={[{ required: true, message: 'Ingresa la URL del archivo' }]}
                                >
                                  <Input placeholder="Ingrese la URL del archivo" />
                                </Form.Item>
                              </>
                            );
                          }
                          if (type === 'formulario') {
                            return (
                              <Form.Item
                                {...field}
                                label="Mensaje de formulario"
                                name={[field.name, 'contenido']}
                                fieldKey={[field.fieldKey, 'contenido']}
                                rules={[{ required: true, message: 'Ingresa el texto introductorio para el formulario' }]}
                              >
                                <Input.TextArea rows={2} placeholder="Texto introductorio antes del enlace" />
                              </Form.Item>
                            );
                          }
                          return null;
                        }}
                      </Form.Item>

                      <Form.Item
                        {...field}
                        label="Delay (minutos)"
                        name={[field.name, 'delay']}
                        fieldKey={[field.fieldKey, 'delay']}
                        rules={[{ required: true, message: 'Ingresa el delay' }]}
                      >
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>

                      <Button type="dashed" onClick={() => remove(field.name)} block>
                        Eliminar Mensaje
                      </Button>
                    </div>
                  ))}

                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Agregar mensaje
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={closeModal} style={{ marginRight: 8 }}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit">
              Guardar Secuencia
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Secuencias;
