export const ROLES = {
  ADMIN: "admin",
  COMPANY_OPERATOR: "company_operator",
  COURIER: "courier",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Administrador",
  [ROLES.COMPANY_OPERATOR]: "Operador da empresa",
  [ROLES.COURIER]: "Entregador",
};

export const SUPPORTED_MOBILE_ROLES = [
  ROLES.COMPANY_OPERATOR,
  ROLES.COURIER,
];

export function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

export function isSupportedMobileRole(role) {
  return SUPPORTED_MOBILE_ROLES.includes(normalizeRole(role));
}

export function getRoleLabel(role) {
  const normalizedRole = normalizeRole(role);
  return ROLE_LABELS[normalizedRole] || "Perfil não informado";
}