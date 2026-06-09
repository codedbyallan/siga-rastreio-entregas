import { getAuthHeaders } from "./authService";

const GATEWAY_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function createDeliveryEvent(deliveryEventData) {
    const response = await fetch(`${GATEWAY_BASE_URL}/api/delivery-events`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify(deliveryEventData),
    });

    const responseText = await response.text();

    let responseBody = null;

    try {
        responseBody = responseText ? JSON.parse(responseText) : null;
    } catch {
        responseBody = null;
    }

    if (!response.ok) {
        const errorMessage =
            responseBody?.message ||
            responseBody?.errors?.[0]?.errorMessage ||
            responseText ||
            "Erro ao cadastrar evento de entrega.";

        throw new Error(errorMessage);
    }

    return responseBody;
}

export async function getDeliveryEvents() {
    const response = await fetch(`${GATEWAY_BASE_URL}/api/delivery-events`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Erro ao buscar eventos de entrega.");
    }

    return response.json();
}