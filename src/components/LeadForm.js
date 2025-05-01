import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { Form, Input, Button, Card, Progress, Alert, message } from "antd";

const LeadForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const [lead, setLead] = useState({
    // Paso 1: Datos del negocio
    negocio: "",
    giro: "",
    descripcion: "",
    // Paso 2: Datos de contacto
    nombre: "",
    telefono: "",
    // Se asigna por defecto la etiqueta para activar la secuencia
    etiquetas: ["NuevoLead"],
    secuenciasActivas: [],
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);

  const [form] = Form.useForm();

  // Validación en tiempo real del número de teléfono
  useEffect(() => {
    if (lead.telefono) {
      const checkPhone = async () => {
        try {
          const q = query(
            collection(db, "leads"),
            where("telefono", "==", lead.telefono)
          );
          const querySnapshot = await getDocs(q);
          setPhoneExists(!querySnapshot.empty);
        } catch (error) {
          console.error("Error al verificar número:", error);
        }
      };
      checkPhone();
    } else {
      setPhoneExists(false);
    }
  }, [lead.telefono]);

  // Manejo de cambios en el formulario
  const handleFormValuesChange = (changedValues, allValues) => {
    setLead(allValues);
  };

  // Funciones para avanzar y retroceder entre pasos
  const nextStep = () => {
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1);
    });
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Al enviar el formulario, se crea el lead y se asignan las secuencias activas
  const handleSubmit = async () => {
    if (phoneExists) {
      message.error("El número de teléfono ya está registrado. Por favor, verifica.");
      return;
    }
    setLoading(true);
    try {
      // 1. Crear el lead en Firestore
      const docRef = await addDoc(collection(db, "leads"), {
        ...lead,
        estado: "nuevo",
        fecha_creacion: new Date(),
      });

      // 2. Consultar triggers en la colección "secuencias"
      const seqSnapshot = await getDocs(collection(db, "secuencias"));
      const allTriggers = seqSnapshot.docs.map((docSnap) => docSnap.data().trigger);

      // 3. Agregar secuencias activas si la etiqueta coincide con algún trigger
      const secuenciasAAgregar = [];
      lead.etiquetas.forEach((tag) => {
        if (allTriggers.includes(tag)) {
          secuenciasAAgregar.push({
            trigger: tag,
            startTime: new Date().toISOString(),
            index: 0,
          });
        }
      });

      const leadRef = doc(db, "leads", docRef.id);
      for (const secObj of secuenciasAAgregar) {
        await updateDoc(leadRef, {
          secuenciasActivas: arrayUnion(secObj),
        });
      }
      setSubmitted(true);
      message.success("Lead guardado correctamente");
    } catch (error) {
      console.error("Error al guardar el lead:", error);
      message.error("Error al guardar el lead");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card style={{ maxWidth: 500, margin: "auto", marginTop: 50, textAlign: "center" }}>
        <h2>¡Gracias por registrarte!</h2>
        <p>En breve recibirás tu estrategia personalizada en tu WhatsApp.</p>
      </Card>
    );
  }

  const progress = Math.round((currentStep / totalSteps) * 100);

  return (
    <Card style={{ maxWidth: 500, margin: "auto", marginTop: 50 }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Obtén tu Estrategia Gratis</h2>

      {/* Barra de Progreso */}
      <Progress percent={progress} showInfo={false} style={{ marginBottom: 24 }} />

      <Form
        form={form}
        layout="vertical"
        initialValues={lead}
        onValuesChange={handleFormValuesChange}
        onFinish={handleSubmit}
      >
        {currentStep === 1 && (
          <>
            <Form.Item
              label="Nombre del negocio"
              name="negocio"
              rules={[{ required: true, message: "Ingresa el nombre del negocio" }]}
            >
              <Input placeholder="Nombre del negocio" />
            </Form.Item>
            <Form.Item
              label="Giro del negocio"
              name="giro"
              rules={[{ required: true, message: "Ingresa el giro del negocio" }]}
            >
              <Input placeholder="Ej: Restaurante, Moda, Tecnología" />
            </Form.Item>
            <Form.Item
              label="Descripción del negocio"
              name="descripcion"
              rules={[{ required: true, message: "Ingresa la descripción del negocio" }]}
            >
              <Input.TextArea rows={4} placeholder="Describe tus productos, servicios y objetivos" />
            </Form.Item>
          </>
        )}

        {currentStep === 2 && (
          <>
            <Form.Item
              label="Nombre"
              name="nombre"
              rules={[{ required: true, message: "Ingresa tu nombre" }]}
            >
              <Input placeholder="Tu nombre" />
            </Form.Item>
            <Form.Item
              label="Teléfono"
              name="telefono"
              rules={[{ required: true, message: "Ingresa tu teléfono" }]}
            >
              <Input placeholder="Teléfono" />
            </Form.Item>
            {phoneExists && (
              <Alert
                message="Este número ya está registrado."
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
          </>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          {currentStep > 1 && (
            <Button onClick={prevStep}>
              Anterior
            </Button>
          )}
          {currentStep < totalSteps ? (
            <Button type="primary" onClick={nextStep}>
              Siguiente
            </Button>
          ) : (
            <Button type="primary" htmlType="submit" loading={loading} disabled={phoneExists}>
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          )}
        </div>
      </Form>
    </Card>
  );
};

export default LeadForm;
