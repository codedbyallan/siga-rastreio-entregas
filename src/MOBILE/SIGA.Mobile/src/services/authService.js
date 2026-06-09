import { authenticateUserApi } from "../api/authApi";
import { ROLES, SUPPORTED_MOBILE_ROLES } from "../constants/roles";
import { clearAuthStorage, saveToken, saveUser } from "./tokenStorage";

function getPayload(response) {
  return response?.data || response;
}

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  const id = user.id || user._id || user.userId || "";
  const role = normalizeRole(user.role);

  return {
    ...user,
    id,
    userId: user.userId || id,
    companyId: user.companyId || user.companyID || null,
    role,
  };
}

function normalizeAuthResponse(response) {
  const payload = getPayload(response);

  const token =
    payload?.token ||
    payload?.accessToken ||
    payload?.jwt ||
    "";

  const user = normalizeUser(payload?.user);

  return {
    token,
    user,
  };
}

export async function loginUser(email, password) {
  const response = await authenticateUserApi(email, password);
  const authData = normalizeAuthResponse(response);

  if (!authData.token || !authData.user) {
    throw new Error("Resposta de autenticação inválida.");
  }

  const role = authData.user.role;

  if (!SUPPORTED_MOBILE_ROLES.includes(role)) {
    const message =
      role === ROLES.ADMIN
        ? "O perfil admin ainda não faz parte do app mobile. Use o painel web."
        : "Perfil de usuário não autorizado no app mobile.";

    throw new Error(message);
  }

  await saveToken(authData.token);
  await saveUser(authData.user);

  return authData;
}

export async function logoutUser() {
  await clearAuthStorage();
}