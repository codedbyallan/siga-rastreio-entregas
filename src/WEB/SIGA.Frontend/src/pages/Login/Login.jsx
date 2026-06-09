import { useState } from "react";
import { authenticateUser, saveAuthData } from "../../services/authService";
import "./Login.css";

import logo from "../../assets/login/logo.png";

export default function Login({ onLoginSuccess, onRegisterClick }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("Informe o e-mail e a senha.");
      return;
    }

    try {
      setIsLoading(true);

      const authData = await authenticateUser(email, password);
      saveAuthData(authData);

      setMessage("Login realizado com sucesso.");

      if (onLoginSuccess) {
        onLoginSuccess(authData.user);
      }
    } catch (error) {
      setMessage(error.message || "Não foi possível realizar o login.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <img src={logo} alt="SIGA" className="login-logo" />
          <h1>Bem-vindo ao SIGA</h1>
          <p>Acesse sua conta para gerenciar e acompanhar encomendas.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            E-mail
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {message && <p className="login-message">{message}</p>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </button>

          <p className="login-register-text">
            Ainda não tem uma conta?{" "}
            <button type="button" onClick={onRegisterClick}>
              Cadastre sua empresa
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}