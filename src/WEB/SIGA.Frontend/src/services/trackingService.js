const GATEWAY_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function getDeliveryTracking(trackingCode) {
  const cleanTrackingCode = String(trackingCode).trim();

  if (!cleanTrackingCode) {
    throw new Error("Informe um código de rastreio.");
  }

  const response = await fetch(
    `${GATEWAY_BASE_URL}/api/deliveries/tracking/${encodeURIComponent(
      cleanTrackingCode
    )}`
  );

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      responseBody?.errors?.[0]?.errorMessage ||
      "Não foi possível localizar a encomenda.";

    throw new Error(errorMessage);
  }

  return responseBody?.data;
}
