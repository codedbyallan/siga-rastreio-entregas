import { useEffect, useMemo, useState } from "react";
import { getCompanies } from "../../services/companyService";
import { createUser, getCouriersByCompanyId } from "../../services/userService";
import "./AdminCouriers.css";

const emptyCourierForm = {
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
};

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

export default function AdminCouriers({ selectedCompany }) {
    const [companies, setCompanies] = useState([]);
    const [couriers, setCouriers] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState(
        selectedCompany?.id || ""
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [courierForm, setCourierForm] = useState(emptyCourierForm);
    const [message, setMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
    const [isLoadingCouriers, setIsLoadingCouriers] = useState(false);
    const [isCreatingCourier, setIsCreatingCourier] = useState(false);

    useEffect(() => {
        async function loadCompanies() {
            try {
                setIsLoadingCompanies(true);
                setMessage("");

                const result = await getCompanies();
                const companiesData = result?.data || [];

                setCompanies(companiesData);

                if (!selectedCompanyId && companiesData.length > 0) {
                    setSelectedCompanyId(companiesData[0].id);
                }
            } catch (error) {
                console.error("Erro ao carregar empresas:", error);
                setMessage("Não foi possível carregar as empresas.");
            } finally {
                setIsLoadingCompanies(false);
            }
        }

        loadCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedCompany?.id) {
            setSelectedCompanyId(selectedCompany.id);
        }
    }, [selectedCompany?.id]);

    useEffect(() => {
        async function loadCouriers() {
            if (!selectedCompanyId) {
                setCouriers([]);
                return;
            }

            try {
                setIsLoadingCouriers(true);
                setMessage("");

                const result = await getCouriersByCompanyId(selectedCompanyId);
                setCouriers(result?.data || []);
            } catch (error) {
                console.error("Erro ao carregar entregadores:", error);
                setMessage("Não foi possível carregar os entregadores da empresa.");
            } finally {
                setIsLoadingCouriers(false);
            }
        }

        loadCouriers();
    }, [selectedCompanyId]);

    const selectedCompanyData = useMemo(() => {
        return companies.find((company) => company.id === selectedCompanyId);
    }, [companies, selectedCompanyId]);

    const filteredCouriers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return couriers.filter((courier) => {
            const name = String(courier.name || "").toLowerCase();
            const email = String(courier.email || "").toLowerCase();
            const phone = String(courier.phone || "").toLowerCase();

            return (
                !term ||
                name.includes(term) ||
                email.includes(term) ||
                phone.includes(term)
            );
        });
    }, [couriers, searchTerm]);

    function handleCompanyChange(event) {
        setSelectedCompanyId(event.target.value);
        setSearchTerm("");
        setMessage("");
        setSuccessMessage("");
    }

    function handleCourierFormChange(event) {
        const { name, value } = event.target;

        setCourierForm((previousForm) => ({
            ...previousForm,
            [name]: value,
        }));

        setMessage("");
        setSuccessMessage("");
    }

    async function reloadCouriers() {
        if (!selectedCompanyId) {
            return;
        }

        const result = await getCouriersByCompanyId(selectedCompanyId);
        setCouriers(result?.data || []);
    }

    async function handleCreateCourierSubmit(event) {
        event.preventDefault();

        if (!selectedCompanyId) {
            setMessage("Selecione uma empresa para vincular o entregador.");
            return;
        }

        if (!courierForm.name.trim()) {
            setMessage("Informe o nome do entregador.");
            return;
        }

        if (!courierForm.email.trim()) {
            setMessage("Informe o e-mail do entregador.");
            return;
        }

        if (!courierForm.password.trim()) {
            setMessage("Informe a senha inicial do entregador.");
            return;
        }

        if (courierForm.password !== courierForm.confirmPassword) {
            setMessage("A senha inicial e a confirmação de senha não conferem.");
            return;
        }

        try {
            setIsCreatingCourier(true);
            setMessage("");
            setSuccessMessage("");

            await createUser({
                name: courierForm.name.trim(),
                email: courierForm.email.trim(),
                phone: courierForm.phone.trim(),
                password: courierForm.password,
                role: "courier",
                companyId: selectedCompanyId,
            });

            await reloadCouriers();

            setCourierForm(emptyCourierForm);
            setSuccessMessage("Entregador cadastrado com sucesso.");
        } catch (error) {
            console.error("Erro ao cadastrar entregador:", error);
            setMessage(error.message || "Não foi possível cadastrar o entregador.");
        } finally {
            setIsCreatingCourier(false);
        }
    }

    return (
        <div className="admin-couriers-page">
            <div className="admin-couriers-title-row">
                <div>
                    <span className="admin-couriers-subtitle">
                        Área administrativa
                    </span>

                    <h1>Entregadores</h1>

                    <p>
                        Cadastre e consulte entregadores vinculados às empresas do
                        sistema.
                    </p>
                </div>
            </div>

            {message && <div className="admin-couriers-alert">{message}</div>}

            {successMessage && (
                <div className="admin-couriers-success">{successMessage}</div>
            )}

            <section className="admin-couriers-panel">
                <div className="admin-couriers-panel-header">
                    <div>
                        <h2>Empresa</h2>
                        <p>Selecione a empresa para visualizar seus entregadores.</p>
                    </div>
                </div>

                <div className="admin-couriers-company-selector">
                    <label>
                        <span>Empresa</span>

                        <select
                            value={selectedCompanyId}
                            onChange={handleCompanyChange}
                            disabled={isLoadingCompanies}
                        >
                            <option value="">
                                {isLoadingCompanies
                                    ? "Carregando empresas..."
                                    : "Selecione uma empresa"}
                            </option>

                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name} — {company.cnpj || "CNPJ não informado"}
                                </option>
                            ))}
                        </select>
                    </label>

                    {selectedCompanyData && (
                        <div className="admin-couriers-company-card">
                            <strong>{selectedCompanyData.name}</strong>
                            <span>
                                CNPJ: {selectedCompanyData.cnpj || "Não informado"}
                            </span>
                            <span>{formatAddress(selectedCompanyData.address)}</span>
                        </div>
                    )}
                </div>
            </section>

            <section className="admin-couriers-panel">
                <div className="admin-couriers-panel-header">
                    <div>
                        <h2>Novo entregador</h2>
                        <p>
                            O entregador será criado com perfil courier e vinculado à
                            empresa selecionada.
                        </p>
                    </div>
                </div>

                <form
                    className="admin-couriers-form"
                    onSubmit={handleCreateCourierSubmit}
                >
                    <label>
                        <span>Nome</span>
                        <input
                            type="text"
                            name="name"
                            value={courierForm.name}
                            onChange={handleCourierFormChange}
                            placeholder="Nome do entregador"
                        />
                    </label>

                    <label>
                        <span>E-mail</span>
                        <input
                            type="email"
                            name="email"
                            value={courierForm.email}
                            onChange={handleCourierFormChange}
                            placeholder="email@exemplo.com"
                        />
                    </label>

                    <label>
                        <span>Telefone</span>
                        <input
                            type="text"
                            name="phone"
                            value={courierForm.phone}
                            onChange={handleCourierFormChange}
                            placeholder="31999999999"
                        />
                    </label>

                    <label>
                        <span>Senha inicial</span>
                        <input
                            type="password"
                            name="password"
                            value={courierForm.password}
                            onChange={handleCourierFormChange}
                            placeholder="Defina uma senha inicial"
                        />
                    </label>

                    <label>
                        <span>Confirmar senha</span>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={courierForm.confirmPassword}
                            onChange={handleCourierFormChange}
                            placeholder="Repita a senha inicial"
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={isCreatingCourier || !selectedCompanyId}
                    >
                        {isCreatingCourier ? "Cadastrando..." : "Cadastrar entregador"}
                    </button>
                </form>
            </section>

            <section className="admin-couriers-panel">
                <div className="admin-couriers-panel-header">
                    <div>
                        <h2>Entregadores da empresa</h2>

                        <p>
                            Mostrando {filteredCouriers.length} de {couriers.length}{" "}
                            entregador(es).
                        </p>
                    </div>
                </div>

                <div className="admin-couriers-filters">
                    <label>
                        <span>Buscar</span>

                        <input
                            type="text"
                            placeholder="Nome, e-mail ou telefone"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </label>
                </div>

                {isLoadingCouriers ? (
                    <div className="admin-couriers-loading">
                        Carregando entregadores...
                    </div>
                ) : filteredCouriers.length === 0 ? (
                    <div className="admin-couriers-empty">
                        Nenhum entregador encontrado para esta empresa.
                    </div>
                ) : (
                    <div className="admin-couriers-table">
                        <div className="admin-couriers-table-head">
                            <span>Nome</span>
                            <span>E-mail</span>
                            <span>Telefone</span>
                            <span>Perfil</span>
                            <span>Empresa</span>
                        </div>

                        {filteredCouriers.map((courier) => (
                            <div
                                className="admin-couriers-table-row"
                                key={courier.id}
                            >
                                <strong>{courier.name || "Sem nome"}</strong>
                                <span>{courier.email || "Não informado"}</span>
                                <span>{courier.phone || "Não informado"}</span>
                                <span className="admin-couriers-role-badge">
                                    {courier.role || "courier"}
                                </span>
                                <span className="admin-couriers-company-id">
                                    {selectedCompanyData?.name || courier.companyId || "Não informado"}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}