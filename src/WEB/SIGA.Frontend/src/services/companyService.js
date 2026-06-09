import { getAuthHeaders } from "./authService";

const GATEWAY_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function getCompanies() {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/companies`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error("Não foi possível buscar as empresas.");
  }

  return await response.json();
}

export async function createCompany(companyData) {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/companies`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(companyData)
  });

  if (!response.ok) {
    throw new Error("Não foi possível cadastrar a empresa.");
  }

  return await response.json();
}

export async function getCompanyById(companyId) {
  if (!companyId) {
    throw new Error("Empresa não identificada.");
  }

  const response = await fetch(`${GATEWAY_BASE_URL}/api/companies/${companyId}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error("Não foi possível buscar os dados da empresa.");
  }

  return await response.json();
}

export async function getCompanyByCnpj(cnpj) {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/companies/cnpj/${cnpj}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error("Empresa não encontrada.");
  }

  return await response.json();
}