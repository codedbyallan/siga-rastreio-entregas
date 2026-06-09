import { useEffect, useMemo, useState } from "react";
import { getCompanies } from "../../services/companyService";
import { getDeliveryByOrderId } from "../../services/deliveryService";
import { getOrders, getOrdersByCompanyId } from "../../services/orderService";
import "./Reports.css";

const STATUS_LIST = [
    "CREATED",
    "POSTED",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELED",
];

function normalizeRole(role) {
    return String(role || "").trim().toLowerCase();
}

function isAdminUser(user) {
    return normalizeRole(user?.role) === "admin";
}

function formatCurrency(value) {
    const numberValue = Number(value) || 0;

    return numberValue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
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

function formatDate(date) {
    if (!date) {
        return "Não informado";
    }

    return new Date(date).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    });
}

function getOrderDescription(order) {
    const firstItem = order?.items?.[0];

    if (!firstItem) {
        return "Pedido sem item informado";
    }

    return firstItem.name || "Item sem descrição";
}

function getCurrentStatus(row) {
    return row?.delivery?.status || row?.order?.status || "CREATED";
}

function hasCourier(row) {
    return Boolean(row?.delivery?.courierId);
}

function getCompanyName(companyMap, companyId) {
    if (!companyId) {
        return "Empresa não informada";
    }

    return companyMap[companyId]?.name || companyId;
}

function calculatePercentage(value, total) {
    if (!total) {
        return 0;
    }

    return Math.round((value / total) * 100);
}

