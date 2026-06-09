import { apiRequest } from "./apiClient";

function getPayload(response) {
  return response?.data || response;
}

function normalizeOrderPayload(orderData) {
  const totalPrice = Number(orderData?.totalPrice) || 0;

  return {
    userId: orderData?.userId,
    companyId: orderData?.companyId,
    totalPrice,
    status: orderData?.status || "CREATED",
    items: Array.isArray(orderData?.items) ? orderData.items : [],
  };
}

function validateOrderPayload(payload) {
  if (!payload.userId) {
    throw new Error("Usuário não identificado.");
  }

  if (!payload.companyId) {
    throw new Error("Empresa não identificada.");
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error("Informe ao menos um item para o pedido.");
  }

  const invalidItem = payload.items.find(
    (item) =>
      !String(item?.name || "").trim() ||
      Number(item?.quantity) <= 0 ||
      Number(item?.price) < 0
  );

  if (invalidItem) {
    throw new Error("Os itens do pedido possuem dados inválidos.");
  }
}

export function normalizeOrder(order) {
  if (!order) {
    return null;
  }

  return {
    ...order,
    id: order.id || order._id,
    description:
      order.description ||
      order.items?.[0]?.name ||
      "Encomenda",
  };
}

export function normalizeOrdersResponse(response) {
  const payload = getPayload(response);

  if (!payload) {
    return [];
  }

  const list = Array.isArray(payload)
    ? payload
    : payload.orders || payload.items || [];

  if (!Array.isArray(list)) {
    return [];
  }

  return list.map(normalizeOrder).filter(Boolean);
}

export async function createOrderApi(orderData, token) {
  const payload = normalizeOrderPayload(orderData);

  validateOrderPayload(payload);

  return apiRequest({
    path: "/api/orders",
    method: "POST",
    body: payload,
    token,
    fallbackMessage: "Erro ao cadastrar pedido.",
  });
}

export async function getOrdersByCompanyIdApi(companyId, token) {
  if (!companyId) {
    throw new Error("Empresa não identificada.");
  }

  const response = await apiRequest({
    path: `/api/orders/company/${encodeURIComponent(companyId)}`,
    token,
    fallbackMessage: "Erro ao buscar pedidos da empresa.",
  });

  return normalizeOrdersResponse(response);
}

export async function getOrderByIdApi(orderId, token) {
  if (!orderId) {
    throw new Error("Pedido não informado.");
  }

  const response = await apiRequest({
    path: `/api/orders/${encodeURIComponent(orderId)}`,
    token,
    fallbackMessage: "Erro ao buscar pedido.",
  });

  return normalizeOrder(getPayload(response));
}