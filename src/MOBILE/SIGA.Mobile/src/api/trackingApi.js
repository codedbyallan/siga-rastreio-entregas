import { apiRequest } from "./apiClient";
import { normalizeDeliveryTrackingResponse } from "./deliveryApi";

export async function getDeliveryTrackingApi(trackingCode) {
  const cleanTrackingCode = String(trackingCode || "").trim();

  if (!cleanTrackingCode) {
    throw new Error("Informe um código de rastreio.");
  }

  const response = await apiRequest({
    path: `/api/deliveries/tracking/${encodeURIComponent(cleanTrackingCode)}`,
    fallbackMessage: "Não foi possível localizar a encomenda.",
  });

  return normalizeDeliveryTrackingResponse(response);
}