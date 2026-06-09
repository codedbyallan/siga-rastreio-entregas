import {
  COURIER_ALLOWED_TRANSITIONS,
  OPERATOR_ALLOWED_TRANSITIONS,
  FINAL_STATUSES,
  STATUS_LABELS,
} from "../constants/status";
import { ROLES } from "../constants/roles";

export function normalizeStatus(status) {
  return String(status || "").trim().toUpperCase();
}

export function getAllowedNextStatuses(role, currentStatus) {
  const normalizedStatus = normalizeStatus(currentStatus);

  if (!normalizedStatus) {
    return [];
  }

  if (role === ROLES.COURIER) {
    return COURIER_ALLOWED_TRANSITIONS[normalizedStatus] || [];
  }

  if (role === ROLES.COMPANY_OPERATOR) {
    return OPERATOR_ALLOWED_TRANSITIONS[normalizedStatus] || [];
  }

  return [];
}

export function canUpdateStatus(role, currentStatus) {
  return getAllowedNextStatuses(role, currentStatus).length > 0;
}

export function isFinalStatus(status) {
  const normalizedStatus = normalizeStatus(status);
  return FINAL_STATUSES.includes(normalizedStatus);
}

export function getStatusLabel(status) {
  const normalizedStatus = normalizeStatus(status);
  return STATUS_LABELS[normalizedStatus] || normalizedStatus || "Não informado";
}

export function canTransitionTo(role, currentStatus, nextStatus) {
  const normalizedNextStatus = normalizeStatus(nextStatus);

  if (!normalizedNextStatus) {
    return false;
  }

  return getAllowedNextStatuses(role, currentStatus).includes(normalizedNextStatus);
}

export function getNextStatusOptions(role, currentStatus) {
  return getAllowedNextStatuses(role, currentStatus).map((status) => ({
    value: status,
    label: getStatusLabel(status),
  }));
}