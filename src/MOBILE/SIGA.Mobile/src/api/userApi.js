import { apiRequest } from "./apiClient";
import { ROLES } from "../constants/roles";

function cleanText(value) {
  return String(value || "").trim();
}

function getPayload(response) {
  return response?.data || response;
}

function normalizeUserPayload(userData) {
  return {
    ...userData,
    name: cleanText(userData?.name),
    email: cleanText(userData?.email).toLowerCase(),
    password: String(userData?.password || "").trim(),
    role: userData?.role || ROLES.COMPANY_OPERATOR,
    companyId: userData?.companyId || null,
  };
}

function validateUserPayload(payload) {
  if (!payload.name) {
    throw new Error("Informe o nome do usuário.");
  }

  if (!payload.email) {
    throw new Error("Informe o e-mail do usuário.");
  }

  if (!/\S+@\S+\.\S+/.test(payload.email)) {
    throw new Error("Informe um e-mail válido.");
  }

  if (!payload.password) {
    throw new Error("Informe a senha do usuário.");
  }

  if (payload.password.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }

  if (!payload.role) {
    throw new Error("Informe o perfil do usuário.");
  }

  if (
    [ROLES.COMPANY_OPERATOR, ROLES.COURIER].includes(payload.role) &&
    !payload.companyId
  ) {
    throw new Error("Empresa não identificada para este usuário.");
  }
}

export function normalizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    ...user,
    id: user.id || user._id || user.userId,
    userId: user.userId || user.id || user._id,
    companyId: user.companyId || null,
  };
}

export function normalizeUsersResponse(response) {
  const payload = getPayload(response);

  if (!payload) {
    return [];
  }

  const list = Array.isArray(payload)
    ? payload
    : payload.users || payload.couriers || payload.items || [];

  if (!Array.isArray(list)) {
    return [];
  }

  return list.map(normalizeUser).filter(Boolean);
}

export async function createUserApi(userData, token = null) {
  const payload = normalizeUserPayload(userData);

  validateUserPayload(payload);

  return apiRequest({
    path: "/api/users",
    method: "POST",
    body: payload,
    token,
    fallbackMessage: "Não foi possível cadastrar o usuário.",
  });
}

export async function getCouriersByCompanyIdApi(companyId, token) {
  if (!companyId) {
    throw new Error("Empresa não informada para buscar entregadores.");
  }

  const response = await apiRequest({
    path: `/api/users/couriers/company/${encodeURIComponent(companyId)}`,
    token,
    fallbackMessage: "Não foi possível buscar os entregadores da empresa.",
  });

  return normalizeUsersResponse(response);
}

export async function getCouriersApi(token) {
  const response = await apiRequest({
    path: "/api/users/couriers",
    token,
    fallbackMessage: "Não foi possível buscar os entregadores.",
  });

  return normalizeUsersResponse(response);
}

export async function getUserByIdApi(userId, token) {
  if (!userId) {
    throw new Error("ID do usuário não informado.");
  }

  return apiRequest({
    path: `/api/users/${encodeURIComponent(userId)}`,
    token,
    fallbackMessage: "Não foi possível buscar os dados do usuário.",
  });
}

export async function updateUserApi(userId, userData, token) {
  if (!userId) {
    throw new Error("ID do usuário não informado.");
  }

  const payload = {
    name: String(userData?.name || "").trim(),
    email: String(userData?.email || "").toLowerCase().trim(),
  };

  if (userData?.password && userData.password.length >= 6) {
    payload.password = String(userData.password).trim();
  }

  if (!payload.name) {
    throw new Error("Informe o nome do usuário.");
  }

  if (!payload.email) {
    throw new Error("Informe o e-mail do usuário.");
  }

  if (!/\S+@\S+\.\S+/.test(payload.email)) {
    throw new Error("Informe um e-mail válido.");
  }

  return apiRequest({
    path: `/api/users/${encodeURIComponent(userId)}`,
    method: "PUT",
    body: payload,
    token,
    fallbackMessage: "Não foi possível atualizar o perfil do usuário.",
  });
}