import { apiRequest } from "./apiClient";

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeCompanyPayload(companyData) {
  return {
    ...companyData,
    name: cleanText(companyData?.name),
    cnpj: cleanText(companyData?.cnpj),
    phone: cleanText(companyData?.phone),
    address: companyData?.address || null,
  };
}

export async function createCompanyApi(companyData, token = null) {
  const payload = normalizeCompanyPayload(companyData);

  if (!payload.name) {
    throw new Error("Informe o nome da empresa.");
  }

  if (!payload.cnpj) {
    throw new Error("Informe o CNPJ da empresa.");
  }

  return apiRequest({
    path: "/api/companies",
    method: "POST",
    body: payload,
    token,
    fallbackMessage: "Não foi possível cadastrar a empresa.",
  });
}

export async function getCompanyByIdApi(companyId, token) {
  if (!companyId) {
    throw new Error("Empresa não identificada.");
  }

  return apiRequest({
    path: `/api/companies/${encodeURIComponent(companyId)}`,
    token,
    fallbackMessage: "Não foi possível buscar os dados da empresa.",
  });
}

// Mantido apenas para uso futuro/admin.
// No fluxo atual do operador mobile, a tela de perfil da empresa fica somente leitura.
export async function updateCompanyApi(companyId, companyData, token) {
  if (!companyId) {
    throw new Error("Empresa não identificada.");
  }

  return apiRequest({
    path: `/api/companies/${encodeURIComponent(companyId)}`,
    method: "PUT",
    body: normalizeCompanyPayload(companyData),
    token,
    fallbackMessage: "Não foi possível atualizar a empresa.",
  });
}