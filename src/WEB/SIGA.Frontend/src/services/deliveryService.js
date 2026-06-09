import { getAuthHeaders } from "./authService";

const GATEWAY_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function createDelivery(deliveryData) {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/deliveries`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(deliveryData),
  });

  const responseText = await response.text();

  if (!response.ok) {
    let responseBody = null;

    try {
      responseBody = responseText ? JSON.parse(responseText) : null;
    } catch {
      responseBody = null;
    }

    const errorMessage =
      responseBody?.errors?.[0]?.errorMessage ||
      responseBody?.message ||
      responseText ||
      "Erro ao cadastrar entrega.";

    throw new Error(errorMessage);
  }

  return responseText ? JSON.parse(responseText) : null;
}

export async function getDeliveries() {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/deliveries`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar entregas.");
  }

  return response.json();
}

export async function getDeliveriesByCourierId(courierId) {
  if (!courierId) {
    throw new Error("Entregador não informado.");
  }

  const response = await fetch(
    `${GATEWAY_BASE_URL}/api/deliveries/courier/${encodeURIComponent(courierId)}`,
    {
      headers: getAuthHeaders(),
    }
  );

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      responseBody?.errors?.[0]?.errorMessage ||
      responseBody?.message ||
      "Não foi possível buscar as entregas do entregador.";

    throw new Error(errorMessage);
  }

  return responseBody;
}

export async function getDeliveryByOrderId(orderId) {
  if (!orderId) {
    throw new Error("Pedido não informado.");
  }

  const response = await fetch(
    `${GATEWAY_BASE_URL}/api/deliveries/order/${encodeURIComponent(orderId)}`,
    {
      headers: getAuthHeaders(),
    }
  );

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      responseBody?.errors?.[0]?.errorMessage ||
      responseBody?.message ||
      "Não foi possível buscar os detalhes da encomenda.";

    throw new Error(errorMessage);
  }

  return responseBody;
}

export async function assignCourierToDelivery(deliveryId, courierId) {
  if (!deliveryId) {
    throw new Error("Entrega não informada.");
  }

  if (!courierId) {
    throw new Error("Entregador não informado.");
  }

  const response = await fetch(
    `${GATEWAY_BASE_URL}/api/deliveries/${encodeURIComponent(deliveryId)}/assign-courier`,
    {
      method: "PATCH",
      headers: getAuthHeaders(true),
      body: JSON.stringify({ courierId }),
    }
  );

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      responseBody?.errors?.[0]?.errorMessage ||
      responseBody?.message ||
      "Não foi possível atribuir o entregador.";

    throw new Error(errorMessage);
  }

  return responseBody;
}