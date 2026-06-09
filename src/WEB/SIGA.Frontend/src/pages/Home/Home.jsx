import { useState } from "react";
import { getDeliveryTracking } from "../../services/trackingService";
import "./Home.css";

function formatDate(date) {
  if (!date) {
    return "Não informado";
  }

  return new Date(date).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatDateOnly(date) {
  if (!date) {
    return "Não informado";
  }

  const datePart = String(date).split("T")[0];
  const [year, month, day] = datePart.split("-");

  if (!year || !month || !day) {
    return "Não informado";
  }

  return `${day}/${month}/${year}`;
}

function formatStatus(status) {
  const statusMap = {
    CREATED: "Encomenda criada",
    POSTED: "Postada",
    IN_TRANSIT: "Em trânsito",
    OUT_FOR_DELIVERY: "Saiu para entrega",
    DELIVERED: "Entregue",
    CANCELED: "Cancelada",
  };

  return statusMap[status] || status || "Não informado";
}

function formatAddress(address) {
  if (!address) {
    return "Endereço não informado";
  }

  const parts = [
    address.street,
    address.number,
    address.neighborhood,
    address.city,
    address.state,
    address.postalCode,
  ].filter(Boolean);

  return parts.join(", ");
}

export default function Home({ onLoginClick, onRegisterClick }) {
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleTrackingSubmit(event) {
    event.preventDefault();

    setMessage("");
    setTrackingResult(null);

    if (!trackingCode.trim()) {
      setMessage("Informe o código de rastreio.");
      return;
    }

    try {
      setIsLoading(true);

      const result = await getDeliveryTracking(trackingCode);
      setTrackingResult(result);
    } catch (error) {
      setMessage(error.message || "Não foi possível rastrear a encomenda.");
    } finally {
      setIsLoading(false);
    }
  }

  const delivery = trackingResult?.delivery;
  const events = trackingResult?.events || [];

  return (
    <main className="home-page">
      <header className="home-header">
        <div className="home-brand">
          <div className="home-logo">
            <img src="/siga-logo.png" alt="Logo SIGA" />
          </div>

          <div>
            <span className="home-brand-name">SIGA</span>
            <span className="home-brand-subtitle">
              Sistema de Gestão de Entregas
            </span>
          </div>
        </div>

        <div className="home-actions">
          <button type="button" className="home-link-button" onClick={onRegisterClick}>
            Cadastre sua empresa
          </button>

          <button type="button" className="home-login-button" onClick={onLoginClick}>
            Entrar
          </button>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-kicker">Rastreio público</span>

          <h1>
            Rastreie suas encomendas de forma rápida, simples e segura.
          </h1>

          <p>
            Digite o código de rastreio informado pela empresa para acompanhar
            o status e o histórico registrado da sua entrega.
          </p>

          <form className="home-search-card" onSubmit={handleTrackingSubmit}>
            <label htmlFor="trackingCode">Código de rastreio</label>

            <div className="home-search-row">
              <input
                id="trackingCode"
                type="text"
                placeholder="Ex: SIGA-2026-515924"
                value={trackingCode}
                onChange={(event) => setTrackingCode(event.target.value)}
              />

              <button type="submit" disabled={isLoading}>
                {isLoading ? "Buscando..." : "Rastrear"}
              </button>
            </div>

            {message && <p className="home-message">{message}</p>}
          </form>
        </div>

        <div className="home-info-card">
          <div className="home-info-icon">📦</div>
          <h2>Como funciona?</h2>

          <div className="home-steps">
            <div>
              <strong>1</strong>
              <span>Digite o código</span>
            </div>

            <div>
              <strong>2</strong>
              <span>Consulte o status</span>
            </div>

            <div>
              <strong>3</strong>
              <span>Acompanhe os eventos</span>
            </div>
          </div>
        </div>
      </section>

      {delivery && (
        <section className="home-result">
          <div className="home-result-header">
            <div>
              <span className="home-kicker">Resultado do rastreio</span>
              <h2>{delivery.trackingCode}</h2>
            </div>

            <span className="home-status-badge">
              {formatStatus(delivery.status)}
            </span>
          </div>

          <div className="home-result-grid">
            <InfoItem label="Transportadora" value={delivery.carrier || "Não informado"} />
            <InfoItem label="Data" value={formatDateOnly(delivery.postingDate)} />
            <InfoItem label="Origem" value={formatAddress(delivery.originAddress)} />
            <InfoItem label="Destino" value={formatAddress(delivery.address)} />
          </div>

          <div className="home-timeline">
            <h3>Histórico da encomenda</h3>

            {events.length === 0 ? (
              <p className="home-empty-events">
                Ainda não há eventos registrados para essa entrega.
              </p>
            ) : (
              <div className="home-events-list">
                {events.map((event) => (
                  <div className="home-event-item" key={event.id}>
                    <div className="home-event-marker"></div>

                    <div>
                      <strong>{formatStatus(event.status)}</strong>
                      <p>{event.description || "Evento registrado."}</p>
                      <span>{formatDate(event.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="home-info-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}