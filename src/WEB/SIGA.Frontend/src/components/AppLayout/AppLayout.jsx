import { useState, useEffect, useRef } from "react";
import "./AppLayout.css";

export default function AppLayout({
    loggedUser,
    activeView,
    onNavigate,
    onLogout,
    children,
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const userName = loggedUser?.name || "Usuário";
    const userRole = String(loggedUser?.role || "").trim().toLowerCase();
    const isAdmin = userRole === "admin";
    const isCourier = userRole === "courier";

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [isDropdownOpen]);

    function handleEditProfile() {
        onNavigate("profile-edit");
        setIsDropdownOpen(false);
    }

    function handleLogout() {
        setIsDropdownOpen(false);
        onLogout();
    }

    return (
        <main className="app-layout-page">
            <header className="app-layout-header">
                <div className="app-layout-brand">
                    <div className="app-layout-logo">
                        <img src="/siga-logo.png" alt="Logo SIGA" />
                    </div>

                    <div>
                        <span className="app-layout-brand-name">SIGA</span>
                        <span className="app-layout-brand-subtitle">
                            Sistema de Gestão de Entregas
                        </span>
                    </div>
                </div>

                <div className="app-layout-user">
                    <div className="app-layout-user-dropdown" ref={dropdownRef}>
                        <button
                            type="button"
                            className="app-layout-user-button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            👤 {userName}
                            {isAdmin ? " (Admin)" : isCourier ? " (Entregador)" : ""}
                        </button>

                        {isDropdownOpen && (
                            <div className="app-layout-user-menu">
                                <button
                                    type="button"
                                    className="app-layout-user-menu-item"
                                    onClick={handleEditProfile}
                                >
                                    ✏️ Editar Perfil
                                </button>

                                <button
                                    type="button"
                                    className="app-layout-user-menu-item app-layout-user-menu-logout"
                                    onClick={handleLogout}
                                >
                                    🚪 Sair
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="app-layout-body">
                <aside className="app-layout-sidebar">
                    <nav className="app-layout-menu">
                        {isAdmin ? (
                            <>
                                <button
                                    type="button"
                                    className={
                                        activeView === "admin-dashboard" ? "active" : ""
                                    }
                                    onClick={() => onNavigate("admin-dashboard")}
                                >
                                    📊 Dashboard
                                </button>

                                <button
                                    type="button"
                                    className={
                                        activeView === "admin-companies" ? "active" : ""
                                    }
                                    onClick={() => onNavigate("admin-companies")}
                                >
                                    🏢 Empresas
                                </button>

                                <button
                                    type="button"
                                    className={
                                        activeView === "unassigned-shipments"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() => onNavigate("unassigned-shipments")}
                                >
                                    📦 Pendentes de entregador
                                </button>

                                <button
                                    type="button"
                                    className={
                                        activeView === "admin-couriers" ? "active" : ""
                                    }
                                    onClick={() => onNavigate("admin-couriers")}
                                >
                                    🚚 Entregadores
                                </button>

                                <button
                                    type="button"
                                    className={activeView === "reports" ? "active" : ""}
                                    onClick={() => onNavigate("reports")}
                                >
                                    📊 Relatórios
                                </button>

                                <button type="button" disabled>
                                    ⚙️ Configurações
                                </button>
                            </>
                        ) : isCourier ? (
                            <>
                                <button
                                    type="button"
                                    className={
                                        activeView === "courier-deliveries"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() => onNavigate("courier-deliveries")}
                                >
                                    🚚 Minhas Entregas
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className={activeView === "dashboard" ? "active" : ""}
                                    onClick={() => onNavigate("dashboard")}
                                >
                                    📊 Dashboard
                                </button>

                                <button
                                    type="button"
                                    className={activeView === "shipments" ? "active" : ""}
                                    onClick={() => onNavigate("shipments")}
                                >
                                    📦 Minhas Encomendas
                                </button>

                                <button
                                    type="button"
                                    className={activeView === "reports" ? "active" : ""}
                                    onClick={() => onNavigate("reports")}
                                >
                                    📊 Relatórios
                                </button>

                                <button
                                    type="button"
                                    className={activeView === "tracking" ? "active" : ""}
                                    onClick={() => onNavigate("tracking")}
                                >
                                    🔎 Rastrear Encomenda
                                </button>
                            </>
                        )}
                    </nav>
                </aside>

                <section className="app-layout-content">{children}</section>
            </div>
        </main>
    );
}