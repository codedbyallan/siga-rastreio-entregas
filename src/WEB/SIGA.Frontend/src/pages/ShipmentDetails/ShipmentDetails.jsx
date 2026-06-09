import { useEffect, useState } from "react";
import {
    assignCourierToDelivery,
    getDeliveryByOrderId,
} from "../../services/deliveryService";
import { createDeliveryEvent } from "../../services/deliveryEventService";
import {
    createUser,
    getCouriers,
    getCouriersByCompanyId,
} from "../../services/userService";
import "./ShipmentDetails.css";

const statusOptions = [
    {
        value: "POSTED",
        label: "Postado",
        eventType: "DELIVERY_POSTED",
        defaultDescription: "Encomenda postada e aguardando movimentação.",
    },
    {
        value: "IN_TRANSIT",
        label: "Em trânsito",
        eventType: "DELIVERY_IN_TRANSIT",
        defaultDescription: "Encomenda saiu para transporte.",
    },
    {
        value: "OUT_FOR_DELIVERY",
        label: "Saiu para entrega",
        eventType: "DELIVERY_OUT_FOR_DELIVERY",
        defaultDescription: "Encomenda saiu para entrega ao destinatário.",
    },
    {
        value: "DELIVERED",
        label: "Entregue",
        eventType: "DELIVERY_DELIVERED",
        defaultDescription: "Encomenda entregue ao destinatário.",
    },
    {
        value: "CANCELED",
        label: "Cancelado",
        eventType: "DELIVERY_CANCELED",
        defaultDescription: "Entrega cancelada no sistema.",
    },
];

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

function getOrderDescription(order) {
    const firstItem = order?.items?.[0];

    if (!firstItem) {
        return "Pedido sem item informado";
    }

    return firstItem.name || "Item sem descrição";
}

function getStatusOption(status) {
    return statusOptions.find((option) => option.value === status);
}

function normalizeRole(role) {
    return String(role || "").trim().toLowerCase();
}

function getAvailableStatusOptions(currentStatus, user) {
    const role = normalizeRole(user?.role);
    const normalizedStatus = String(currentStatus || "").trim().toUpperCase();

    if (["DELIVERED", "CANCELED"].includes(normalizedStatus)) {
        return [];
    }

    const optionsByStatusAndRole = {
        admin: {
            CREATED: ["POSTED", "CANCELED"],
            POSTED: ["IN_TRANSIT", "CANCELED"],
            IN_TRANSIT: ["CANCELED"],
            OUT_FOR_DELIVERY: ["CANCELED"],
        },
        company_operator: {
            CREATED: ["POSTED", "CANCELED"],
            POSTED: ["IN_TRANSIT", "CANCELED"],
            IN_TRANSIT: ["CANCELED"],
            OUT_FOR_DELIVERY: ["CANCELED"],
        },
        courier: {
            IN_TRANSIT: ["OUT_FOR_DELIVERY"],
            OUT_FOR_DELIVERY: ["DELIVERED"],
        },
    };

    const allowedStatuses = optionsByStatusAndRole[role]?.[normalizedStatus] || [];

    return statusOptions.filter((option) => allowedStatuses.includes(option.value));
}

function getNextDefaultStatus(currentStatus, user) {
    const availableOptions = getAvailableStatusOptions(currentStatus, user);
    return availableOptions[0]?.value || "";
}

function canManageCouriers(user) {
    const role = normalizeRole(user?.role);
    return role === "admin" || role === "company_operator";
}

function isAdminUser(user) {
    return normalizeRole(user?.role) === "admin";
}

function isCourierUser(user) {
    return normalizeRole(user?.role) === "courier";
}

function getActorType(user) {
    const role = normalizeRole(user?.role);

    if (role === "admin") {
        return "ADMIN";
    }

    if (role === "courier") {
        return "COURIER";
    }

    return "OPERATOR";
}

