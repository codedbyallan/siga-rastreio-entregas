import { useEffect, useMemo, useState } from "react";
import { getCompanies } from "../../services/companyService";
import { getOrders } from "../../services/orderService";
import "./AdminDashboard.css";

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
    ]
        .filter(Boolean)
        .join(", ");
}

function getOrderedCompanies(companies) {
    const hasCreatedAt = companies.some((company) => company.createdAt);

    if (!hasCreatedAt) {
        return [...companies].reverse();
    }

    return [...companies].sort((first, second) => {
        const firstDate = new Date(first.createdAt || 0).getTime();
        const secondDate = new Date(second.createdAt || 0).getTime();

        return secondDate - firstDate;
    });
}

export default function AdminDashboard({ onNavigate }) {
    const [companies, setCompanies] = useState([]);
    const [orders, setOrders] = useState([]);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadAdminData() {
            try {
                setIsLoading(true);
                setMessage("");

                const [companiesResult, ordersResult] = await Promise.all([
                    getCompanies(),
                    getOrders(),
                ]);

                setCompanies(companiesResult?.data || []);
                setOrders(ordersResult?.data || []);
            } catch (error) {
                console.error("Erro ao carregar painel admin:", error);
                setMessage("Não foi possível carregar os dados administrativos.");
            } finally {
                setIsLoading(false);
            }
        }

        loadAdminData();
    }, []);

    const dashboardData = useMemo(() => {
        const totalOrders = orders.length;
        const inTransit = orders.filter((order) =>
            ["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(order.status)
        ).length;
        const delivered = orders.filter((order) => order.status === "DELIVERED").length;
        const pending = orders.filter((order) =>
            ["CREATED", "POSTED"].includes(order.status)
        ).length;

        const ordersByCompany = orders.reduce((accumulator, order) => {
            const companyId = order.companyId || "sem-empresa";
            accumulator[companyId] = (accumulator[companyId] || 0) + 1;
            return accumulator;
        }, {});

        const latestCompanies = getOrderedCompanies(companies).slice(0, 5);

        return {
            totalCompanies: companies.length,
            totalOrders,
            inTransit,
            delivered,
            pending,
            ordersByCompany,
            latestCompanies,
        };
    }, [companies, orders]);

    return (
        <div className="admin-dashboard-page">
            <div className="admin-dashboard-title-row">
                <div>
                    <span className="admin-dashboard-subtitle">
                        Área administrativa
                    </span>

                    <h1>Painel Admin</h1>

                    <p>Visão geral das empresas e encomendas cadastradas no SIGA.</p>
                </div>

                <div className="admin-dashboard-actions">
                    <button
                        type="button"
                        onClick={() => onNavigate("admin-companies")}
                    >
                        Ver empresas
                    </button>

                    <button
                        type="button"
                        onClick={() => onNavigate("reports")}
                    >
                        Relatórios
                    </button>

                </div>
            </div>

            {message && <div className="admin-dashboard-alert">{message}</div>}

            {isLoading ? (
                <div className="admin-dashboard-loading">Carregando dados...</div>
            ) : (
                <>
                    <section className="admin-dashboard-cards-grid">
                        <AdminCard
                            label="Empresas"
                            value={dashboardData.totalCompanies}
                            icon="🏢"
                        />

                        <AdminCard
                            label="Encomendas"
                            value={dashboardData.totalOrders}
                            icon="📦"
                        />

                        <AdminCard
                            label="Em trânsito"
                            value={dashboardData.inTransit}
                            icon="🚚"
                        />

                        <AdminCard
                            label="Entregues"
                            value={dashboardData.delivered}
                            icon="✅"
                        />
                    </section>

                    <section className="admin-dashboard-panel">
                        <div className="admin-dashboard-panel-header">
                            <div>
                                <h2>Últimas empresas cadastradas</h2>

                                <p>
                                    Exibindo as empresas mais recentes. A lista completa
                                    fica na tela Empresas.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => onNavigate("admin-companies")}
                            >
                                Ver todas
                            </button>
                        </div>

                        {dashboardData.latestCompanies.length === 0 ? (
                            <div className="admin-dashboard-empty">
                                Nenhuma empresa cadastrada.
                            </div>
                        ) : (
                            <div className="admin-company-list compact">
                                {dashboardData.latestCompanies.map((company) => (
                                    <div
                                        className="admin-company-item"
                                        key={company.id}
                                    >
                                        <div>
                                            <strong>
                                                {company.name || "Empresa sem nome"}
                                            </strong>

                                            <span>
                                                CNPJ:{" "}
                                                {company.cnpj || "Não informado"}
                                            </span>

                                            <span>{formatAddress(company.address)}</span>
                                        </div>

                                        <div className="admin-company-stats">
                                            <span>
                                                {dashboardData.ordersByCompany[
                                                    company.id
                                                ] || 0}{" "}
                                                encomenda(s)
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onNavigate(
                                                        "admin-company-details",
                                                        company
                                                    )
                                                }
                                            >
                                                Ver encomendas
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="admin-dashboard-panel">
                        <div className="admin-dashboard-panel-header">
                            <div>
                                <h2>Resumo por status</h2>

                                <p>Indicadores operacionais gerais do sistema.</p>
                            </div>
                        </div>

                        <div className="admin-status-grid">
                            {[
                                "CREATED",
                                "POSTED",
                                "IN_TRANSIT",
                                "OUT_FOR_DELIVERY",
                                "DELIVERED",
                                "CANCELED",
                            ].map((status) => (
                                <div className="admin-status-item" key={status}>
                                    <span>{formatStatus(status)}</span>

                                    <strong>
                                        {
                                            orders.filter(
                                                (order) => order.status === status
                                            ).length
                                        }
                                    </strong>
                                </div>
                            ))}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

function AdminCard({ label, value, icon }) {
    return (
        <div className="admin-dashboard-card">
            <div className="admin-dashboard-card-header">
                <span>{icon}</span>
                <strong>{label}</strong>
            </div>

            <div className="admin-dashboard-card-value">{value}</div>
        </div>
    );
}