import { useEffect, useMemo, useState } from "react";
import { getCompanies } from "../../services/companyService";
import { getDeliveryByOrderId } from "../../services/deliveryService";
import { getOrders, getOrdersByCompanyId } from "../../services/orderService";
import "./UnassignedShipments.css";

function normalizeRole(role) {
    return String(role || "").trim().toLowerCase();
}

function isAdminUser(user) {
    return normalizeRole(user?.role) === "admin";
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

function getOrderDescription(order) {
    const firstItem = order?.items?.[0];

    if (!firstItem) {
        return "Pedido sem item informado";
    }

    return firstItem.name || "Item sem descrição";
}

function getCompanyName(companyMap, companyId) {
    if (!companyId) {
        return "Empresa não informada";
    }

    return companyMap[companyId]?.name || companyId;
}

export default function UnassignedShipments({ loggedUser, onNavigate }) {
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState("ALL");
    const [shipments, setShipments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

    const isAdmin = isAdminUser(loggedUser);
    const loggedCompanyId = loggedUser?.companyId;

    const companyMap = useMemo(() => {
        return companies.reduce((accumulator, company) => {
            accumulator[company.id] = company;
            return accumulator;
        }, {});
    }, [companies]);

    useEffect(() => {
        async function loadCompanies() {
            if (!isAdmin) {
                return;
            }

            try {
                setIsLoadingCompanies(true);

                const result = await getCompanies();
                setCompanies(result?.data || []);
            } catch (error) {
                console.error("Erro ao carregar empresas:", error);
                setMessage("Não foi possível carregar as empresas.");
            } finally {
                setIsLoadingCompanies(false);
            }
        }

        loadCompanies();
    }, [isAdmin]);

    useEffect(() => {
        async function loadUnassignedShipments() {
            try {
                setIsLoading(true);
                setMessage("");

                let ordersResult;

                if (isAdmin) {
                    ordersResult =
                        selectedCompanyId === "ALL"
                            ? await getOrders()
                            : await getOrdersByCompanyId(selectedCompanyId);
                } else {
                    if (!loggedCompanyId) {
                        setMessage("Usuário sem empresa vinculada.");
                        setShipments([]);
                        return;
                    }

                    ordersResult = await getOrdersByCompanyId(loggedCompanyId);
                }

                const orders = ordersResult?.data || [];

                const detailsResults = await Promise.allSettled(
                    orders.map(async (order) => {
                        const deliveryResult = await getDeliveryByOrderId(order.id);
                        const delivery = deliveryResult?.data?.delivery;

                        if (!delivery) {
                            return null;
                        }

                        if (delivery.courierId) {
                            return null;
                        }

                        return {
                            order,
                            delivery,
                        };
                    })
                );

                const unassigned = detailsResults
                    .filter((result) => result.status === "fulfilled" && result.value)
                    .map((result) => result.value);

                setShipments(unassigned);
            } catch (error) {
                console.error("Erro ao carregar encomendas sem entregador:", error);
                setMessage(
                    error.message ||
                        "Não foi possível carregar as encomendas sem entregador."
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadUnassignedShipments();
    }, [isAdmin, selectedCompanyId, loggedCompanyId]);

    const filteredShipments = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return shipments.filter(({ order, delivery }) => {
            const description = getOrderDescription(order).toLowerCase();
            const orderId = String(order.id || "").toLowerCase();
            const trackingCode = String(delivery.trackingCode || "").toLowerCase();
            const companyName = getCompanyName(companyMap, order.companyId).toLowerCase();

            const matchesSearch =
                !term ||
                description.includes(term) ||
                orderId.includes(term) ||
                trackingCode.includes(term) ||
                companyName.includes(term);

            const matchesStatus =
                statusFilter === "ALL" || delivery.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [shipments, searchTerm, statusFilter, companyMap]);

    return (
        <div className="unassigned-page">
            <div className="unassigned-title-row">
                <div>
                    <span className="unassigned-subtitle">Operação</span>
                    <h1>Encomendas sem entregador</h1>
                    <p>
                        Consulte entregas que ainda precisam de um entregador
                        responsável.
                    </p>
                </div>
            </div>

            {message && <div className="unassigned-alert">{message}</div>}

            <section className="unassigned-filters">
                {isAdmin && (
                    <label>
                        <span>Empresa</span>

                        <select
                            value={selectedCompanyId}
                            onChange={(event) =>
                                setSelectedCompanyId(event.target.value)
                            }
                            disabled={isLoadingCompanies}
                        >
                            <option value="ALL">
                                {isLoadingCompanies
                                    ? "Carregando empresas..."
                                    : "Todas as empresas"}
                            </option>

                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name} — {company.cnpj || "CNPJ não informado"}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                <label>
                    <span>Buscar</span>

                    <input
                        type="text"
                        placeholder="Código de rastreio, pedido, descrição ou empresa"
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

            {isLoading ? (
                <div className="unassigned-loading">
                    Carregando encomendas sem entregador...
                </div>
            ) : (
                <section className="unassigned-panel">
                    <div className="unassigned-panel-header">
                        <div>
                            <h2>Entregas pendentes de atribuição</h2>
                            <p>
                                Mostrando {filteredShipments.length} de{" "}
                                {shipments.length} entrega(s) sem entregador.
                            </p>
                        </div>
                    </div>

                    {filteredShipments.length === 0 ? (
                        <div className="unassigned-empty">
                            Nenhuma encomenda sem entregador encontrada.
                        </div>
                    ) : (
                        <div className="unassigned-table">
                            <div className="unassigned-table-head">
                                <span>Rastreio</span>
                                <span>Empresa</span>
                                <span>Descrição</span>
                                <span>Status</span>
                                <span>Destino</span>
                                <span>Data</span>
                                <span>Ações</span>
                            </div>

                            {filteredShipments.map(({ order, delivery }) => (
                                <div
                                    className="unassigned-table-row"
                                    key={delivery.id || order.id}
                                >
                                    <strong>
                                        {delivery.trackingCode || "Sem rastreio"}
                                    </strong>

                                    <span>
                                        {getCompanyName(companyMap, order.companyId)}
                                    </span>

                                    <span>{getOrderDescription(order)}</span>

                                    <span className="unassigned-status-badge">
                                        {formatStatus(delivery.status)}
                                    </span>

                                    <span>{formatAddress(delivery.address)}</span>

                                    <span>{formatDate(delivery.createdAt)}</span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            onNavigate("shipment-details", order)
                                        }
                                    >
                                        Atribuir
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