function formatDeclaredValue(value, user) {
    if (isCourierUser(user)) {
        return "Não informado";
    }

    return formatCurrency(value);
}

function getCourierName(couriers, courierId) {
    if (!courierId) {
        return "Não atribuído";
    }

    const courier = couriers.find((item) => item.id === courierId);

    if (!courier) {
        return `ID: ${courierId}`;
    }

    return courier.name || courier.email || courierId;
}

function getCourierCompanyId(loggedUser, selectedOrder) {
    if (isAdminUser(loggedUser)) {
        return selectedOrder?.companyId || "";
    }

    return loggedUser?.companyId || "";
}

const emptyCourierForm = {
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
};

export default function ShipmentDetails({ selectedOrder, loggedUser, onNavigate }) {
    const [details, setDetails] = useState(null);
    const [couriers, setCouriers] = useState([]);
    const [selectedCourierId, setSelectedCourierId] = useState("");
    const [showCourierForm, setShowCourierForm] = useState(false);
    const [courierForm, setCourierForm] = useState(emptyCourierForm);
    const [message, setMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCouriers, setIsLoadingCouriers] = useState(false);
    const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
    const [isAssigningCourier, setIsAssigningCourier] = useState(false);
    const [isCreatingCourier, setIsCreatingCourier] = useState(false);
    const [statusForm, setStatusForm] = useState({
        status: "",
        description: "",
    });

    const orderId = selectedOrder?.id;
    const delivery = details?.delivery;
    const events = details?.events || [];
    const isFinalStatus = ["DELIVERED", "CANCELED"].includes(delivery?.status);
    const canAssignCourier = canManageCouriers(loggedUser);
    const isCourier = isCourierUser(loggedUser);
    const isAdmin = isAdminUser(loggedUser);

    const backTarget = isCourier
        ? "courier-deliveries"
        : isAdmin
          ? "unassigned-shipments"
          : "shipments";

    const backLabel = isCourier
        ? "Voltar para Minhas Entregas"
        : isAdmin
          ? "Voltar para Pendentes de entregador"
          : "Voltar para Minhas Encomendas";
    const availableStatusOptions = getAvailableStatusOptions(
        delivery?.status,
        loggedUser
    );

    async function loadDetails() {
        if (!orderId) {
            setMessage("Nenhum pedido selecionado.");
            setIsLoading(false);
            return null;
        }

        try {
            setIsLoading(true);
            setMessage("");

            const result = await getDeliveryByOrderId(orderId);
            const detailsData = result?.data || null;

            setDetails(detailsData);
            setSelectedCourierId(detailsData?.delivery?.courierId || "");

            const nextStatus = getNextDefaultStatus(
                detailsData?.delivery?.status,
                loggedUser
            );

            setStatusForm({
                status: nextStatus,
                description: nextStatus
                    ? getStatusOption(nextStatus)?.defaultDescription || ""
                    : "",
            });

            return detailsData;
        } catch (error) {
            console.error("Erro ao buscar detalhes da encomenda:", error);
            setMessage(error.message || "Não foi possível carregar os detalhes.");
            return null;
        } finally {
            setIsLoading(false);
        }
    }

    async function loadCouriers() {
        if (!canAssignCourier) {
            return [];
        }

        try {
            setIsLoadingCouriers(true);

            let result;

            if (isAdminUser(loggedUser)) {
                const companyId = selectedOrder?.companyId;

                if (!companyId) {
                    setCouriers([]);
                    setMessage(
                        "Não foi possível identificar a empresa desta encomenda para buscar os entregadores."
                    );
                    return [];
                }

                result = await getCouriersByCompanyId(companyId);
            } else {
                result = await getCouriers();
            }

            const couriersData = result?.data || [];

            setCouriers(couriersData);

            const currentCourierId = details?.delivery?.courierId;

            if (
                currentCourierId &&
                !couriersData.some((courier) => courier.id === currentCourierId)
            ) {
                setSelectedCourierId("");
            }

            return couriersData;
        } catch (error) {
            console.error("Erro ao buscar entregadores:", error);
            setMessage(error.message || "Não foi possível carregar os entregadores.");
            return [];
        } finally {
            setIsLoadingCouriers(false);
        }
    }

    useEffect(() => {
        loadDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    useEffect(() => {
        loadCouriers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loggedUser?.role, selectedOrder?.companyId, details?.delivery?.courierId]);

    function handleStatusChange(event) {
        const selectedStatus = event.target.value;
        const selectedOption = getStatusOption(selectedStatus);

        setStatusForm({
            status: selectedStatus,
            description: selectedOption?.defaultDescription || "",
        });

        setMessage("");
        setSuccessMessage("");
    }

    function handleDescriptionChange(event) {
        setStatusForm((previousForm) => ({
            ...previousForm,
            description: event.target.value,
        }));

        setMessage("");
        setSuccessMessage("");
    }

    function handleCourierChange(event) {
        setSelectedCourierId(event.target.value);
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

    function toggleCourierForm() {
        setShowCourierForm((previousValue) => !previousValue);
        setMessage("");
        setSuccessMessage("");
    }

    async function handleCreateCourierSubmit(event) {
        event.preventDefault();

        const companyId = getCourierCompanyId(loggedUser, selectedOrder);

        if (!companyId) {
            setMessage("Não foi possível identificar a empresa para vincular o entregador.");
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

            const result = await createUser({
                name: courierForm.name.trim(),
                email: courierForm.email.trim(),
                phone: courierForm.phone.trim(),
                password: courierForm.password,
                role: "courier",
                companyId,
            });

            const createdCourier = result?.data;

            await loadCouriers();

            if (createdCourier?.id) {
                setSelectedCourierId(createdCourier.id);
            }

            setCourierForm(emptyCourierForm);
            setShowCourierForm(false);
            setSuccessMessage(
                "Entregador cadastrado com sucesso. Ele já está disponível para atribuição."
            );
        } catch (error) {
            console.error("Erro ao cadastrar entregador:", error);
            setMessage(error.message || "Não foi possível cadastrar o entregador.");
        } finally {
            setIsCreatingCourier(false);
        }
    }

    async function handleAssignCourierSubmit(event) {
        event.preventDefault();

        if (!delivery?.id) {
            setMessage("Não foi possível identificar a entrega selecionada.");
            return;
        }

        if (!selectedCourierId) {
            setMessage("Selecione um entregador para atribuir à entrega.");
            return;
        }

        try {
            setIsAssigningCourier(true);
            setMessage("");
            setSuccessMessage("");

            await assignCourierToDelivery(delivery.id, selectedCourierId);

            setSuccessMessage("Entregador atribuído com sucesso.");
            await loadDetails();
        } catch (error) {
            console.error("Erro ao atribuir entregador:", error);
            setMessage(error.message || "Não foi possível atribuir o entregador.");
        } finally {
            setIsAssigningCourier(false);
        }
    }

    async function handleStatusSubmit(event) {
        event.preventDefault();

        if (!delivery?.id || !delivery?.orderId) {
            setMessage("Não foi possível identificar a entrega selecionada.");
            return;
        }

        if (!statusForm.status) {
            setMessage("Selecione um novo status para a entrega.");
            return;
        }

        if (!statusForm.description.trim()) {
            setMessage("Informe uma descrição para o evento.");
            return;
        }

        const selectedOption = availableStatusOptions.find(
            (option) => option.value === statusForm.status
        );

        if (!selectedOption) {
            setMessage("Status selecionado não é permitido para este perfil ou status atual.");
            return;
        }

        try {
            setIsSubmittingStatus(true);
            setMessage("");
            setSuccessMessage("");

            await createDeliveryEvent({
                deliveryId: delivery.id,
                orderId: delivery.orderId,
                status: selectedOption.value,
                description: statusForm.description.trim(),
                eventType: selectedOption.eventType,
                actor: {
                    type: getActorType(loggedUser),
                    id: loggedUser?.id || "siga-web",
                },
            });

            setSuccessMessage("Status atualizado com sucesso.");
            await loadDetails();
        } catch (error) {
            console.error("Erro ao atualizar status da entrega:", error);
            setMessage(error.message || "Não foi possível atualizar o status.");
        } finally {
            setIsSubmittingStatus(false);
        }
    }

    return (
        <div className="shipment-details-page">
            <div className="shipment-details-title-row">
                <div>
                    <span className="shipment-details-subtitle">
                        Detalhes da encomenda
                    </span>

                    <h1>{delivery?.trackingCode || "Encomenda"}</h1>

                    <p>
                        Consulte os dados completos da entrega, origem, destino e
                        histórico de eventos.
                    </p>
                </div>

                <button
                    type="button"
                    className="shipment-details-secondary-button"
                    onClick={() => onNavigate(backTarget)}
                >
                    {backLabel}
                </button>
            </div>

            {message && <div className="shipment-details-alert">{message}</div>}

            {successMessage && (
                <div className="shipment-details-success">{successMessage}</div>
            )}

            {isLoading ? (
                <div className="shipment-details-loading">
                    Carregando detalhes da encomenda...
                </div>
            ) : (
                <>
                    <section className="shipment-details-grid">
                        <div className="shipment-details-card">
                            <span>Descrição</span>
                            <strong>{getOrderDescription(selectedOrder)}</strong>
                        </div>

                        <div className="shipment-details-card">
                            <span>Pedido</span>
                            <strong>#{selectedOrder?.id || "Não informado"}</strong>
                        </div>

                        <div className="shipment-details-card">
                            <span>Status</span>
                            <strong>
                                {formatStatus(delivery?.status || selectedOrder?.status)}
                            </strong>
                        </div>

                        <div className="shipment-details-card">
                            <span>Valor declarado</span>
                            <strong>
                                {formatDeclaredValue(
                                    selectedOrder?.totalPrice,
                                    loggedUser
                                )}
                            </strong>
                        </div>
                    </section>

                    {delivery && (
                        <section className="shipment-details-panel">
                            <div className="shipment-details-panel-header">
                                <div>
                                    <h2>Dados da entrega</h2>
                                    <p>Informações operacionais vinculadas ao pedido.</p>
                                </div>

                                <span className="shipment-details-status-badge">
                                    {formatStatus(delivery.status)}
                                </span>
                            </div>

                            <div className="shipment-details-info-grid">
                                <InfoItem
                                    label="Código de rastreio"
                                    value={delivery.trackingCode || "Não informado"}
                                />

                                <InfoItem
                                    label="Transportadora"
                                    value={delivery.carrier || "Não informado"}
                                />

                                <InfoItem
                                    label="Data"
                                    value={formatDateOnly(delivery.postingDate)}
                                />

                                <InfoItem
                                    label="Criado em"
                                    value={formatDate(delivery.createdAt)}
                                />

                                <InfoItem
                                    label="Entregador"
                                    value={getCourierName(couriers, delivery.courierId)}
                                />

                                <InfoItem
                                    label="Origem"
                                    value={formatAddress(delivery.originAddress)}
                                />

                                <InfoItem
                                    label="Destino"
                                    value={formatAddress(delivery.address)}
                                />
                            </div>
                        </section>
                    )}

                    {delivery && canAssignCourier && (
                        <section className="shipment-details-panel">
                            <div className="shipment-details-panel-header">
                                <div>
                                    <h2>Entregador responsável</h2>
                                    <p>
                                        Atribua esta entrega a um entregador vinculado à
                                        empresa.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="shipment-details-outline-button"
                                    onClick={toggleCourierForm}
                                >
                                    {showCourierForm
                                        ? "Cancelar cadastro"
                                        : "+ Novo entregador"}
                                </button>
                            </div>

                            {showCourierForm && (
                                <form
                                    className="shipment-details-new-courier-form"
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
                                        className="shipment-details-primary-button"
                                        disabled={isCreatingCourier}
                                    >
                                        {isCreatingCourier
                                            ? "Cadastrando..."
                                            : "Cadastrar entregador"}
                                    </button>
                                </form>
                            )}

                            <form
                                className="shipment-details-courier-form"
                                onSubmit={handleAssignCourierSubmit}
                            >
                                <label>
                                    <span>Entregador</span>

                                    <select
                                        value={selectedCourierId}
                                        onChange={handleCourierChange}
                                        disabled={isLoadingCouriers}
                                    >
                                        <option value="">
                                            {isLoadingCouriers
                                                ? "Carregando entregadores..."
                                                : "Selecione um entregador"}
                                        </option>

                                        {couriers.map((courier) => (
                                            <option key={courier.id} value={courier.id}>
                                                {courier.name} — {courier.email}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <button
                                    type="submit"
                                    className="shipment-details-primary-button"
                                    disabled={isAssigningCourier || isLoadingCouriers}
                                >
                                    {isAssigningCourier
                                        ? "Atribuindo..."
                                        : "Atribuir entregador"}
                                </button>
                            </form>
                        </section>
                    )}

                    {delivery && (
                        <section className="shipment-details-panel">
                            <div className="shipment-details-panel-header">
                                <div>
                                    <h2>Atualizar status da entrega</h2>
                                    <p>
                                        Registre uma nova movimentação no histórico da
                                        encomenda.
                                    </p>
                                </div>
                            </div>

                            {isFinalStatus ? (
                                <div className="shipment-details-empty">
                                    Esta entrega já está com status final:{" "}
                                    {formatStatus(delivery.status)}.
                                </div>
                            ) : availableStatusOptions.length === 0 ? (
                                <div className="shipment-details-empty">
                                    Seu perfil não possui próximas ações disponíveis para o
                                    status atual: {formatStatus(delivery.status)}.
                                </div>
                            ) : (
                                <form
                                    className="shipment-details-status-form"
                                    onSubmit={handleStatusSubmit}
                                >
                                    <label>
                                        <span>Novo status</span>

                                        <select
                                            value={statusForm.status}
                                            onChange={handleStatusChange}
                                        >
                                            <option value="">Selecione</option>

                                            {availableStatusOptions.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label>
                                        <span>Descrição do evento</span>

                                        <textarea
                                            value={statusForm.description}
                                            onChange={handleDescriptionChange}
                                            placeholder="Descreva a movimentação da entrega"
                                            rows="4"
                                        />
                                    </label>

                                    <button
                                        type="submit"
                                        className="shipment-details-primary-button"
                                        disabled={isSubmittingStatus}
                                    >
                                        {isSubmittingStatus
                                            ? "Registrando..."
                                            : "Registrar atualização"}
                                    </button>
                                </form>
                            )}
                        </section>
                    )}

                    <section className="shipment-details-panel">
                        <h2>Histórico da encomenda</h2>

                        {events.length === 0 ? (
                            <div className="shipment-details-empty">
                                Nenhum evento registrado para esta encomenda.
                            </div>
                        ) : (
                            <div className="shipment-details-timeline">
                                {events.map((event) => (
                                    <div
                                        className="shipment-details-event"
                                        key={event.id}
                                    >
                                        <div className="shipment-details-marker"></div>

                                        <div>
                                            <strong>{formatStatus(event.status)}</strong>
                                            <p>
                                                {event.description ||
                                                    "Evento registrado."}
                                            </p>
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

function InfoItem({ label, value }) {
    return (
        <div className="shipment-details-info-item">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}