export default function Reports({ loggedUser }) {
    const [companies, setCompanies] = useState([]);
    const [rows, setRows] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState("ALL");
    const [selectedStatus, setSelectedStatus] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const isAdmin = isAdminUser(loggedUser);
    const loggedCompanyId = loggedUser?.companyId;

    const companyMap = useMemo(() => {
        return companies.reduce((accumulator, company) => {
            accumulator[company.id] = company;
            return accumulator;
        }, {});
    }, [companies]);

    useEffect(() => {
        async function loadReportsData() {
            try {
                setIsLoading(true);
                setMessage("");

                let companiesResult = { data: [] };
                let ordersResult;

                if (isAdmin) {
                    [companiesResult, ordersResult] = await Promise.all([
                        getCompanies(),
                        getOrders(),
                    ]);
                } else {
                    if (!loggedCompanyId) {
                        setRows([]);
                        setMessage("Usuário sem empresa vinculada.");
                        return;
                    }

                    ordersResult = await getOrdersByCompanyId(loggedCompanyId);
                }

                const loadedCompanies = companiesResult?.data || [];
                const loadedOrders = ordersResult?.data || [];

                const deliveryResults = await Promise.allSettled(
                    loadedOrders.map(async (order) => {
                        const deliveryResult = await getDeliveryByOrderId(order.id);

                        return {
                            order,
                            delivery: deliveryResult?.data?.delivery || null,
                        };
                    })
                );

                const loadedRows = deliveryResults
                    .filter((result) => result.status === "fulfilled" && result.value)
                    .map((result) => result.value);

                setCompanies(loadedCompanies);
                setRows(loadedRows);
            } catch (error) {
                console.error("Erro ao carregar relatórios:", error);
                setMessage("Não foi possível carregar os relatórios.");
            } finally {
                setIsLoading(false);
            }
        }

        loadReportsData();
    }, [isAdmin, loggedCompanyId]);

    const filteredRows = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return rows.filter((row) => {
            const order = row.order;
            const delivery = row.delivery;
            const currentStatus = getCurrentStatus(row);
            const companyId = order?.companyId;
            const companyName = getCompanyName(companyMap, companyId).toLowerCase();
            const description = getOrderDescription(order).toLowerCase();
            const orderId = String(order?.id || "").toLowerCase();
            const trackingCode = String(delivery?.trackingCode || "").toLowerCase();

            const matchesCompany =
                !isAdmin ||
                selectedCompanyId === "ALL" ||
                companyId === selectedCompanyId;

            const matchesStatus =
                selectedStatus === "ALL" || currentStatus === selectedStatus;

            const matchesSearch =
                !term ||
                companyName.includes(term) ||
                description.includes(term) ||
                orderId.includes(term) ||
                trackingCode.includes(term);

            return matchesCompany && matchesStatus && matchesSearch;
        });
    }, [rows, companyMap, isAdmin, selectedCompanyId, selectedStatus, searchTerm]);

    const reportData = useMemo(() => {
        const totalOrders = filteredRows.length;

        const delivered = filteredRows.filter(
            (row) => getCurrentStatus(row) === "DELIVERED"
        ).length;

        const canceled = filteredRows.filter(
            (row) => getCurrentStatus(row) === "CANCELED"
        ).length;

        const inTransit = filteredRows.filter((row) =>
            ["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(getCurrentStatus(row))
        ).length;

        const pending = filteredRows.filter((row) =>
            ["CREATED", "POSTED"].includes(getCurrentStatus(row))
        ).length;

        const unassigned = filteredRows.filter((row) => !hasCourier(row)).length;
        const assigned = filteredRows.filter((row) => hasCourier(row)).length;

        const totalValue = filteredRows.reduce((sum, row) => {
            return sum + (Number(row.order?.totalPrice) || 0);
        }, 0);

        const statusSummary = STATUS_LIST.map((status) => {
            const total = filteredRows.filter(
                (row) => getCurrentStatus(row) === status
            ).length;

            return {
                status,
                label: formatStatus(status),
                total,
                percentage: calculatePercentage(total, totalOrders),
            };
        });

        const companySummaryMap = filteredRows.reduce((accumulator, row) => {
            const companyId = row.order?.companyId || "sem-empresa";

            if (!accumulator[companyId]) {
                accumulator[companyId] = {
                    companyId,
                    companyName: getCompanyName(companyMap, companyId),
                    totalOrders: 0,
                    delivered: 0,
                    inTransit: 0,
                    pending: 0,
                    unassigned: 0,
                    totalValue: 0,
                };
            }

            const currentStatus = getCurrentStatus(row);

            accumulator[companyId].totalOrders += 1;
            accumulator[companyId].totalValue += Number(row.order?.totalPrice) || 0;

            if (currentStatus === "DELIVERED") {
                accumulator[companyId].delivered += 1;
            }

            if (["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(currentStatus)) {
                accumulator[companyId].inTransit += 1;
            }

            if (["CREATED", "POSTED"].includes(currentStatus)) {
                accumulator[companyId].pending += 1;
            }

            if (!hasCourier(row)) {
                accumulator[companyId].unassigned += 1;
            }

            return accumulator;
        }, {});

        const companySummary = Object.values(companySummaryMap).sort(
            (first, second) => second.totalOrders - first.totalOrders
        );

        const recentRows = [...filteredRows]
            .sort((first, second) => {
                return (
                    new Date(second.order?.createdAt || 0).getTime() -
                    new Date(first.order?.createdAt || 0).getTime()
                );
            })
            .slice(0, 8);

        return {
            totalOrders,
            delivered,
            canceled,
            inTransit,
            pending,
            unassigned,
            assigned,
            totalValue,
            statusSummary,
            companySummary,
            recentRows,
        };
    }, [filteredRows, companyMap]);

    return (
        <div className="reports-page">
            <div className="reports-title-row">
                <div>
                    <span className="reports-subtitle">
                        {isAdmin ? "Área administrativa" : "Área da empresa"}
                    </span>

                    <h1>Relatórios</h1>

                    <p>
                        Acompanhe indicadores operacionais de encomendas, status e
                        atribuição de entregadores.
                    </p>
                </div>
            </div>

            {message && <div className="reports-alert">{message}</div>}

            <section className="reports-filters">
                {isAdmin && (
                    <label>
                        <span>Empresa</span>

                        <select
                            value={selectedCompanyId}
                            onChange={(event) =>
                                setSelectedCompanyId(event.target.value)
                            }
                        >
                            <option value="ALL">Todas as empresas</option>

                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name} — {company.cnpj || "CNPJ não informado"}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                <label>
                    <span>Status</span>

                    <select
                        value={selectedStatus}
                        onChange={(event) => setSelectedStatus(event.target.value)}
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

                <label>
                    <span>Buscar</span>

                    <input
                        type="text"
                        placeholder="Empresa, rastreio, pedido ou descrição"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </label>
            </section>

            {isLoading ? (
                <div className="reports-loading">Carregando relatórios...</div>
            ) : (
                <>
                    <section className="reports-cards-grid">
                        {isAdmin && (
                            <ReportCard
                                label="Empresas"
                                value={companies.length}
                                detail="Cadastradas no sistema"
                                icon="🏢"
                            />
                        )}

                        <ReportCard
                            label="Encomendas"
                            value={reportData.totalOrders}
                            detail="Dentro dos filtros atuais"
                            icon="📦"
                        />

                        <ReportCard
                            label="Em andamento"
                            value={reportData.inTransit}
                            detail="Em trânsito ou saiu para entrega"
                            icon="🚚"
                        />

                        <ReportCard
                            label="Entregues"
                            value={reportData.delivered}
                            detail={`${calculatePercentage(
                                reportData.delivered,
                                reportData.totalOrders
                            )}% do total filtrado`}
                            icon="✅"
                        />

                        <ReportCard
                            label="Sem entregador"
                            value={reportData.unassigned}
                            detail="Precisam de atribuição"
                            icon="⚠️"
                            warning
                        />

                        <ReportCard
                            label="Valor declarado"
                            value={formatCurrency(reportData.totalValue)}
                            detail="Soma dos pedidos filtrados"
                            icon="💰"
                        />
                    </section>

                    <section className="reports-grid">
                        <div className="reports-panel">
                            <div className="reports-panel-header">
                                <div>
                                    <h2>Encomendas por status</h2>

                                    <p>Distribuição operacional das entregas.</p>
                                </div>
                            </div>

                            <div className="reports-status-list">
                                {reportData.statusSummary.map((item) => (
                                    <div className="reports-status-item" key={item.status}>
                                        <div className="reports-status-line">
                                            <span>{item.label}</span>
                                            <strong>{item.total}</strong>
                                        </div>

                                        <div className="reports-progress">
                                            <div
                                                style={{
                                                    width: `${item.percentage}%`,
                                                }}
                                            />
                                        </div>

                                        <small>{item.percentage}% do total</small>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="reports-panel">
                            <div className="reports-panel-header">
                                <div>
                                    <h2>Resumo de atribuição</h2>

                                    <p>Situação das entregas em relação aos entregadores.</p>
                                </div>
                            </div>

                            <div className="reports-assignment-grid">
                                <div className="reports-assignment-card success">
                                    <span>Com entregador</span>
                                    <strong>{reportData.assigned}</strong>
                                </div>

                                <div className="reports-assignment-card warning">
                                    <span>Sem entregador</span>
                                    <strong>{reportData.unassigned}</strong>
                                </div>

                                <div className="reports-assignment-card">
                                    <span>Pendentes</span>
                                    <strong>{reportData.pending}</strong>
                                </div>

                                <div className="reports-assignment-card danger">
                                    <span>Canceladas</span>
                                    <strong>{reportData.canceled}</strong>
                                </div>
                            </div>
                        </div>
                    </section>

                    {isAdmin && (
                        <section className="reports-panel">
                            <div className="reports-panel-header">
                                <div>
                                    <h2>Encomendas por empresa</h2>

                                    <p>Ranking operacional das empresas cadastradas.</p>
                                </div>
                            </div>

                            {reportData.companySummary.length === 0 ? (
                                <div className="reports-empty">
                                    Nenhuma empresa encontrada para os filtros atuais.
                                </div>
                            ) : (
                                <div className="reports-company-table">
                                    <div className="reports-company-table-head">
                                        <span>Empresa</span>
                                        <span>Total</span>
                                        <span>Em andamento</span>
                                        <span>Entregues</span>
                                        <span>Sem entregador</span>
                                        <span>Valor</span>
                                    </div>

                                    {reportData.companySummary.map((company) => (
                                        <div
                                            className="reports-company-table-row"
                                            key={company.companyId}
                                        >
                                            <strong>{company.companyName}</strong>
                                            <span>{company.totalOrders}</span>
                                            <span>{company.inTransit}</span>
                                            <span>{company.delivered}</span>
                                            <span>{company.unassigned}</span>
                                            <span>{formatCurrency(company.totalValue)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    <section className="reports-panel">
                        <div className="reports-panel-header">
                            <div>
                                <h2>Últimas encomendas filtradas</h2>

                                <p>Recorte rápido dos pedidos mais recentes.</p>
                            </div>
                        </div>

                        {reportData.recentRows.length === 0 ? (
                            <div className="reports-empty">
                                Nenhuma encomenda encontrada para os filtros atuais.
                            </div>
                        ) : (
                            <div className="reports-table">
                                <div className="reports-table-head">
                                    <span>Pedido</span>
                                    <span>Empresa</span>
                                    <span>Descrição</span>
                                    <span>Status</span>
                                    <span>Entregador</span>
                                    <span>Valor</span>
                                    <span>Data</span>
                                </div>

                                {reportData.recentRows.map((row) => (
                                    <div className="reports-table-row" key={row.order.id}>
                                        <span className="reports-order-id">
                                            #{row.order.id}
                                        </span>

                                        <span>
                                            {getCompanyName(
                                                companyMap,
                                                row.order.companyId
                                            )}
                                        </span>

                                        <strong>{getOrderDescription(row.order)}</strong>

                                        <span className="reports-status-badge">
                                            {formatStatus(getCurrentStatus(row))}
                                        </span>

                                        <span
                                            className={
                                                hasCourier(row)
                                                    ? "reports-courier-badge assigned"
                                                    : "reports-courier-badge unassigned"
                                            }
                                        >
                                            {hasCourier(row)
                                                ? "Atribuído"
                                                : "Sem entregador"}
                                        </span>

                                        <span>{formatCurrency(row.order.totalPrice)}</span>

                                        <span>{formatDate(row.order.createdAt)}</span>
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

function ReportCard({ label, value, detail, icon, warning = false }) {
    return (
        <div className={warning ? "reports-card warning" : "reports-card"}>
            <div className="reports-card-header">
                <span>{icon}</span>
                <strong>{label}</strong>
            </div>

            <div className="reports-card-value">{value}</div>

            <p>{detail}</p>
        </div>
    );
}