function cleanText(value) {
  return String(value || "").trim();
}

export function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function buildAddress({
  street,
  number,
  neighborhood,
  city,
  state,
  postalCode,
}) {
  return {
    street: cleanText(street),
    number: cleanText(number),
    neighborhood: cleanText(neighborhood),
    city: cleanText(city),
    state: cleanText(state).toUpperCase(),
    postalCode: onlyDigits(postalCode),
  };
}

export function isAddressComplete(address) {
  if (!address) {
    return false;
  }

  return Boolean(
    cleanText(address.street) &&
      cleanText(address.number) &&
      cleanText(address.neighborhood) &&
      cleanText(address.city) &&
      cleanText(address.state) &&
      onlyDigits(address.postalCode).length === 8
  );
}

export function normalizeAddress(address) {
  if (!address) {
    return null;
  }

  return buildAddress({
    street: address.street || address.logradouro,
    number: address.number || address.numero,
    neighborhood: address.neighborhood || address.bairro,
    city: address.city || address.localidade,
    state: address.state || address.uf,
    postalCode: address.postalCode || address.cep || address.zipCode,
  });
}