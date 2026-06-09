import { useState } from "react";
import { createCompany, getCompanyByCnpj } from "../../services/companyService";
import { createUser } from "../../services/userService";
import "./Register.css";

import logo from "../../assets/login/logo.png";

const initialForm = {
    responsibleName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",

    companyName: "",
    cnpj: "",
    companyPhone: "",
    zipCode: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
};

function onlyNumbers(value) {
    return String(value).replace(/\D/g, "");
}

function formatCnpj(value) {
    const digits = onlyNumbers(value).slice(0, 14);

    return digits
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatZipCode(value) {
    const digits = onlyNumbers(value).slice(0, 8);

    if (digits.length > 5) {
        return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }

    return digits;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export default function Register({ onBackToLogin, onRegisterSuccess }) {
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSearchingZipCode, setIsSearchingZipCode] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        let nextValue = value;

        if (name === "cnpj") {
            nextValue = formatCnpj(value);
        }

        if (name === "zipCode") {
            nextValue = formatZipCode(value);
        }

        setForm((previousForm) => ({
            ...previousForm,
            [name]: nextValue,
        }));

        setErrors((previousErrors) => ({
            ...previousErrors,
            [name]: "",
        }));

        setMessage("");
    }

    function validateForm() {
        const newErrors = {};

        if (!form.responsibleName.trim()) {
            newErrors.responsibleName = "Informe o nome do responsável.";
        }

        if (!form.email.trim()) {
            newErrors.email = "Informe o e-mail.";
        } else if (!isValidEmail(form.email)) {
            newErrors.email = "Informe um e-mail válido.";
        }

        if (!form.password.trim()) {
            newErrors.password = "Informe uma senha.";
        }

        if (form.password.length > 0 && form.password.length < 6) {
            newErrors.password = "A senha deve ter pelo menos 6 caracteres.";
        }

        if (form.confirmPassword !== form.password) {
            newErrors.confirmPassword = "As senhas não conferem.";
        }

        if (!form.companyName.trim()) {
            newErrors.companyName = "Informe o nome da empresa.";
        }

        if (onlyNumbers(form.cnpj).length !== 14) {
            newErrors.cnpj = "Informe um CNPJ com 14 dígitos.";
        }

        if (!form.companyPhone.trim()) {
            newErrors.companyPhone = "Informe o telefone da empresa.";
        }

        if (onlyNumbers(form.zipCode).length !== 8) {
            newErrors.zipCode = "Informe um CEP com 8 dígitos.";
        }

        if (!form.street.trim()) {
            newErrors.street = "Informe o endereço.";
        }

        if (!form.number.trim()) {
            newErrors.number = "Informe o número.";
        }

        if (!form.neighborhood.trim()) {
            newErrors.neighborhood = "Informe o bairro.";
        }

        if (!form.city.trim()) {
            newErrors.city = "Informe a cidade.";
        }

        if (!form.state.trim()) {
            newErrors.state = "Informe a UF.";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    }

    async function searchAddressByZipCode() {
        const cleanZipCode = onlyNumbers(form.zipCode);

        if (cleanZipCode.length !== 8) {
            return;
        }

        try {
            setIsSearchingZipCode(true);

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
                    zipCode: "CEP não encontrado.",
                }));

                return;
            }

            setForm((previousForm) => ({
                ...previousForm,
                zipCode: addressData.cep || previousForm.zipCode,
                street: addressData.logradouro || previousForm.street,
                neighborhood: addressData.bairro || previousForm.neighborhood,
                city: addressData.localidade || previousForm.city,
                state: addressData.uf || previousForm.state,
            }));
        } catch {
            setErrors((previousErrors) => ({
                ...previousErrors,
                zipCode: "Não foi possível consultar o CEP.",
            }));
        } finally {
            setIsSearchingZipCode(false);
        }
    }

    async function getOrCreateCompany() {
        const cleanCnpj = onlyNumbers(form.cnpj);

        try {
            const existingCompany = await getCompanyByCnpj(cleanCnpj);
            const existingCompanyId = existingCompany?.data?.id || existingCompany?.id;

            if (existingCompanyId) {
                return existingCompanyId;
            }
        } catch {
            // Se a empresa não existir, o cadastro segue criando uma nova.
        }

        const companyPayload = {
            name: form.companyName,
            cnpj: cleanCnpj,
            phone: form.companyPhone,
            address: {
                street: form.street,
                number: form.number,
                neighborhood: form.neighborhood,
                city: form.city,
                state: form.state.toUpperCase(),
                postalCode: form.zipCode,
            },
        };

        const createdCompany = await createCompany(companyPayload);
        const companyId = createdCompany?.data?.id || createdCompany?.id;

        if (!companyId) {
            throw new Error("Empresa criada, mas o ID não foi retornado.");
        }

        return companyId;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("");

        if (!validateForm()) {
            return;
        }

        try {
            setIsLoading(true);

            const companyId = await getOrCreateCompany();

            const userPayload = {
                name: form.responsibleName,
                email: form.email,
                password: form.password,
                phone: form.phone,
                role: "company_operator",
                companyId,
                address: {
                    street: form.street,
                    number: form.number,
                    city: form.city,
                    state: form.state.toUpperCase(),
                    postalCode: form.zipCode,
                },
            };

            await createUser(userPayload);

            setMessage("Cadastro realizado com sucesso. Você já pode fazer login.");
            setForm(initialForm);

            if (onRegisterSuccess) {
                setTimeout(() => {
                    onRegisterSuccess();
                }, 1200);
            }
        } catch (error) {
            console.error("Erro ao cadastrar empresa/operador:", error);
            setMessage(error.message || "Não foi possível concluir o cadastro.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="register-page">
            <section className="register-card">
                <aside className="register-brand">
                    <img src={logo} alt="SIGA" className="register-logo" />

                    <h1>Cadastro de Empresa</h1>

                    <p>
                        Cadastre a empresa e o operador responsável para começar a
                        gerenciar encomendas no SIGA.
                    </p>

                    <button
                        type="button"
                        className="register-secondary-button"
                        onClick={onBackToLogin}
                    >
                        Voltar para o login
                    </button>
                </aside>

                <form className="register-form" onSubmit={handleSubmit}>
                    <div className="register-section-title">
                        <span>Dados do operador</span>
                        <h2>Responsável pela conta</h2>
                    </div>

                    <div className="register-grid two-columns">
                        <Input
                            label="Nome completo"
                            name="responsibleName"
                            value={form.responsibleName}
                            onChange={handleChange}
                            error={errors.responsibleName}
                            required
                        />

                        <Input
                            label="E-mail"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            error={errors.email}
                            required
                        />

                        <Input
                            label="Telefone"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            error={errors.phone}
                        />

                        <Input
                            label="Senha"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            error={errors.password}
                            required
                        />

                        <Input
                            label="Confirmar senha"
                            name="confirmPassword"
                            type="password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            error={errors.confirmPassword}
                            required
                        />
                    </div>

                    <div className="register-section-title">
                        <span>Dados da empresa</span>
                        <h2>Empresa vinculada</h2>
                    </div>

                    <div className="register-grid two-columns">
                        <Input
                            label="Nome da empresa"
                            name="companyName"
                            value={form.companyName}
                            onChange={handleChange}
                            error={errors.companyName}
                            required
                        />

                        <Input
                            label="CNPJ"
                            name="cnpj"
                            value={form.cnpj}
                            onChange={handleChange}
                            error={errors.cnpj}
                            maxLength="18"
                            required
                        />

                        <Input
                            label="Telefone da empresa"
                            name="companyPhone"
                            value={form.companyPhone}
                            onChange={handleChange}
                            error={errors.companyPhone}
                            required
                        />

                        <Input
                            label="CEP"
                            name="zipCode"
                            value={form.zipCode}
                            onChange={handleChange}
                            onBlur={searchAddressByZipCode}
                            error={errors.zipCode}
                            maxLength="9"
                            required
                        />

                        <Input
                            label="Endereço"
                            name="street"
                            value={form.street}
                            onChange={handleChange}
                            error={errors.street}
                            required
                        />

                        <Input
                            label="Número"
                            name="number"
                            value={form.number}
                            onChange={handleChange}
                            error={errors.number}
                            required
                        />

                        <Input
                            label="Bairro"
                            name="neighborhood"
                            value={form.neighborhood}
                            onChange={handleChange}
                            error={errors.neighborhood}
                            required
                        />

                        <Input
                            label="Cidade"
                            name="city"
                            value={form.city}
                            onChange={handleChange}
                            error={errors.city}
                            required
                        />

                        <Input
                            label="UF"
                            name="state"
                            value={form.state}
                            onChange={handleChange}
                            error={errors.state}
                            maxLength="2"
                            required
                        />
                    </div>

                    {isSearchingZipCode && (
                        <p className="register-helper">Buscando endereço pelo CEP...</p>
                    )}

                    {message && <p className="register-message">{message}</p>}

                    <div className="register-actions">
                        <button
                            type="button"
                            className="register-cancel-button"
                            onClick={onBackToLogin}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="register-primary-button"
                            disabled={isLoading}
                        >
                            {isLoading ? "Cadastrando..." : "Cadastrar empresa"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
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
        <label className="register-input-group">
            <span>
                {label} {required && <strong>*</strong>}
            </span>

            <input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                className={error ? "register-input-error" : ""}
                {...props}
            />

            {error && <small>{error}</small>}
        </label>
    );
}