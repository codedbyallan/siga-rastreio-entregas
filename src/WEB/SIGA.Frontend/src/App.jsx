import { useState } from "react";
import "./App.css";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Home from "./pages/Home/Home";
import AppLayout from "./components/AppLayout/AppLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Shipments from "./pages/Shipments/Shipments";
import ShipmentDetails from "./pages/ShipmentDetails/ShipmentDetails";
import NewShipment from "./pages/NewShipment/NewShipment";
import InternalTracking from "./pages/InternalTracking/InternalTracking";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import AdminCompanyDetails from "./pages/AdminCompanyDetails/AdminCompanyDetails";
import CourierDeliveries from "./pages/CourierDeliveries/CourierDeliveries";
import AdminCouriers from "./pages/AdminCouriers/AdminCouriers";
import AdminCompanies from "./pages/AdminCompanies/AdminCompanies";
import UnassignedShipments from "./pages/UnassignedShipments/UnassignedShipments";
import Reports from "./pages/Reports/Reports";
import UserProfileEdit from "./pages/UserProfileEdit/UserProfileEdit";
import { getLoggedUser, logout as clearAuthData } from "./services/authService";

function normalizeRole(role) {
    return String(role || "").trim().toLowerCase();
}

function isAdminUser(user) {
    return normalizeRole(user?.role) === "admin";
}

function isCourierUser(user) {
    return normalizeRole(user?.role) === "courier";
}

function getInitialInternalView(user) {
    if (isAdminUser(user)) {
        return "admin-dashboard";
    }

    if (isCourierUser(user)) {
        return "courier-deliveries";
    }

    return "dashboard";
}

