import { useEffect, useMemo, useState } from "react";
import { getOrdersByCompanyId } from "../../services/orderService";
import "./AdminCompanyDetails.css";

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

function formatAddress(address) {
    if (!address) {
        return "Endereço não informado";
    }

    return [address.street, address.number, address.neighborhood, address.city, address.state]
        .filter(Boolean)
        .join(", ");
}

export default function AdminCompanyDetails({ selectedCompany, onNavigate }) {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const companyId = selectedCompany?.id;

    useEffect(() => {
        async function loadCompanyOrders() {
            if (!companyId) {
                setMessage("Nenhuma empresa selecionada.");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setMessage("");

                const result = await getOrdersByCompanyId(companyId);
                setOrders(result?.data || []);
            } catch (error) {
                console.error("Erro ao carregar encomendas da empresa:", error);
                setMessage("Não foi possível carregar as encomendas desta empresa.");
            } finally {
                setIsLoading(false);
            }
        }

        loadCompanyOrders();
    }, [companyId]);

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const description = getOrderDescription(order).toLowerCase();
            const orderId = String(order.id || "").toLowerCase();
            const term = searchTerm.trim().toLowerCase();

            const matchesSearch =
                !term || description.includes(term) || orderId.includes(term);

            const matchesStatus =
                statusFilter === "ALL" || order.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    return (
        <div className="admin-company-page">
            <div className="admin-company-title-row">
                <div>
                    <span className="admin-company-subtitle">Área administrativa</span>
                    <h1>{selectedCompany?.name || "Empresa"}</h1>
                    <p>{formatAddress(selectedCompany?.address)}</p>
                </div>

                <button
                    type="button"
                    className="admin-company-secondary-button"
                    onClick={() => onNavigate("admin-companies")}
                >
                    Voltar para empresas
                </button>
            </div>

            <section className="admin-company-actions">
                <button
                    type="button"
                    onClick={() => onNavigate("admin-couriers", selectedCompany)}
                >
                    Ver entregadores
                </button>

                <button
                    type="button"
                    onClick={() => onNavigate("reports")}
                >
                    Relatórios
                </button>
            </section>

            <section className="admin-company-filters">
                <label>
                    <span>Buscar</span>
                    <input
                        type="text"
                        placeholder="Descrição ou ID do pedido"
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

            {message && <div className="admin-company-alert">{message}</div>}

            {isLoading ? (
                <div className="admin-company-loading">Carregando encomendas...</div>
            ) : (
                <section className="admin-company-panel">
                    <div className="admin-company-panel-header">
                        <div>
                            <h2>Encomendas da empresa</h2>
                            <p>
                                Mostrando {filteredOrders.length} de {orders.length} pedido(s).
                            </p>
                        </div>
                    </div>

                    {filteredOrders.length === 0 ? (
                        <div className="admin-company-empty">
                            Nenhuma encomenda encontrada para esta empresa.
                        </div>
                    ) : (
                        <div className="admin-company-table">
                            <div className="admin-company-table-head">
                                <span>Pedido</span>
                                <span>Descrição</span>
                                <span>Status</span>
                                <span>Valor</span>
                                <span>Data</span>
                                <span>Ações</span>
                            </div>

                            {filteredOrders.map((order) => (
                                <div className="admin-company-table-row" key={order.id}>
                                    <span className="admin-company-order-id">#{order.id}</span>
                                    <strong>{getOrderDescription(order)}</strong>
                                    <span className="admin-company-status-badge">
                                        {formatStatus(order.status)}
                                    </span>
                                    <span>{formatCurrency(order.totalPrice)}</span>
                                    <span>{formatDate(order.createdAt)}</span>

                                    <button
                                        type="button"
                                        onClick={() => onNavigate("shipment-details", order)}
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