import { useEffect, useMemo, useState } from "react";
import { getDeliveryByOrderId } from "../../services/deliveryService";
import { getOrdersByCompanyId } from "../../services/orderService";
import "./Shipments.css";

function formatCurrency(value) {
    const numberValue = Number(value) || 0;

    return numberValue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

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

function getOrderDescription(order) {
    const firstItem = order?.items?.[0];

    if (!firstItem) {
        return "Pedido sem item informado";
    }

    return firstItem.name || "Item sem descrição";
}

function hasCourier(row) {
    return Boolean(row?.delivery?.courierId);
}

export default function Shipments({ loggedUser, onNavigate }) {
    const [shipmentRows, setShipmentRows] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [assignmentFilter, setAssignmentFilter] = useState("ALL");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const companyId = loggedUser?.companyId;

    useEffect(() => {
        async function loadOrders() {
            if (!companyId) {
                setMessage("Usuário sem empresa vinculada.");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setMessage("");

                const result = await getOrdersByCompanyId(companyId);
                const orders = result?.data || [];

                const deliveryResults = await Promise.allSettled(
                    orders.map(async (order) => {
                        const deliveryResult = await getDeliveryByOrderId(order.id);

                        return {
                            order,
                            delivery: deliveryResult?.data?.delivery || null,
                        };
                    })
                );

                const rows = deliveryResults
                    .filter((item) => item.status === "fulfilled" && item.value)
                    .map((item) => item.value);

                setShipmentRows(rows);
            } catch (error) {
                console.error("Erro ao carregar encomendas:", error);
                setMessage("Não foi possível carregar as encomendas da empresa.");
            } finally {
                setIsLoading(false);
            }
        }

        loadOrders();
    }, [companyId]);

    const dashboardData = useMemo(() => {
        const total = shipmentRows.length;
        const unassigned = shipmentRows.filter((row) => !hasCourier(row)).length;
        const assigned = shipmentRows.filter((row) => hasCourier(row)).length;

        return {
            total,
            assigned,
            unassigned,
        };
    }, [shipmentRows]);

    const filteredRows = useMemo(() => {
        return shipmentRows.filter(({ order, delivery }) => {
            const description = getOrderDescription(order).toLowerCase();
            const orderId = String(order.id || "").toLowerCase();
            const trackingCode = String(delivery?.trackingCode || "").toLowerCase();
            const term = searchTerm.trim().toLowerCase();

            const matchesSearch =
                !term ||
                description.includes(term) ||
                orderId.includes(term) ||
                trackingCode.includes(term);

            const currentStatus = delivery?.status || order.status;

            const matchesStatus =
                statusFilter === "ALL" || currentStatus === statusFilter;

            const matchesAssignment =
                assignmentFilter === "ALL" ||
                (assignmentFilter === "UNASSIGNED" && !hasCourier({ delivery })) ||
                (assignmentFilter === "ASSIGNED" && hasCourier({ delivery }));

            return matchesSearch && matchesStatus && matchesAssignment;
        });
    }, [shipmentRows, searchTerm, statusFilter, assignmentFilter]);

    return (
        <div className="shipments-page">
            <div className="shipments-title-row">
                <div>
                    <span className="shipments-subtitle">Área da empresa</span>
                    <h1>Minhas Encomendas</h1>
                    <p>Consulte os pedidos cadastrados pela empresa logada.</p>
                </div>

                <button
                    type="button"
                    className="shipments-primary-button"
                    onClick={() => onNavigate("new-shipment")}
                >
                    + Nova Encomenda
                </button>
            </div>

            <section className="shipments-summary-grid">
                <button
                    type="button"
                    className={
                        assignmentFilter === "ALL"
                            ? "shipments-summary-card active"
                            : "shipments-summary-card"
                    }
                    onClick={() => setAssignmentFilter("ALL")}
                >
                    <span>Total de encomendas</span>
                    <strong>{dashboardData.total}</strong>
                    <small>Ver todas</small>
                </button>

                <button
                    type="button"
                    className={
                        assignmentFilter === "UNASSIGNED"
                            ? "shipments-summary-card warning active"
                            : "shipments-summary-card warning"
                    }
                    onClick={() => setAssignmentFilter("UNASSIGNED")}
                >
                    <span>Sem entregador</span>
                    <strong>{dashboardData.unassigned}</strong>
                    <small>Precisam de atribuição</small>
                </button>

                <button
                    type="button"
                    className={
                        assignmentFilter === "ASSIGNED"
                            ? "shipments-summary-card active"
                            : "shipments-summary-card"
                    }
                    onClick={() => setAssignmentFilter("ASSIGNED")}
                >
                    <span>Com entregador</span>
                    <strong>{dashboardData.assigned}</strong>
                    <small>Já atribuídas</small>
                </button>
            </section>

            {dashboardData.unassigned > 0 && (
                <div className="shipments-warning-box">
                    Existem {dashboardData.unassigned} encomenda(s) sem entregador.
                    Clique no card <strong>Sem entregador</strong> para visualizar e
                    atribuir responsáveis.
                </div>
            )}

            <section className="shipments-filters">
                <label>
                    <span>Buscar</span>
                    <input
                        type="text"
                        placeholder="Código de rastreio, descrição ou ID do pedido"
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

            {message && <div className="shipments-alert">{message}</div>}

            {isLoading ? (
                <div className="shipments-loading">Carregando encomendas...</div>
            ) : (
                <section className="shipments-panel">
                    <div className="shipments-panel-header">
                        <div>
                            <h2>
                                {assignmentFilter === "UNASSIGNED"
                                    ? "Encomendas sem entregador"
                                    : assignmentFilter === "ASSIGNED"
                                      ? "Encomendas com entregador"
                                      : "Lista de encomendas"}
                            </h2>

                            <p>
                                Mostrando {filteredRows.length} de{" "}
                                {shipmentRows.length} pedido(s).
                            </p>
                        </div>
                    </div>

                    {filteredRows.length === 0 ? (
                        <div className="shipments-empty">
                            Nenhuma encomenda encontrada para os filtros informados.
                        </div>
                    ) : (
                        <div className="shipments-table">
                            <div className="shipments-table-head">
                                <span>Pedido</span>
                                <span>Descrição</span>
                                <span>Status</span>
                                <span>Entregador</span>
                                <span>Valor</span>
                                <span>Data do pedido</span>
                                <span>Ações</span>
                            </div>

                            {filteredRows.map(({ order, delivery }) => (
                                <div
                                    className="shipments-table-row"
                                    key={order.id}
                                >
                                    <span className="shipments-order-id">
                                        #{order.id}
                                    </span>

                                    <strong>{getOrderDescription(order)}</strong>

                                    <span className="shipments-status-badge">
                                        {formatStatus(delivery?.status || order.status)}
                                    </span>

                                    <span
                                        className={
                                            delivery?.courierId
                                                ? "shipments-courier-badge assigned"
                                                : "shipments-courier-badge unassigned"
                                        }
                                    >
                                        {delivery?.courierId
                                            ? "Atribuído"
                                            : "Sem entregador"}
                                    </span>

                                    <span>{formatCurrency(order.totalPrice)}</span>

                                    <span>{formatDate(order.createdAt)}</span>

                                    <button
                                        type="button"
                                        className="shipments-details-button"
                                        onClick={() =>
                                            onNavigate("shipment-details", order)
                                        }
                                    >
                                        {delivery?.courierId
                                            ? "Ver detalhes"
                                            : "Atribuir"}
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