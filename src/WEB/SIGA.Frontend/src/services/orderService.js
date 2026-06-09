import { getAuthHeaders } from "./authService";

const GATEWAY_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function getOrders() {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/orders`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar pedidos.");
  }

  return response.json();
}

export async function getOrdersByCompanyId(companyId) {
  if (!companyId) {
    throw new Error("Empresa não identificada.");
  }

  const response = await fetch(`${GATEWAY_BASE_URL}/api/orders/company/${companyId}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar pedidos da empresa.");
  }

  return response.json();
}

export async function createOrder(orderData) {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/orders`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    throw new Error("Erro ao cadastrar pedido.");
  }

  return response.json();
}