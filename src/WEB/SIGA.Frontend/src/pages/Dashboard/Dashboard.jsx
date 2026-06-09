import { useEffect, useMemo, useState } from "react";
import { getOrdersByCompanyId } from "../../services/orderService";
import "./Dashboard.css";

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

export default function Dashboard({ loggedUser, onNavigate }) {
    const [orders, setOrders] = useState([]);
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
                setOrders(result?.data || []);
            } catch (error) {
                console.error("Erro ao carregar pedidos da empresa:", error);
                setMessage("Não foi possível carregar os dados do Dashboard.");
            } finally {
                setIsLoading(false);
            }
        }

        loadOrders();
    }, [companyId]);

    const dashboardData = useMemo(() => {
        const sortedOrders = [...orders].sort((first, second) => {
            return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
        });

        const totalOrders = orders.length;

        const inTransit = orders.filter((order) =>
            ["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(order.status)
        ).length;

        const delivered = orders.filter(
            (order) => order.status === "DELIVERED"
        ).length;

        const pending = orders.filter((order) =>
            ["CREATED", "POSTED"].includes(order.status)
        ).length;

        const recentOrders = sortedOrders.slice(0, 5);

        return {
            totalOrders,
            inTransit,
            delivered,
            pending,
            recentOrders,
        };
    }, [orders]);

    return (
        <div className="dashboard-page">
            <div className="dashboard-title-row">
                <div>
                    <span className="dashboard-subtitle">Área da empresa</span>
                    <h1>Dashboard</h1>
                </div>

                <button
                    type="button"
                    className="dashboard-primary-button"
                    onClick={() => onNavigate("new-shipment")}
                >
                    + Nova Encomenda
                </button>
            </div>

            {message && <div className="dashboard-alert">{message}</div>}

            {isLoading ? (
                <div className="dashboard-loading">Carregando dados...</div>
            ) : (
                <>
                    <section className="dashboard-cards-grid">
                        <DashboardCard
                            icon="📦"
                            label="Total de encomendas"
                            value={dashboardData.totalOrders}
                        />

                        <DashboardCard
                            icon="🚚"
                            label="Em trânsito"
                            value={dashboardData.inTransit}
                        />

                        <DashboardCard
                            icon="✅"
                            label="Entregues"
                            value={dashboardData.delivered}
                        />

                        <DashboardCard
                            icon="⏳"
                            label="Pendentes"
                            value={dashboardData.pending}
                        />
                    </section>

                    <section className="dashboard-grid">
                        <div className="dashboard-panel">
                            <div className="dashboard-panel-header">
                                <div>
                                    <h2>Encomendas recentes</h2>
                                    <p>Últimos pedidos cadastrados pela empresa.</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onNavigate("shipments")}
                                >
                                    Ver todas
                                </button>
                            </div>

                            {dashboardData.recentOrders.length === 0 ? (
                                <div className="dashboard-empty">
                                    Nenhuma encomenda cadastrada ainda.
                                </div>
                            ) : (
                                <div className="dashboard-orders-list">
                                    {dashboardData.recentOrders.map((order) => (
                                        <div
                                            className="dashboard-order-item"
                                            key={order.id}
                                        >
                                            <div>
                                                <strong>{getOrderDescription(order)}</strong>
                                                <span>Pedido #{order.id}</span>
                                            </div>

                                            <span className="dashboard-status-badge">
                                                {formatStatus(order.status)}
                                            </span>

                                            <span className="dashboard-order-date">
                                                {formatDate(order.createdAt)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="dashboard-panel">
                            <h2>Resumo operacional</h2>

                            <div className="dashboard-summary-list">
                                <SummaryItem
                                    label="Pedidos pendentes"
                                    value={dashboardData.pending}
                                />

                                <SummaryItem
                                    label="Pedidos em andamento"
                                    value={dashboardData.inTransit}
                                />

                                <SummaryItem
                                    label="Pedidos entregues"
                                    value={dashboardData.delivered}
                                />
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

function DashboardCard({ icon, label, value }) {
    return (
        <div className="dashboard-card">
            <div className="dashboard-card-header">
                <span>{icon}</span>
                <strong>{label}</strong>
            </div>

            <div className="dashboard-card-value">{value}</div>
        </div>
    );
}

function SummaryItem({ label, value }) {
    return (
        <div className="dashboard-summary-item">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}