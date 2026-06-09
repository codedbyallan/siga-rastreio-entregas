import { apiRequest } from "./apiClient";

const EVENT_TYPE_BY_STATUS = {
  CREATED: "DELIVERY_CREATED",
  POSTED: "DELIVERY_POSTED",
  IN_TRANSIT: "DELIVERY_IN_TRANSIT",
  OUT_FOR_DELIVERY: "DELIVERY_OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERY_DELIVERED",
  CANCELED: "DELIVERY_CANCELED",
};

function getDefaultEventType(status) {
  return EVENT_TYPE_BY_STATUS[status] || "DELIVERY_UPDATED";
}

function getDefaultDescription(status) {
  const descriptions = {
    CREATED: "Encomenda cadastrada e entrega criada no sistema.",
    POSTED: "Encomenda postada.",
    IN_TRANSIT: "Encomenda em trânsito.",
    OUT_FOR_DELIVERY: "Encomenda saiu para entrega.",
    DELIVERED: "Encomenda entregue.",
    CANCELED: "Encomenda cancelada.",
  };

  return descriptions[status] || "Status da entrega atualizado.";
}

function normalizeDeliveryEventPayload(deliveryEventData) {
  const status = deliveryEventData?.status;

  if (!deliveryEventData?.deliveryId) {
    throw new Error("Entrega não informada.");
  }

  if (!deliveryEventData?.orderId) {
    throw new Error("Pedido não informado.");
  }

  if (!status) {
    throw new Error("Status do evento não informado.");
  }

  return {
    deliveryId: deliveryEventData.deliveryId,
    orderId: deliveryEventData.orderId,
    status,
    description:
      deliveryEventData.description?.trim() || getDefaultDescription(status),
    eventType: deliveryEventData.eventType || getDefaultEventType(status),
    actor: deliveryEventData.actor || null,
  };
}

export async function createDeliveryEventApi(deliveryEventData, token) {
  const payload = normalizeDeliveryEventPayload(deliveryEventData);

  return apiRequest({
    path: "/api/delivery-events",
    method: "POST",
    body: payload,
    token,
    fallbackMessage: "Erro ao cadastrar evento de entrega.",
  });
}

export async function getDeliveryEventsByDeliveryIdApi(deliveryId, token) {
  if (!deliveryId) {
    throw new Error("Entrega não informada.");
  }

  return apiRequest({
    path: `/api/delivery-events/delivery/${encodeURIComponent(deliveryId)}`,
    token,
    fallbackMessage: "Não foi possível buscar o histórico da entrega.",
  });
}