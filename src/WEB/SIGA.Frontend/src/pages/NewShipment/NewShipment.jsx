/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { getCompanyById } from "../../services/companyService";
import { createOrder, getOrders } from "../../services/orderService";
import {
    createDelivery,
    getDeliveries,
    getDeliveryByOrderId,
} from "../../services/deliveryService";
import {
    createDeliveryEvent,
    getDeliveryEvents,
} from "../../services/deliveryEventService";
import "./NewShipment.css";

const initialForm = {
    senderName: "",
    senderEmail: "",
    senderPhone: "",
    senderZipCode: "",
    senderAddress: "",
    senderNumber: "",
    senderNeighborhood: "",
    senderCity: "",
    senderState: "",

    recipientName: "",
    recipientEmail: "",
    recipientPhone: "",
    recipientZipCode: "",
    recipientAddress: "",
    recipientNumber: "",
    recipientNeighborhood: "",
    recipientCity: "",
    recipientState: "",

    trackingCode: "",
    objectDescription: "",
    declaredValue: "",
    carrier: "",
    postingDate: "",
};

const requiredFields = {
    senderName: "Nome / Empresa do remetente",
    senderEmail: "Email do remetente",
    senderZipCode: "CEP do remetente",
    senderAddress: "Endereço do remetente",
    senderNumber: "Número do remetente",
    senderCity: "Cidade do remetente",
    senderState: "UF do remetente",
    recipientName: "Nome / Empresa do destinatário",
    recipientEmail: "Email do destinatário",
    recipientZipCode: "CEP do destinatário",
    recipientAddress: "Endereço do destinatário",
    recipientNumber: "Número do destinatário",
    recipientCity: "Cidade do destinatário",
    recipientState: "UF do destinatário",
    trackingCode: "Código de rastreio",
    objectDescription: "Descrição do objeto",
    declaredValue: "Valor declarado",
    carrier: "Transportadora",
    postingDate: "Data",
};

const SHOW_BACKEND_TEST = false;

