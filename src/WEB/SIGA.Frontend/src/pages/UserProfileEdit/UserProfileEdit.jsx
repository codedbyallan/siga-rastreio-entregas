import { useState, useEffect } from "react";
import { updateUser } from "../../services/userService";
import { getToken } from "../../services/authService";
import "./UserProfileEdit.css";

const GATEWAY_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function UserProfileEdit({ loggedUser, onNavigate }) {
  const address = loggedUser?.address || {};

  const [name, setName] = useState(loggedUser?.name || "");
  const [email, setEmail] = useState(loggedUser?.email || "");
  const [phone, setPhone] = useState(loggedUser?.phone || "");

  const [street, setStreet] = useState(address?.street || "");
  const [number, setNumber] = useState(address?.number || "");
  const [neighborhood, setNeighborhood] = useState(address?.neighborhood || "");
  const [city, setCity] = useState(address?.city || "");
  const [state, setState] = useState(address?.state || "");
  const [postalCode, setPostalCode] = useState(address?.postalCode || "");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    async function loadUserData() {
      try {
        const token = getToken();
        if (!loggedUser?.id || !token) {
          setMessage("Usuário não autenticado.");
          setMessageType("error");
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `${GATEWAY_BASE_URL}/api/users/${encodeURIComponent(loggedUser.id)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const errorMsg =
            data?.message || "Erro ao buscar dados do usuário.";
          setMessage(errorMsg);
          setMessageType("error");
          setIsLoading(false);
          return;
        }

        const userData = data?.data || data;

        setName(userData?.name || "");
        setEmail(userData?.email || "");
        setPhone(userData?.phone || "");

        const userAddress = userData?.address || {};
        setStreet(userAddress?.street || "");
        setNumber(userAddress?.number || "");
        setNeighborhood(userAddress?.neighborhood || "");
        setCity(userAddress?.city || "");
        setState(userAddress?.state || "");
        setPostalCode(userAddress?.postalCode || "");

        setMessage("");
      } catch (error) {
        setMessage(error.message || "Erro ao carregar dados do usuário.");
        setMessageType("error");
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, [loggedUser?.id]);

  function validateForm() {
    if (!name.trim()) {
      return "Informe seu nome completo.";
    }

    if (!email.trim()) {
      return "Informe seu e-mail.";
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return "Informe um e-mail válido.";
    }

    if (password && password.length < 6) {
      return "A senha deve ter pelo menos 6 caracteres.";
    }

    if (password && password !== confirmPassword) {
      return "As senhas não coincidem.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      setMessageType("error");
      return;
    }

    if (!loggedUser?.id) {
      setMessage("Usuário não autenticado. Faça login novamente.");
      setMessageType("error");
      return;
    }

    try {
      setIsLoading(true);

      const addressData = {
        street: street.trim() || null,
        number: number.trim() || null,
        neighborhood: neighborhood.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        postalCode: postalCode.trim() || null,
      };

      // Only include address if at least one field is filled
      const hasAddressData = Object.values(addressData).some(val => val);

      await updateUser(loggedUser.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        ...(hasAddressData && { address: addressData }),
        ...(password && { password: password.trim() }),
      });

      setMessage("Perfil atualizado com sucesso!");
      setMessageType("success");

      setTimeout(() => {
        onNavigate("dashboard");
      }, 2000);
    } catch (error) {
      setMessage(error.message || "Erro ao atualizar perfil.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel() {
    onNavigate("dashboard");
  }

  return (
    <div className="user-profile-edit-page">
      <div className="user-profile-edit-container">
        <h1>Editar Perfil</h1>
        <p className="user-profile-edit-subtitle">Atualize suas informações</p>

        {message && (
          <div className={`user-profile-edit-message ${messageType}`}>
            {messageType === "success" && "✓ "}
            {message}
          </div>
        )}

        {isLoading && !message ? (
          <div className="user-profile-edit-loading">
            <p>Carregando dados do perfil...</p>
          </div>
        ) : (
          <form className="user-profile-edit-form" onSubmit={handleSubmit}>
          <div className="form-section-title">Informações Pessoais</div>

          <div className="form-group">
            <label htmlFor="name">Nome Completo</label>
            <input
              id="name"
              type="text"
              placeholder="Digite seu nome completo"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value.toLowerCase())}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Telefone</label>
            <input
              id="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-section-title">Endereço</div>

          <div className="form-group">
            <label htmlFor="street">Rua</label>
            <input
              id="street"
              type="text"
              placeholder="Nome da rua"
              value={street}
              onChange={(event) => setStreet(event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="number">Número</label>
              <input
                id="number"
                type="text"
                placeholder="123"
                value={number}
                onChange={(event) => setNumber(event.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="neighborhood">Bairro</label>
              <input
                id="neighborhood"
                type="text"
                placeholder="Bairro"
                value={neighborhood}
                onChange={(event) => setNeighborhood(event.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="postalCode">CEP</label>
              <input
                id="postalCode"
                type="text"
                placeholder="12345-678"
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">Cidade</label>
              <input
                id="city"
                type="text"
                placeholder="São Paulo"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="state">Estado (UF)</label>
            <input
              id="state"
              type="text"
              placeholder="SP"
              maxLength="2"
              value={state}
              onChange={(event) => setState(event.target.value.toUpperCase())}
              disabled={isLoading}
            />
          </div>

          <div className="form-section-title">Alterar Senha (Opcional)</div>

          <div className="form-group">
            <label htmlFor="password">Nova Senha</label>
            <input
              id="password"
              type="password"
              placeholder="Deixe em branco para não alterar"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirme a nova senha"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
