import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ROLES } from "../constants/roles";
import { loginUser, logoutUser } from "../services/authService";
import { getToken, getUser } from "../services/tokenStorage";

const AuthContext = createContext(null);

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  const id = user.id || user._id || user.userId || "";
  const companyId = user.companyId || user.companyID || null;

  return {
    ...user,
    id,
    userId: user.userId || id,
    companyId,
    role: user.role || "",
  };
}

function normalizeAuthData(authData) {
  const token = authData?.token || authData?.accessToken || "";
  const user = normalizeUser(authData?.user || authData?.data?.user);

  return {
    token,
    user,
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = await getToken();
        const storedUser = await getUser();

        setToken(storedToken || null);
        setUser(normalizeUser(storedUser));
      } finally {
        setIsInitializing(false);
      }
    }

    loadStoredAuth();
  }, []);

  async function login(email, password) {
    const authData = await loginUser(email, password);
    const normalizedAuthData = normalizeAuthData(authData);

    if (!normalizedAuthData.token || !normalizedAuthData.user) {
      throw new Error("Resposta de autenticação inválida.");
    }

    setToken(normalizedAuthData.token);
    setUser(normalizedAuthData.user);

    return normalizedAuthData;
  }

  async function logout() {
    await logoutUser();

    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => {
    const normalizedUser = normalizeUser(user);
    const role = normalizedUser?.role || "";
    const companyId = normalizedUser?.companyId || null;
    const userId = normalizedUser?.userId || normalizedUser?.id || null;

    return {
      token,
      user: normalizedUser,
      role,
      companyId,
      userId,
      isAuthenticated: Boolean(token && normalizedUser),
      isInitializing,
      isCompanyOperator: role === ROLES.COMPANY_OPERATOR,
      isCourier: role === ROLES.COURIER,
      isAdmin: role === ROLES.ADMIN,
      login,
      logout,
    };
  }, [token, user, isInitializing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}