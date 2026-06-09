import { apiRequest } from "./apiClient";

function getPayload(response) {
  return response?.data || response;
}

export function normalizeDelivery(delivery) {
  if (!delivery) {
    return null;
  }

  return {
    ...delivery,

    // Compatibilidade com telas que usam destinationAddress
    destinationAddress: delivery.destinationAddress || delivery.address || null,

    // Mantém o nome real do backend também
    address: delivery.address || delivery.destinationAddress || null,

    originAddress: delivery.originAddress || null,
  };
}

export function normalizeDeliveryTrackingResponse(response) {
  const payload = getPayload(response);

  if (!payload) {
    return null;
  }

  const delivery = normalizeDelivery(payload.delivery || payload);
  const events = payload.events || delivery?.events || [];

  return {
    ...delivery,
    events,

    // Mantém compatibilidade com telas que esperam result.delivery
    delivery,
  };
}

export function normalizeDeliveriesList(response) {
  const payload = getPayload(response);

  if (!payload) {
    return [];
  }

  const list = Array.isArray(payload)
    ? payload
    : payload.deliveries || payload.data || [];

  if (!Array.isArray(list)) {
    return [];
  }

  return list.map((delivery) => normalizeDelivery(delivery));
}

export async function createDeliveryApi(deliveryData, token) {
  return apiRequest({
    path: "/api/deliveries",
    method: "POST",
    body: deliveryData,
    token,
    fallbackMessage: "Erro ao cadastrar entrega.",
  });
}

export async function getDeliveryByOrderIdApi(orderId, token) {
  if (!orderId) {
    throw new Error("Pedido não informado.");
  }

  const response = await apiRequest({
    path: `/api/deliveries/order/${encodeURIComponent(orderId)}`,
    token,
    fallbackMessage: "Não foi possível buscar os detalhes da encomenda.",
  });

  return normalizeDeliveryTrackingResponse(response);
}

export async function getDeliveriesByCourierIdApi(courierId, token) {
  if (!courierId) {
    throw new Error("Entregador não informado.");
  }

  const response = await apiRequest({
    path: `/api/deliveries/courier/${encodeURIComponent(courierId)}`,
    token,
    fallbackMessage: "Não foi possível buscar as entregas do entregador.",
  });

  return normalizeDeliveriesList(response);
}

export async function assignCourierToDeliveryApi(deliveryId, courierId, token) {
  if (!deliveryId) {
    throw new Error("Entrega não informada.");
  }

  if (!courierId) {
    throw new Error("Entregador não informado.");
  }

  return apiRequest({
    path: `/api/deliveries/${encodeURIComponent(deliveryId)}/assign-courier`,
    method: "PATCH",
    body: { courierId },
    token,
    fallbackMessage: "Não foi possível atribuir o entregador.",
  });
}