function App() {
    const [loggedUser, setLoggedUser] = useState(() => getLoggedUser());
    const [authView, setAuthView] = useState("home");
    const [internalView, setInternalView] = useState(() =>
        getInitialInternalView(getLoggedUser())
    );
    const [selectedShipmentOrder, setSelectedShipmentOrder] = useState(null);
    const [selectedAdminCompany, setSelectedAdminCompany] = useState(null);

    function handleLoginSuccess(user) {
        setLoggedUser(user);
        setInternalView(getInitialInternalView(user));
        setSelectedShipmentOrder(null);
        setSelectedAdminCompany(null);
    }

    function handleInternalNavigate(nextView, payload = null) {
        if (isCourierUser(loggedUser)) {
            if (nextView === "shipment-details") {
                setSelectedShipmentOrder(payload);
                setSelectedAdminCompany(null);
                setInternalView("shipment-details");
                return;
            }

            setSelectedShipmentOrder(null);
            setSelectedAdminCompany(null);
            setInternalView("courier-deliveries");
            return;
        }

        if (
            isAdminUser(loggedUser) &&
            ["dashboard", "shipments", "tracking", "new-shipment"].includes(nextView)
        ) {
            setSelectedShipmentOrder(null);
            setSelectedAdminCompany(null);
            setInternalView("admin-dashboard");
            return;
        }

        if (nextView === "profile-edit") {
            setSelectedShipmentOrder(null);
            setSelectedAdminCompany(null);
            setInternalView("profile-edit");
            return;
        }

        if (nextView === "shipment-details") {
            setSelectedShipmentOrder(payload);
        }

        if (nextView === "shipments") {
            setSelectedShipmentOrder(null);
        }

        if (nextView === "admin-company-details") {
            setSelectedAdminCompany(payload);
            setSelectedShipmentOrder(null);
        }

        if (nextView === "admin-dashboard") {
            setSelectedAdminCompany(null);
            setSelectedShipmentOrder(null);
        }

        if (nextView === "admin-companies") {
            setSelectedAdminCompany(null);
            setSelectedShipmentOrder(null);
        }

        if (nextView === "admin-couriers") {
            setSelectedAdminCompany(payload);
            setSelectedShipmentOrder(null);
        }

        if (nextView === "unassigned-shipments") {
            setSelectedAdminCompany(null);
            setSelectedShipmentOrder(null);
        }

        if (nextView === "reports") {
            setSelectedAdminCompany(null);
            setSelectedShipmentOrder(null);
        }

        if (nextView === "courier-deliveries") {
            setSelectedShipmentOrder(null);
            setSelectedAdminCompany(null);
        }

        setInternalView(nextView);
    }

    function handleLogout() {
        clearAuthData();
        setLoggedUser(null);
        setSelectedShipmentOrder(null);
        setSelectedAdminCompany(null);
        setInternalView("dashboard");
        setAuthView("home");
    }

    if (!loggedUser) {
        if (authView === "login") {
            return (
                <Login
                    onLoginSuccess={handleLoginSuccess}
                    onRegisterClick={() => setAuthView("register")}
                />
            );
        }

        if (authView === "register") {
            return (
                <Register
                    onBackToLogin={() => setAuthView("login")}
                    onRegisterSuccess={() => setAuthView("login")}
                />
            );
        }

        return (
            <Home
                onLoginClick={() => setAuthView("login")}
                onRegisterClick={() => setAuthView("register")}
            />
        );
    }

    if (internalView === "admin-dashboard") {
        return (
            <AppLayout
                loggedUser={loggedUser}
                activeView="admin-dashboard"
                onNavigate={handleInternalNavigate}
                onLogout={handleLogout}
            >
                <AdminDashboard onNavigate={handleInternalNavigate} />
            </AppLayout>
        );
    }

    if (internalView === "admin-companies") {
        return (
            <AppLayout
                loggedUser={loggedUser}
                activeView="admin-companies"
                onNavigate={handleInternalNavigate}
                onLogout={handleLogout}
            >
                <AdminCompanies onNavigate={handleInternalNavigate} />
            </AppLayout>
        );
    }

    if (internalView === "admin-couriers") {
        return (
            <AppLayout
                loggedUser={loggedUser}
                activeView="admin-couriers"
                onNavigate={handleInternalNavigate}
                onLogout={handleLogout}
            >
                <AdminCouriers selectedCompany={selectedAdminCompany} />
            </AppLayout>
        );
    }

    if (internalView === "unassigned-shipments") {
        return (
            <AppLayout
                loggedUser={loggedUser}
                activeView="unassigned-shipments"
                onNavigate={handleInternalNavigate}
                onLogout={handleLogout}
            >
                <UnassignedShipments
                    loggedUser={loggedUser}
                    onNavigate={handleInternalNavigate}
                />
            </AppLayout>
        );
    }

    if (internalView === "reports") {
        return (
            <AppLayout
                loggedUser={loggedUser}
                activeView="reports"
                onNavigate={handleInternalNavigate}
                onLogout={handleLogout}
            >
                <Reports loggedUser={loggedUser} />
            </AppLayout>
        );
    }

    if (internalView === "admin-company-details") {
        return (
            <AppLayout
                loggedUser={loggedUser}
                activeView="admin-companies"
                onNavigate={handleInternalNavigate}
                onLogout={handleLogout}
            >
                <AdminCompanyDetails
                    selectedCompany={selectedAdminCompany}
                    onNavigate={handleInternalNavigate}
                />
            </AppLayout>
        );
    }

    if (internalView === "courier-deliveries") {
        return (
            <AppLayout
                loggedUser={loggedUser}
                activeView="courier-deliveries"
                onNavigate={handleInternalNavigate}
                onLogout={handleLogout}
            >
                <CourierDeliveries
                    loggedUser={loggedUser}
                    onNavigate={handleInternalNavigate}
                />
            </AppLayout>
        );
    }

    if (internalView === "dashboard") {
        return (
            <AppLayout
                loggedUser={loggedUser}
                activeView={internalView}
                onNavigate={handleInternalNavigate}
                onLogout={handleLogout}
            >
                <Dashboard
                    loggedUser={loggedUser}
                    onNavigate={handleInternalNavigate}
                />
            </AppLayout>
        );
    }

    if (internalView === "shipments") {
        return (
            <AppLayout
                loggedUser={loggedUser}
                activeView={internalView}
                onNavigate={handleInternalNavigate}
                onLogout={handleLogout}
            >
                <Shipments
                    loggedUser={loggedUser}
                    onNavigate={handleInternalNavigate}
                />
            </AppLayout>
        );
    }

    if (internalView === "shipment-details") {
        return (
            <AppLayout
                loggedUser={loggedUser}
                activeView={
                    isAdminUser(loggedUser)
                        ? "unassigned-shipments"
                        : isCourierUser(loggedUser)
                          ? "courier-deliveries"
                          : "shipments"
                }
                onNavigate={handleInternalNavigate}
                onLogout={handleLogout}
            >
                <ShipmentDetails
                    selectedOrder={selectedShipmentOrder}
                    loggedUser={loggedUser}
                    onNavigate={handleInternalNavigate}
                />
            </AppLayout>
        );
    }


    if (internalView === "new-shipment") {
        return (
            <AppLayout
                loggedUser={loggedUser}
                activeView="new-shipment"
                onNavigate={handleInternalNavigate}
                onLogout={handleLogout}
            >
                <NewShipment
                    loggedUser={loggedUser}
                    onNavigate={handleInternalNavigate}
                />
            </AppLayout>
        );
    }

    if (internalView === "tracking") {
        return (
            <AppLayout
                loggedUser={loggedUser}
                activeView="tracking"
                onNavigate={handleInternalNavigate}
                onLogout={handleLogout}
            >
                <InternalTracking />
            </AppLayout>
        );
    }

    if (internalView === "profile-edit") {
        return (
            <AppLayout
                loggedUser={loggedUser}
                activeView="profile-edit"
                onNavigate={handleInternalNavigate}
                onLogout={handleLogout}
            >
                <UserProfileEdit
                    loggedUser={loggedUser}
                    onNavigate={handleInternalNavigate}
                />
            </AppLayout>
        );
    }

    if (isAdminUser(loggedUser)) {
        return (
            <AppLayout
                loggedUser={loggedUser}
                activeView="admin-dashboard"
                onNavigate={handleInternalNavigate}
                onLogout={handleLogout}
            >
                <AdminDashboard onNavigate={handleInternalNavigate} />
            </AppLayout>
        );
    }

    if (isCourierUser(loggedUser)) {
        return (
            <AppLayout
                loggedUser={loggedUser}
                activeView="courier-deliveries"
                onNavigate={handleInternalNavigate}
                onLogout={handleLogout}
            >
                <CourierDeliveries
                    loggedUser={loggedUser}
                    onNavigate={handleInternalNavigate}
                />
            </AppLayout>
        );
    }

    return (
        <AppLayout
            loggedUser={loggedUser}
            activeView="new-shipment"
            onNavigate={handleInternalNavigate}
            onLogout={handleLogout}
        >
            <NewShipment
                loggedUser={loggedUser}
                onNavigate={handleInternalNavigate}
            />
        </AppLayout>
    );
}

export default App;
