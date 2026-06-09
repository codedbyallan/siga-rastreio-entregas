import { useState } from "react";
import "./InternalTracking.css";

const DELIVERY_API_BASE_URL =
    import.meta.env.VITE_DELIVERY_API_BASE_URL || "http://localhost:5003";

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
        CREATED: "Criado",
        POSTED: "Postado",
        IN_TRANSIT: "Em trânsito",
        OUT_FOR_DELIVERY: "Saiu para entrega",
        DELIVERED: "Entregue",
        CANCELED: "Cancelado",
    };

    return statusMap[status] || status || "Não informado";
}

function formatAddress(address) {
    if (!address) {
        return "Endereço não informado";
    }

    return [
        address.street,
        address.number,
        address.neighborhood,
        address.city,
        address.state,
        address.postalCode,
    ]
        .filter(Boolean)
        .join(", ");
}

export default function InternalTracking() {
    const [trackingCode, setTrackingCode] = useState("");
    const [trackingData, setTrackingData] = useState(null);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        const cleanCode = trackingCode.trim();

        if (!cleanCode) {
            setMessage("Informe um código de rastreio.");
            setTrackingData(null);
            return;
        }

        try {
            setIsLoading(true);
            setMessage("");
            setTrackingData(null);

            const response = await fetch(
                `${DELIVERY_API_BASE_URL}/api/deliveries/tracking/${encodeURIComponent(cleanCode)}`
            );

            const responseBody = await response.json().catch(() => null);

            if (!response.ok) {
                const errorMessage =
                    responseBody?.errors?.[0]?.errorMessage ||
                    "Encomenda não encontrada para o código informado.";

                throw new Error(errorMessage);
            }

            setTrackingData(responseBody?.data || null);
        } catch (error) {
            console.error("Erro ao rastrear encomenda:", error);
            setMessage(error.message || "Não foi possível rastrear a encomenda.");
        } finally {
            setIsLoading(false);
        }
    }

    const delivery = trackingData?.delivery;
    const events = trackingData?.events || [];

    return (
        <div className="internal-tracking-page">
            <div className="internal-tracking-title-row">
                <div>
                    <span className="internal-tracking-subtitle">
                        Consulta interna
                    </span>

                    <h1>Rastrear Encomenda</h1>

                    <p>
                        Consulte uma encomenda pelo código de rastreio sem sair da
                        área interna do sistema.
                    </p>
                </div>
            </div>

            <section className="internal-tracking-search-card">
                <form onSubmit={handleSubmit} className="internal-tracking-form">
                    <label>
                        <span>Código de rastreio</span>

                        <input
                            type="text"
                            placeholder="Ex: SIGA-2026-123456"
                            value={trackingCode}
                            onChange={(event) => setTrackingCode(event.target.value)}
                        />
                    </label>

                    <button type="submit" disabled={isLoading}>
                        {isLoading ? "Buscando..." : "Rastrear"}
                    </button>
                </form>
            </section>

            {message && <div className="internal-tracking-alert">{message}</div>}

            {delivery && (
                <>
                    <section className="internal-tracking-grid">
                        <div className="internal-tracking-card">
                            <span>Código</span>
                            <strong>{delivery.trackingCode}</strong>
                        </div>

                        <div className="internal-tracking-card">
                            <span>Status</span>
                            <strong>{formatStatus(delivery.status)}</strong>
                        </div>

                        <div className="internal-tracking-card">
                            <span>Transportadora</span>
                            <strong>{delivery.carrier || "Não informado"}</strong>
                        </div>

                        <div className="internal-tracking-card">
                            <span>Data</span>
                            <strong>{formatDateOnly(delivery.postingDate)}</strong>
                        </div>
                    </section>

                    <section className="internal-tracking-panel">
                        <h2>Origem e destino</h2>

                        <div className="internal-tracking-address-grid">
                            <div>
                                <span>Origem</span>
                                <strong>{formatAddress(delivery.originAddress)}</strong>
                            </div>

                            <div>
                                <span>Destino</span>
                                <strong>{formatAddress(delivery.address)}</strong>
                            </div>
                        </div>
                    </section>

                    <section className="internal-tracking-panel">
                        <h2>Histórico</h2>

                        {events.length === 0 ? (
                            <div className="internal-tracking-empty">
                                Nenhum evento registrado.
                            </div>
                        ) : (
                            <div className="internal-tracking-timeline">
                                {events.map((event) => (
                                    <div
                                        className="internal-tracking-event"
                                        key={event.id}
                                    >
                                        <div className="internal-tracking-marker"></div>

                                        <div>
                                            <strong>{formatStatus(event.status)}</strong>
                                            <p>{event.description || "Evento registrado."}</p>
                                            <span>{formatDate(event.createdAt)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}