function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function parseCurrencyToNumber(value) {
  if (typeof value === "number") {
    return value;
  }

  const cleanValue = onlyDigits(value);

  return Number(cleanValue || 0) / 100;
}

export function formatCurrencyInput(value) {
  const numberValue = parseCurrencyToNumber(value);

  return numberValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatNumberToCurrency(value) {
  const numberValue = Number(value || 0);

  return numberValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function normalizeCurrencyInput(value) {
  return formatCurrencyInput(value);
}

export function currencyInputToApiValue(value) {
  return parseCurrencyToNumber(value);
}