function generateTrackingCode() {
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    const currentYear = new Date().getFullYear();

    return `SIGA-${currentYear}-${randomNumber}`;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function parseCurrencyValue(value) {
    const cleanValue = String(value)
        .replace(/[^\d,.-]/g, "")
        .trim();

    if (!cleanValue) {
        return 0;
    }

    let normalizedValue = cleanValue;

    if (cleanValue.includes(",")) {
        normalizedValue = cleanValue.replace(/\./g, "").replace(",", ".");
    } else if (cleanValue.includes(".")) {
        const parts = cleanValue.split(".");
        const lastPart = parts[parts.length - 1];

        if (lastPart.length !== 2) {
            normalizedValue = cleanValue.replace(/\./g, "");
        }
    }

    const parsedValue = Number(normalizedValue);

    return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatCurrencyBRL(value) {
    const cleanValue = String(value)
        .replace(/[^\d,.-]/g, "")
        .trim();

    if (!cleanValue) {
        return "";
    }

    const parsedValue = parseCurrencyValue(value);

    return parsedValue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function formatCurrencyForEditing(value) {
    const parsedValue = parseCurrencyValue(value);

    if (!parsedValue) {
        return "";
    }

    return String(parsedValue).replace(".", ",");
}

function onlyNumbers(value) {
    return String(value).replace(/\D/g, "");
}

function formatZipCode(value) {
    const digits = onlyNumbers(value).slice(0, 8);

    if (digits.length > 5) {
        return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }

    return digits;
}

function buildFormWithCompanySenderData(baseForm, company, user) {
    const companyData = company?.data || company;
    const address = companyData?.address || {};

    return {
        ...baseForm,
        senderName: companyData?.name || baseForm.senderName,
        senderEmail: companyData?.email || user?.email || baseForm.senderEmail,
        senderPhone: companyData?.phone || user?.phone || baseForm.senderPhone,
        senderZipCode:
            address.postalCode || address.zipCode || baseForm.senderZipCode,
        senderAddress: address.street || baseForm.senderAddress,
        senderNumber: address.number || baseForm.senderNumber,
        senderNeighborhood: address.neighborhood || baseForm.senderNeighborhood,
        senderCity: address.city || baseForm.senderCity,
        senderState: address.state || baseForm.senderState,
    };
}

function hasSenderData(formData) {
    return [
        formData.senderName,
        formData.senderEmail,
        formData.senderPhone,
        formData.senderZipCode,
        formData.senderAddress,
        formData.senderNumber,
        formData.senderNeighborhood,
        formData.senderCity,
        formData.senderState,
    ].some((value) => String(value || "").trim() !== "");
}

export default function NewShipment({ loggedUser, onNavigate }) {
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const [isSearchingSenderZipCode, setIsSearchingSenderZipCode] =
        useState(false);
    const [isSearchingRecipientZipCode, setIsSearchingRecipientZipCode] =
        useState(false);
    const [backendMessage, setBackendMessage] = useState("");
    const [loggedCompany, setLoggedCompany] = useState(null);
    const [senderAutoFillMessage, setSenderAutoFillMessage] = useState("");
    const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);

    const isFormDirty = useMemo(() => {
        return Object.values(form).some((value) => String(value).trim() !== "");
    }, [form]);

    useEffect(() => {
        async function loadCompanyData() {
            if (!loggedUser?.companyId) {
                setLoggedCompany(null);
                return;
            }

            try {
                setIsLoadingCompanyData(true);
                setSenderAutoFillMessage("");

                const response = await getCompanyById(loggedUser.companyId);
                const company = response?.data || response;

                setLoggedCompany(company);

                setForm((previousForm) => {
                    if (hasSenderData(previousForm)) {
                        return previousForm;
                    }

                    return buildFormWithCompanySenderData(
                        previousForm,
                        company,
                        loggedUser
                    );
                });

                setSenderAutoFillMessage(
                    "Remetente preenchido automaticamente com os dados da empresa logada. Você pode editar se a origem for diferente."
                );
            } catch (error) {
                console.error("Erro ao buscar dados da empresa:", error);

                setSenderAutoFillMessage(
                    "Não foi possível preencher o remetente automaticamente. Preencha manualmente."
                );
            } finally {
                setIsLoadingCompanyData(false);
            }
        }

        loadCompanyData();
    }, [loggedUser]);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previousForm) => ({
            ...previousForm,
            [name]: value,
        }));

        setErrors((previousErrors) => ({
            ...previousErrors,
            [name]: "",
        }));

        setSuccessMessage("");
    }

    function validateForm() {
        const newErrors = {};

        Object.entries(requiredFields).forEach(([field, label]) => {
            if (!String(form[field]).trim()) {
                newErrors[field] = `${label} é obrigatório.`;
            }
        });

        if (form.senderEmail && !isValidEmail(form.senderEmail)) {
            newErrors.senderEmail = "Informe um email válido para o remetente.";
        }

        if (form.recipientEmail && !isValidEmail(form.recipientEmail)) {
            newErrors.recipientEmail = "Informe um email válido para o destinatário.";
        }

        if (form.declaredValue && parseCurrencyValue(form.declaredValue) <= 0) {
            newErrors.declaredValue = "O valor declarado precisa ser maior que zero.";
        }

        if (form.senderZipCode && onlyNumbers(form.senderZipCode).length !== 8) {
            newErrors.senderZipCode = "Informe um CEP com 8 dígitos.";
        }

        if (
            form.recipientZipCode &&
            onlyNumbers(form.recipientZipCode).length !== 8
        ) {
            newErrors.recipientZipCode = "Informe um CEP com 8 dígitos.";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    }

    function handleGenerateTrackingCode() {
        setForm((previousForm) => ({
            ...previousForm,
            trackingCode: generateTrackingCode(),
        }));

        setErrors((previousErrors) => ({
            ...previousErrors,
            trackingCode: "",
        }));

        setSuccessMessage("");
    }

    function handleDeclaredValueFocus() {
        setForm((previousForm) => ({
            ...previousForm,
            declaredValue: formatCurrencyForEditing(previousForm.declaredValue),
        }));
    }

    function handleDeclaredValueBlur() {
        setForm((previousForm) => ({
            ...previousForm,
            declaredValue: formatCurrencyBRL(previousForm.declaredValue),
        }));
    }

    async function searchAddressByZipCode(zipCode, type) {
        const cleanZipCode = onlyNumbers(zipCode);

        if (cleanZipCode.length !== 8) {
            return;
        }

        const isSender = type === "sender";
        const zipCodeField = isSender ? "senderZipCode" : "recipientZipCode";

        if (isSender) {
            setIsSearchingSenderZipCode(true);
        } else {
            setIsSearchingRecipientZipCode(true);
        }

        setErrors((previousErrors) => ({
            ...previousErrors,
            [zipCodeField]: "",
        }));

        try {
            const response = await fetch(
                `https://viacep.com.br/ws/${cleanZipCode}/json/`
            );

            if (!response.ok) {
                throw new Error("Erro ao consultar o CEP.");
            }

            const addressData = await response.json();

            if (addressData.erro) {
                setErrors((previousErrors) => ({
                    ...previousErrors,
                    [zipCodeField]: "CEP não encontrado.",
                }));

                return;
            }

            setForm((previousForm) => {
                if (isSender) {
                    return {
                        ...previousForm,
                        senderZipCode:
                            addressData.cep || formatZipCode(cleanZipCode),
                        senderAddress:
                            addressData.logradouro || previousForm.senderAddress,
                        senderNeighborhood:
                            addressData.bairro ||
                            previousForm.senderNeighborhood,
                        senderCity:
                            addressData.localidade || previousForm.senderCity,
                        senderState: addressData.uf || previousForm.senderState,
                    };
                }

                return {
                    ...previousForm,
                    recipientZipCode:
                        addressData.cep || formatZipCode(cleanZipCode),
                    recipientAddress:
                        addressData.logradouro || previousForm.recipientAddress,
                    recipientNeighborhood:
                        addressData.bairro || previousForm.recipientNeighborhood,
                    recipientCity:
                        addressData.localidade || previousForm.recipientCity,
                    recipientState: addressData.uf || previousForm.recipientState,
                };
            });
        } catch {
            setErrors((previousErrors) => ({
                ...previousErrors,
                [zipCodeField]:
                    "Não foi possível consultar o CEP. Tente novamente mais tarde.",
            }));
        } finally {
            if (isSender) {
                setIsSearchingSenderZipCode(false);
            } else {
                setIsSearchingRecipientZipCode(false);
            }
        }
    }

    function handleSenderZipCodeChange(event) {
        const formattedZipCode = formatZipCode(event.target.value);
        const cleanZipCode = onlyNumbers(formattedZipCode);

        setForm((previousForm) => ({
            ...previousForm,
            senderZipCode: formattedZipCode,
        }));

        setErrors((previousErrors) => ({
            ...previousErrors,
            senderZipCode: "",
        }));

        setSuccessMessage("");

        if (cleanZipCode.length === 8) {
            searchAddressByZipCode(cleanZipCode, "sender");
        }
    }

    function handleRecipientZipCodeChange(event) {
        const formattedZipCode = formatZipCode(event.target.value);
        const cleanZipCode = onlyNumbers(formattedZipCode);

        setForm((previousForm) => ({
            ...previousForm,
            recipientZipCode: formattedZipCode,
        }));

        setErrors((previousErrors) => ({
            ...previousErrors,
            recipientZipCode: "",
        }));

        setSuccessMessage("");

        if (cleanZipCode.length === 8) {
            searchAddressByZipCode(cleanZipCode, "recipient");
        }
    }

    function handleSenderZipCodeBlur() {
        const cleanZipCode = onlyNumbers(form.senderZipCode);

        if (cleanZipCode && cleanZipCode.length !== 8) {
            setErrors((previousErrors) => ({
                ...previousErrors,
                senderZipCode: "Informe um CEP com 8 dígitos.",
            }));
        }
    }

    function handleRecipientZipCodeBlur() {
        const cleanZipCode = onlyNumbers(form.recipientZipCode);

        if (cleanZipCode && cleanZipCode.length !== 8) {
            setErrors((previousErrors) => ({
                ...previousErrors,
                recipientZipCode: "Informe um CEP com 8 dígitos.",
            }));
        }
    }

    async function handleTestBackendConnection() {
        try {
            setBackendMessage("Consultando backend...");

            const [ordersResult, deliveriesResult, eventsResult] =
                await Promise.all([
                    getOrders(),
                    getDeliveries(),
                    getDeliveryEvents(),
                ]);

            const totalOrders = ordersResult?.data?.length ?? 0;
            const totalDeliveries = deliveriesResult?.data?.length ?? 0;
            const totalEvents = eventsResult?.data?.length ?? 0;

            setBackendMessage(
                `Backend funcionando. Pedidos: ${totalOrders}. Entregas: ${totalDeliveries}. Eventos: ${totalEvents}.`
            );
        } catch (error) {
            console.error("Erro ao consultar backend:", error);

            setBackendMessage(
                "Não foi possível conectar ao backend. Verifique se as APIs Order e Delivery estão rodando."
            );
        }
    }

    function handleCancel() {
        if (!isFormDirty) {
            return;
        }

        const shouldClear = window.confirm("Deseja limpar todos os campos?");

        if (shouldClear) {
            setForm(
                loggedCompany
                    ? buildFormWithCompanySenderData(
                          initialForm,
                          loggedCompany,
                          loggedUser
                      )
                    : initialForm
            );

            setErrors({});
            setSuccessMessage("");
            setIsSearchingSenderZipCode(false);
            setIsSearchingRecipientZipCode(false);
            setBackendMessage("");

            setSenderAutoFillMessage(
                loggedCompany
                    ? "Remetente preenchido automaticamente com os dados da empresa logada. Você pode editar se a origem for diferente."
                    : ""
            );
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!validateForm()) {
            setSuccessMessage("");
            return;
        }

        if (!loggedUser?.id || !loggedUser?.companyId) {
            alert(
                "Não foi possível cadastrar a encomenda. Faça login com um usuário vinculado a uma empresa."
            );
            return;
        }

        const declaredValue = parseCurrencyValue(form.declaredValue);

        const orderPayload = {
            userId: loggedUser.id,
            companyId: loggedUser.companyId,
            totalPrice: declaredValue,
            status: "CREATED",
            items: [
                {
                    name: form.objectDescription,
                    quantity: 1,
                    price: declaredValue,
                },
            ],
        };

        try {
            const createdOrder = await createOrder(orderPayload);
            const orderId = createdOrder?.data?.id || createdOrder?.id;

            if (!orderId) {
                throw new Error("Pedido criado, mas o ID do pedido não foi retornado.");
            }

            const deliveryPayload = {
                orderId,
                address: {
                    street: form.recipientAddress,
                    number: form.recipientNumber,
                    neighborhood: form.recipientNeighborhood,
                    city: form.recipientCity,
                    state: form.recipientState,
                    postalCode: form.recipientZipCode,
                },
                originAddress: {
                    street: form.senderAddress,
                    number: form.senderNumber,
                    neighborhood: form.senderNeighborhood,
                    city: form.senderCity,
                    state: form.senderState,
                    postalCode: form.senderZipCode,
                },
                trackingCode: form.trackingCode,
                carrier: form.carrier,
                postingDate: form.postingDate
                    ? new Date(form.postingDate).toISOString()
                    : null,
                status: "CREATED",
                estimatedDeliveryDate: null,
            };

            const createdDelivery = await createDelivery(deliveryPayload);
            const deliveryData = createdDelivery?.data || createdDelivery;

            let deliveryId = deliveryData?.id;

            if (!deliveryId) {
                const deliveryByOrder = await getDeliveryByOrderId(orderId);
                const deliveryByOrderData = deliveryByOrder?.data || deliveryByOrder;

                deliveryId =
                    deliveryByOrderData?.delivery?.id ||
                    deliveryByOrderData?.id;
            }

            if (!deliveryId) {
                throw new Error(
                    "Entrega criada, mas não foi possível obter o ID da entrega."
                );
            }

            const deliveryEventPayload = {
                deliveryId,
                orderId,
                status: "CREATED",
                description: "Encomenda cadastrada e entrega criada no sistema.",
                eventType: "DELIVERY_CREATED",
                createdAt: new Date().toISOString(),
                actor: {
                    type: "SYSTEM",
                    id: "siga-frontend",
                },
            };

            await createDeliveryEvent(deliveryEventPayload);

            setSuccessMessage(
                "Encomenda cadastrada com sucesso! Pedido, entrega e evento inicial foram salvos no backend."
            );

            setBackendMessage(
                "Último cadastro enviado para Order, Delivery e DeliveryEvents."
            );

            setForm(
                loggedCompany
                    ? buildFormWithCompanySenderData(
                          initialForm,
                          loggedCompany,
                          loggedUser
                      )
                    : initialForm
            );

            setErrors({});
            setIsSearchingSenderZipCode(false);
            setIsSearchingRecipientZipCode(false);

            setSenderAutoFillMessage(
                loggedCompany
                    ? "Remetente preenchido automaticamente com os dados da empresa logada. Você pode editar se a origem for diferente."
                    : ""
            );
        } catch (error) {
            console.error("Erro ao cadastrar pedido:", error);

            alert(
                "Não foi possível cadastrar a encomenda no backend. Verifique se as APIs Order e Delivery estão rodando."
            );
        }
    }

    return (
        <div className="new-shipment-page">
            <div className="new-shipment-title-row">
                <div>
                    <span className="new-shipment-subtitle">
                        Cadastro de encomenda
                    </span>

                    <h1>Cadastrar Nova Encomenda</h1>

                    <p>
                        Preencha os dados abaixo para registrar uma nova encomenda no
                        sistema de rastreio.
                    </p>
                </div>

                <button
                    type="button"
                    className="new-shipment-secondary-button"
                    onClick={() => onNavigate("dashboard")}
                >
                    Voltar para Dashboard
                </button>
            </div>

            {SHOW_BACKEND_TEST && (
                <div className="new-shipment-backend-test-card">
                    <button
                        type="button"
                        className="new-shipment-secondary-button"
                        onClick={handleTestBackendConnection}
                    >
                        Testar Backend
                    </button>

                    {backendMessage && <span>{backendMessage}</span>}
                </div>
            )}

            {successMessage && (
                <div className="new-shipment-success-message">{successMessage}</div>
            )}

            <form onSubmit={handleSubmit} className="new-shipment-form">
                <section className="new-shipment-card">
                    <div className="new-shipment-card-header">
                        <div>
                            <h2>Informações da Encomenda</h2>
                            <p>Dados principais para identificação e rastreamento.</p>
                        </div>

                        <button
                            type="button"
                            className="new-shipment-secondary-button"
                            onClick={handleGenerateTrackingCode}
                        >
                            Gerar código
                        </button>
                    </div>

                    <div className="new-shipment-grid new-shipment-two-columns">
                        <Input
                            label="Código de rastreio"
                            name="trackingCode"
                            value={form.trackingCode}
                            onChange={handleChange}
                            error={errors.trackingCode}
                            required
                        />

                        <Input
                            label="Transportadora"
                            name="carrier"
                            value={form.carrier}
                            onChange={handleChange}
                            error={errors.carrier}
                            required
                        />

                        <Input
                            label="Descrição do objeto"
                            name="objectDescription"
                            value={form.objectDescription}
                            onChange={handleChange}
                            error={errors.objectDescription}
                            required
                        />

                        <Input
                            label="Data"
                            name="postingDate"
                            type="date"
                            value={form.postingDate}
                            onChange={handleChange}
                            error={errors.postingDate}
                            required
                        />

                        <Input
                            label="Valor declarado"
                            name="declaredValue"
                            type="text"
                            inputMode="decimal"
                            placeholder="R$ 0,00"
                            value={form.declaredValue}
                            onChange={handleChange}
                            onFocus={handleDeclaredValueFocus}
                            onBlur={handleDeclaredValueBlur}
                            error={errors.declaredValue}
                            required
                        />
                    </div>
                </section>

                <section className="new-shipment-grid new-shipment-two-columns">
                    <div className="new-shipment-card">
                        <h2>Remetente</h2>

                        <p className="new-shipment-card-description">
                            Pessoa ou empresa responsável pelo envio da encomenda.
                        </p>

                        {isLoadingCompanyData && (
                            <span className="new-shipment-helper">
                                Carregando dados da empresa...
                            </span>
                        )}

                        {senderAutoFillMessage && (
                            <span className="new-shipment-helper">
                                {senderAutoFillMessage}
                            </span>
                        )}

                        <div className="new-shipment-field-list">
                            <Input
                                label="Nome / Empresa"
                                name="senderName"
                                value={form.senderName}
                                onChange={handleChange}
                                error={errors.senderName}
                                required
                            />

                            <Input
                                label="Email"
                                name="senderEmail"
                                type="email"
                                value={form.senderEmail}
                                onChange={handleChange}
                                error={errors.senderEmail}
                                required
                            />

                            <Input
                                label="Telefone"
                                name="senderPhone"
                                value={form.senderPhone}
                                onChange={handleChange}
                                error={errors.senderPhone}
                            />

                            <Input
                                label="CEP"
                                name="senderZipCode"
                                value={form.senderZipCode}
                                onChange={handleSenderZipCodeChange}
                                onBlur={handleSenderZipCodeBlur}
                                error={errors.senderZipCode}
                                maxLength="9"
                                required
                            />

                            {isSearchingSenderZipCode && (
                                <span className="new-shipment-helper">
                                    Buscando endereço pelo CEP...
                                </span>
                            )}

                            <div className="new-shipment-grid new-shipment-address-number-grid">
                                <Input
                                    label="Endereço"
                                    name="senderAddress"
                                    value={form.senderAddress}
                                    onChange={handleChange}
                                    error={errors.senderAddress}
                                    required
                                />

                                <Input
                                    label="Número"
                                    name="senderNumber"
                                    value={form.senderNumber}
                                    onChange={handleChange}
                                    error={errors.senderNumber}
                                    required
                                />
                            </div>

                            <Input
                                label="Bairro"
                                name="senderNeighborhood"
                                value={form.senderNeighborhood}
                                onChange={handleChange}
                                error={errors.senderNeighborhood}
                            />

                            <div className="new-shipment-grid new-shipment-state-city-grid">
                                <Input
                                    label="Cidade"
                                    name="senderCity"
                                    value={form.senderCity}
                                    onChange={handleChange}
                                    error={errors.senderCity}
                                    required
                                />

                                <Input
                                    label="UF"
                                    name="senderState"
                                    maxLength="2"
                                    value={form.senderState}
                                    onChange={handleChange}
                                    error={errors.senderState}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="new-shipment-card">
                        <h2>Destinatário</h2>

                        <p className="new-shipment-card-description">
                            Pessoa ou empresa que receberá a encomenda.
                        </p>

                        <div className="new-shipment-field-list">
                            <Input
                                label="Nome / Empresa"
                                name="recipientName"
                                value={form.recipientName}
                                onChange={handleChange}
                                error={errors.recipientName}
                                required
                            />

                            <Input
                                label="Email"
                                name="recipientEmail"
                                type="email"
                                value={form.recipientEmail}
                                onChange={handleChange}
                                error={errors.recipientEmail}
                                required
                            />

                            <Input
                                label="Telefone"
                                name="recipientPhone"
                                value={form.recipientPhone}
                                onChange={handleChange}
                                error={errors.recipientPhone}
                            />

                            <Input
                                label="CEP"
                                name="recipientZipCode"
                                value={form.recipientZipCode}
                                onChange={handleRecipientZipCodeChange}
                                onBlur={handleRecipientZipCodeBlur}
                                error={errors.recipientZipCode}
                                maxLength="9"
                                required
                            />

                            {isSearchingRecipientZipCode && (
                                <span className="new-shipment-helper">
                                    Buscando endereço pelo CEP...
                                </span>
                            )}

                            <div className="new-shipment-grid new-shipment-address-number-grid">
                                <Input
                                    label="Endereço"
                                    name="recipientAddress"
                                    value={form.recipientAddress}
                                    onChange={handleChange}
                                    error={errors.recipientAddress}
                                    required
                                />

                                <Input
                                    label="Número"
                                    name="recipientNumber"
                                    value={form.recipientNumber}
                                    onChange={handleChange}
                                    error={errors.recipientNumber}
                                    required
                                />
                            </div>

                            <Input
                                label="Bairro"
                                name="recipientNeighborhood"
                                value={form.recipientNeighborhood}
                                onChange={handleChange}
                                error={errors.recipientNeighborhood}
                            />

                            <div className="new-shipment-grid new-shipment-state-city-grid">
                                <Input
                                    label="Cidade"
                                    name="recipientCity"
                                    value={form.recipientCity}
                                    onChange={handleChange}
                                    error={errors.recipientCity}
                                    required
                                />

                                <Input
                                    label="UF"
                                    name="recipientState"
                                    maxLength="2"
                                    value={form.recipientState}
                                    onChange={handleChange}
                                    error={errors.recipientState}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="new-shipment-actions">
                    <button
                        type="button"
                        className="new-shipment-cancel-button"
                        onClick={handleCancel}
                    >
                        Cancelar
                    </button>

                    <button type="submit" className="new-shipment-primary-button">
                        Cadastrar Encomenda
                    </button>
                </div>
            </form>
        </div>
    );
}

function Input({
    label,
    name,
    type = "text",
    value,
    onChange,
    error,
    required = false,
    ...props
}) {
    return (
        <label className="new-shipment-input-group">
            <span>
                {label} {required && <strong>*</strong>}
            </span>

            <input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                className={error ? "new-shipment-input-error" : ""}
                {...props}
            />

            {error && <small>{error}</small>}
        </label>
    );
}