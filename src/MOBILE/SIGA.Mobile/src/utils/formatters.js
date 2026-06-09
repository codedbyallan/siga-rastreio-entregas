import { STATUS_LABELS } from "../constants/status";

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function parseDate(date) {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(date);

  return isValidDate(parsedDate) ? parsedDate : null;
}

export function formatDate(date) {
  const parsedDate = parseDate(date);

  if (!parsedDate) {
    return "Não informado";
  }

  return parsedDate.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatDateOnly(date) {
  if (!date) {
    return "Não informado";
  }

  const datePart = String(date).split("T")[0];
  const [year, month, day] = datePart.split("-");

  if (!year || !month || !day) {
    const parsedDate = parseDate(date);

    if (!parsedDate) {
      return "Não informado";
    }

    return parsedDate.toLocaleDateString("pt-BR");
  }

  return `${day}/${month}/${year}`;
}

export function formatAddress(address) {
  if (!address) {
    return "Endereço não informado";
  }

  const street = address.street || address.logradouro;
  const number = address.number || address.numero;
  const neighborhood = address.neighborhood || address.bairro;
  const city = address.city || address.localidade;
  const state = address.state || address.uf;
  const postalCode = address.postalCode || address.cep || address.zipCode;

  const mainAddress = [street, number].filter(Boolean).join(", ");
  const districtAndCity = [neighborhood, city].filter(Boolean).join(" - ");
  const stateAndCep = [state, postalCode].filter(Boolean).join(" - ");

  const formattedAddress = [mainAddress, districtAndCity, stateAndCep]
    .filter(Boolean)
    .join(" | ");

  return formattedAddress || "Endereço não informado";
}

export function formatStatus(status) {
  const normalizedStatus = String(status || "").trim().toUpperCase();

  return STATUS_LABELS[normalizedStatus] || normalizedStatus || "Não informado";
}

export function formatCurrency(value) {
  const numberValue = Number(value || 0);

  return numberValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatNumber(value) {
  const numberValue = Number(value || 0);

  return numberValue.toLocaleString("pt-BR");
}

export function formatCep(value) {
  const cleanValue = String(value || "").replace(/\D/g, "");

  if (cleanValue.length !== 8) {
    return cleanValue || "Não informado";
  }

  return `${cleanValue.slice(0, 5)}-${cleanValue.slice(5)}`;
}

export function formatPhone(value) {
  const cleanValue = String(value || "").replace(/\D/g, "");

  if (cleanValue.length === 11) {
    return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7)}`;
  }

  if (cleanValue.length === 10) {
    return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 6)}-${cleanValue.slice(6)}`;
  }

  return value || "Não informado";
}