import { useEffect, useMemo, useState } from "react";
import { getCompanies } from "../../services/companyService";
import { getOrders } from "../../services/orderService";
import "./AdminCompanies.css";

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

function getCompanyOrdersCount(ordersByCompany, companyId) {
    return ordersByCompany[companyId] || 0;
}

export default function AdminCompanies({ onNavigate }) {
    const [companies, setCompanies] = useState([]);
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadCompaniesData() {
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
                console.error("Erro ao carregar empresas:", error);
                setMessage("Não foi possível carregar as empresas.");
            } finally {
                setIsLoading(false);
            }
        }

        loadCompaniesData();
    }, []);

    const ordersByCompany = useMemo(() => {
        return orders.reduce((accumulator, order) => {
            const companyId = order.companyId || "sem-empresa";
            accumulator[companyId] = (accumulator[companyId] || 0) + 1;
            return accumulator;
        }, {});
    }, [orders]);

    const filteredCompanies = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return companies.filter((company) => {
            const name = String(company.name || "").toLowerCase();
            const cnpj = String(company.cnpj || "").toLowerCase();
            const address = formatAddress(company.address).toLowerCase();

            return (
                !term ||
                name.includes(term) ||
                cnpj.includes(term) ||
                address.includes(term)
            );
        });
    }, [companies, searchTerm]);

    return (
        <div className="admin-companies-page">
            <div className="admin-companies-title-row">
                <div>
                    <span className="admin-companies-subtitle">
                        Área administrativa
                    </span>

                    <h1>Empresas</h1>

                    <p>
                        Consulte todas as empresas cadastradas e acesse suas
                        encomendas.
                    </p>
                </div>
            </div>

            {message && <div className="admin-companies-alert">{message}</div>}

            <section className="admin-companies-filters">
                <label>
                    <span>Buscar empresa</span>

                    <input
                        type="text"
                        placeholder="Nome, CNPJ ou endereço"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </label>
            </section>

            {isLoading ? (
                <div className="admin-companies-loading">
                    Carregando empresas...
                </div>
            ) : (
                <section className="admin-companies-panel">
                    <div className="admin-companies-panel-header">
                        <div>
                            <h2>Lista de empresas</h2>

                            <p>
                                Mostrando {filteredCompanies.length} de{" "}
                                {companies.length} empresa(s).
                            </p>
                        </div>
                    </div>

                    {filteredCompanies.length === 0 ? (
                        <div className="admin-companies-empty">
                            Nenhuma empresa encontrada.
                        </div>
                    ) : (
                        <div className="admin-companies-table">
                            <div className="admin-companies-table-head">
                                <span>Empresa</span>
                                <span>CNPJ</span>
                                <span>Endereço</span>
                                <span>Encomendas</span>
                                <span>Ações</span>
                            </div>

                            {filteredCompanies.map((company) => (
                                <div
                                    className="admin-companies-table-row"
                                    key={company.id}
                                >
                                    <strong>{company.name || "Empresa sem nome"}</strong>

                                    <span>{company.cnpj || "Não informado"}</span>

                                    <span>{formatAddress(company.address)}</span>

                                    <span className="admin-companies-count-badge">
                                        {getCompanyOrdersCount(
                                            ordersByCompany,
                                            company.id
                                        )}{" "}
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
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}