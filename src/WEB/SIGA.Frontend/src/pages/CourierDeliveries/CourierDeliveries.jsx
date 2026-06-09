import { useEffect, useMemo, useState } from "react";
import { getDeliveriesByCourierId } from "../../services/deliveryService";
import "./CourierDeliveries.css";

function formatDate(date) {
    if (!date) {
        return "Não informado";
    }

    return new Date(date).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    });
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

function getDeliveryDescription(delivery) {
    if (delivery?.trackingCode) {
        return `Entrega ${delivery.trackingCode}`;
    }

    if (delivery?.orderId) {
        return `Pedido ${delivery.orderId}`;
    }

    return "Entrega atribuída";
}

function buildOrderPayloadFromDelivery(delivery) {
    return {
        id: delivery.orderId,
        status: delivery.status,
        createdAt: delivery.createdAt,
        totalPrice: 0,
        items: [
            {
                name: getDeliveryDescription(delivery),
            },
        ],
    };
}

export default function CourierDeliveries({ loggedUser, onNavigate }) {
    const [deliveries, setDeliveries] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const courierId = loggedUser?.id;

    useEffect(() => {
        async function loadDeliveries() {
            if (!courierId) {
                setMessage("Entregador não identificado.");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setMessage("");

                const result = await getDeliveriesByCourierId(courierId);
                setDeliveries(result?.data || []);
            } catch (error) {
                console.error("Erro ao carregar entregas do entregador:", error);
                setMessage(error.message || "Não foi possível carregar suas entregas.");
            } finally {
                setIsLoading(false);
            }
        }

        loadDeliveries();
    }, [courierId]);

    const filteredDeliveries = useMemo(() => {
        return deliveries.filter((delivery) => {
            const description = getDeliveryDescription(delivery).toLowerCase();
            const orderId = String(delivery.orderId || "").toLowerCase();
            const trackingCode = String(delivery.trackingCode || "").toLowerCase();
            const term = searchTerm.trim().toLowerCase();

            const matchesSearch =
                !term ||
                description.includes(term) ||
                orderId.includes(term) ||
                trackingCode.includes(term);

            const matchesStatus =
                statusFilter === "ALL" || delivery.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [deliveries, searchTerm, statusFilter]);

    return (
        <div className="courier-deliveries-page">
            <div className="courier-deliveries-title-row">
                <div>
                    <span className="courier-deliveries-subtitle">
                        Área do entregador
                    </span>
                    <h1>Minhas Entregas</h1>
                    <p>Consulte as entregas atribuídas ao seu usuário.</p>
                </div>
            </div>

            <section className="courier-deliveries-filters">
                <label>
                    <span>Buscar</span>
                    <input
                        type="text"
                        placeholder="Código de rastreio ou ID do pedido"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </label>

                <label>
                    <span>Status</span>
                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                    >
                        <option value="ALL">Todos</option>
                        <option value="CREATED">Criado</option>
                        <option value="POSTED">Postado</option>
                        <option value="IN_TRANSIT">Em trânsito</option>
                        <option value="OUT_FOR_DELIVERY">Saiu para entrega</option>
                        <option value="DELIVERED">Entregue</option>
                        <option value="CANCELED">Cancelado</option>
                    </select>
                </label>
            </section>

            {message && <div className="courier-deliveries-alert">{message}</div>}

            {isLoading ? (
                <div className="courier-deliveries-loading">
                    Carregando suas entregas...
                </div>
            ) : (
                <section className="courier-deliveries-panel">
                    <div className="courier-deliveries-panel-header">
                        <div>
                            <h2>Entregas atribuídas</h2>
                            <p>
                                Mostrando {filteredDeliveries.length} de{" "}
                                {deliveries.length} entrega(s).
                            </p>
                        </div>
                    </div>

                    {filteredDeliveries.length === 0 ? (
                        <div className="courier-deliveries-empty">
                            Nenhuma entrega encontrada para os filtros informados.
                        </div>
                    ) : (
                        <div className="courier-deliveries-table">
                            <div className="courier-deliveries-table-head">
                                <span>Rastreio</span>
                                <span>Pedido</span>
                                <span>Destino</span>
                                <span>Status</span>
                                <span>Data</span>
                                <span>Ações</span>
                            </div>

                            {filteredDeliveries.map((delivery) => (
                                <div
                                    className="courier-deliveries-table-row"
                                    key={delivery.id}
                                >
                                    <strong>
                                        {delivery.trackingCode || "Sem código"}
                                    </strong>

                                    <span className="courier-deliveries-order-id">
                                        #{delivery.orderId}
                                    </span>

                                    <span>{formatAddress(delivery.address)}</span>

                                    <span className="courier-deliveries-status-badge">
                                        {formatStatus(delivery.status)}
                                    </span>

                                    <span>{formatDate(delivery.createdAt)}</span>

                                    <button
                                        type="button"
                                        className="courier-deliveries-details-button"
                                        onClick={() =>
                                            onNavigate(
                                                "shipment-details",
                                                buildOrderPayloadFromDelivery(delivery)
                                            )
                                        }
                                    >
                                        Ver detalhes
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}