export function isRequired(value) {
  return String(value || "").trim().length > 0;
}

export function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(email || "").trim().toLowerCase()
  );
}

export function isValidCep(cep) {
  return onlyDigits(cep).length === 8;
}

export function isValidCnpj(cnpj) {
  return onlyDigits(cnpj).length === 14;
}

export function isValidPhone(phone) {
  const cleanPhone = onlyDigits(phone);

  return cleanPhone.length === 10 || cleanPhone.length === 11;
}

export function hasMinLength(value, minLength) {
  return String(value || "").trim().length >= minLength;
}

export function isValidPassword(password, minLength = 6) {
  return hasMinLength(password, minLength);
}

export function isValidUf(uf) {
  return /^[A-Za-z]{2}$/.test(String(uf || "").trim());
}

export function isAddressComplete(address) {
  if (!address) {
    return false;
  }

  return Boolean(
    isRequired(address.street) &&
      isRequired(address.number) &&
      isRequired(address.neighborhood) &&
      isRequired(address.city) &&
      isValidUf(address.state) &&
      isValidCep(address.postalCode)
  );
}

export function getRequiredFieldMessage(fieldName) {
  return `Informe ${fieldName}.`;
}