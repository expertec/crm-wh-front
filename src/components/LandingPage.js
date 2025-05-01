import React from "react";
import { Layout, Row, Col, Card, Typography } from "antd";
import LeadForm from "./LeadForm";

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

const LandingPage = () => {
  return (
    <Layout>
      <Header
        style={{
          background: "linear-gradient(to right, #1e3a8a, #6b21a8)",
          padding: "40px 0",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center", color: "#fff" }}>
          <Title style={{ color: "#fff", marginBottom: 24 }} level={1}>
            Potencia tus Redes Sociales
          </Title>
          <Paragraph style={{ color: "#fff", fontSize: 18, marginBottom: 40 }}>
            Regístrate y recibe GRATIS tu estrategia mensual personalizada para tu negocio.
          </Paragraph>
          <div style={{ marginTop: 20 }}>
            <LeadForm />
          </div>
        </div>
      </Header>
      <Content style={{ background: "#fff", padding: "40px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Title level={2}>¿Por qué elegirnos?</Title>
            <Paragraph style={{ fontSize: 18, color: "#595959" }}>
              Nuestra experiencia en marketing digital y redes sociales te ayudará a captar más clientes y aumentar tus ventas.
            </Paragraph>
          </div>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card bordered={false} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    margin: "0 auto",
                    backgroundColor: "#4f46e5",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 32, height: 32, color: "#fff" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <Title level={4} style={{ marginTop: 16 }}>
                  Estrategia Personalizada
                </Title>
                <Paragraph>
                  Analizamos tu negocio y diseñamos un plan adaptado a tus necesidades.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card bordered={false} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    margin: "0 auto",
                    backgroundColor: "#4f46e5",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 32, height: 32, color: "#fff" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
                  </svg>
                </div>
                <Title level={4} style={{ marginTop: 16 }}>
                  Entrega Rápida
                </Title>
                <Paragraph>
                  Recibe tu estrategia en PDF directamente a tu WhatsApp en minutos.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card bordered={false} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    margin: "0 auto",
                    backgroundColor: "#4f46e5",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 32, height: 32, color: "#fff" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 20l9-5-9-5-9 5 9 5z" />
                  </svg>
                </div>
                <Title level={4} style={{ marginTop: 16 }}>
                  Soporte Profesional
                </Title>
                <Paragraph>
                  Te acompañamos en cada paso para asegurar el éxito de tu estrategia.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
      <Footer style={{ background: "#1f2937", textAlign: "center", padding: "20px", color: "#fff" }}>
        © 2025 Tu Empresa. Todos los derechos reservados.
      </Footer>
    </Layout>
  );
};

export default LandingPage;
