import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  assignCourierToDeliveryApi,
  getDeliveryByOrderIdApi,
} from "../../api/deliveryApi";
import { createDeliveryEventApi } from "../../api/deliveryEventApi";
import { getOrderByIdApi } from "../../api/orderApi";
import { getCouriersByCompanyIdApi } from "../../api/userApi";
import AddressBlock from "../../components/AddressBlock";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingState from "../../components/LoadingState";
import StatusBadge from "../../components/StatusBadge";
import Timeline from "../../components/Timeline";
import { theme } from "../../config/theme";
import { ROLES } from "../../constants/roles";
import { FINAL_STATUSES, STATUS_LABELS } from "../../constants/status";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { getAllowedNextStatuses } from "../../utils/statusRules";
import { SafeAreaView } from "react-native-safe-area-context";

function getPayload(response) {
  return response?.data || response;
}

function getEntityId(entity) {
  return entity?.id || entity?._id || "";
}

function getOrderDescription(order) {
  if (order?.description) {
    return order.description;
  }

  if (Array.isArray(order?.items) && order.items.length > 0) {
    return order.items[0]?.name || "Encomenda";
  }

  return "Encomenda";
}

function normalizeDeliveryResponse(response) {
  const payload = getPayload(response);

  if (!payload) {
    return null;
  }

  if (payload.delivery) {
    return {
      ...payload.delivery,
      address: payload.delivery.address || payload.delivery.destinationAddress || null,
      destinationAddress:
        payload.delivery.destinationAddress || payload.delivery.address || null,
      originAddress: payload.delivery.originAddress || null,
      events: payload.events || payload.delivery.events || [],
      delivery: payload.delivery,
    };
  }

  return {
    ...payload,
    address: payload.address || payload.destinationAddress || null,
    destinationAddress: payload.destinationAddress || payload.address || null,
    originAddress: payload.originAddress || null,
    events: payload.events || [],
  };
}

export default function ShipmentDetailsScreen({ route, navigation, }) {
  const auth = useAuth();

  const token = auth?.token;
  const role = auth?.role;
  const companyId = auth?.companyId || auth?.user?.companyId;
  const userId = auth?.userId || auth?.user?.id || auth?.user?.userId;

  const {
    order: initialOrder,
    delivery: initialDelivery,
    orderId: initialOrderId,
  } = route.params || {};

  const initialResolvedOrderId =
    initialOrderId ||
    getEntityId(initialOrder) ||
    initialDelivery?.orderId ||
    "";

  const [order, setOrder] = useState(initialOrder || null);
  const [delivery, setDelivery] = useState(
    initialDelivery ? normalizeDeliveryResponse(initialDelivery) : null
  );

  const [loading, setLoading] = useState(Boolean(initialResolvedOrderId));
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState("");
  const [couriers, setCouriers] = useState([]);
  const [showCouriers, setShowCouriers] = useState(false);
  const [couriersLoading, setCouriersLoading] = useState(false);

  const currentOrderId =
    getEntityId(order) ||
    initialResolvedOrderId ||
    delivery?.orderId ||
    "";

  const isOperator = role === ROLES.COMPANY_OPERATOR;

  async function refreshDetails(orderIdToLoad) {
    if (!orderIdToLoad) {
      setLoading(false);
      return;
    }

    try {
      const [freshOrderResponse, freshDeliveryResponse] = await Promise.all([
        getOrderByIdApi(orderIdToLoad, token),
        getDeliveryByOrderIdApi(orderIdToLoad, token),
      ]);

      setOrder(getPayload(freshOrderResponse));
      setDelivery(normalizeDeliveryResponse(freshDeliveryResponse));
    } catch (err) {
      setError(err.message || "Não foi possível carregar os detalhes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshDetails(initialResolvedOrderId);
  }, []);

  function isFinalStatus(status) {
    return FINAL_STATUSES.includes(status);
  }

  function handleStatusUpdate(newStatus) {
    const statusLabel = STATUS_LABELS[newStatus] || newStatus;

    if (isFinalStatus(newStatus)) {
      Alert.alert(
        "Confirmar atualização",
        `Tem certeza que deseja marcar esta entrega como "${statusLabel}"? Essa ação finaliza o fluxo dessa entrega.`,
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Confirmar",
            style: newStatus === "CANCELED" ? "destructive" : "default",
            onPress: () => executeStatusUpdate(newStatus),
          },
        ]
      );

      return;
    }

    executeStatusUpdate(newStatus);
  }

  async function executeStatusUpdate(newStatus) {
    setError("");

    const deliveryId = getEntityId(delivery);
    const orderId = currentOrderId;

    if (!deliveryId) {
      setError("Entrega não encontrada.");
      return;
    }

    if (!orderId) {
      setError("Pedido não encontrado.");
      return;
    }

    setStatusLoading(newStatus);

    try {
      await createDeliveryEventApi(
        {
          deliveryId,
          orderId,
          status: newStatus,
          description: STATUS_LABELS[newStatus] || "Status atualizado.",
          actor: userId
            ? {
                type: role,
                id: userId,
              }
            : null,
        },
        token
      );

      await refreshDetails(orderId);
    } catch (err) {
      setError(err.message || "Não foi possível atualizar o status.");
    } finally {
      setStatusLoading("");
    }
  }

  async function loadCouriers() {
    setError("");

    if (!companyId) {
      setError("Empresa não identificada.");
      return;
    }

    setCouriersLoading(true);

    try {
      const data = await getCouriersByCompanyIdApi(companyId, token);
      const payload = getPayload(data);

      setCouriers(Array.isArray(payload) ? payload : []);
      setShowCouriers(true);
    } catch (err) {
      setError(err.message || "Não foi possível carregar entregadores.");
    } finally {
      setCouriersLoading(false);
    }
  }

  async function handleAssignCourier(courierId) {
    setError("");

    const deliveryId = getEntityId(delivery);
    const orderId = currentOrderId;

    if (!deliveryId) {
      setError("Entrega não encontrada.");
      return;
    }

    if (!courierId) {
      setError("Entregador não informado.");
      return;
    }

    setActionLoading(true);
    setShowCouriers(false);

    try {
      await assignCourierToDeliveryApi(deliveryId, courierId, token);

      if (orderId) {
        await refreshDetails(orderId);
      }
    } catch (err) {
      setError(err.message || "Não foi possível atribuir o entregador.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  const currentStatus = delivery?.status || order?.status;
  const allowedNext = getAllowedNextStatuses(role, currentStatus);
  const deliveryHasFinalStatus = isFinalStatus(currentStatus);
  const canAssignCourier =
    isOperator && delivery && !delivery.courierId && !deliveryHasFinalStatus;
  const events = delivery?.events || [];
  const originAddress = delivery?.originAddress || order?.originAddress;
  const destinationAddress =
    delivery?.destinationAddress ||
    delivery?.address ||
    order?.destinationAddress ||
    order?.address;

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>
            Detalhes da Encomenda
          </Text>

          <Text style={styles.subtitle}>
            Informações da entrega
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backHeaderButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backHeaderButtonText}>
            ← Voltar
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.tracking}>
              {delivery?.trackingCode || order?.trackingCode || "—"}
            </Text>

            <StatusBadge status={currentStatus} />
          </View>

          <Text style={styles.description}>{getOrderDescription(order)}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              Criado em: {formatDate(order?.createdAt || delivery?.createdAt)}
            </Text>

            <Text style={styles.meta}>{formatCurrency(order?.totalPrice)}</Text>
          </View>
        </View>

        <ErrorMessage message={error} />

        {order?.senderName && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Remetente</Text>
            <Text style={styles.infoValue}>{order.senderName}</Text>

            {order.senderPhone && (
              <Text style={styles.infoSub}>{order.senderPhone}</Text>
            )}
          </View>
        )}

        {order?.recipientName && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Destinatário</Text>
            <Text style={styles.infoValue}>{order.recipientName}</Text>

            {order.recipientPhone && (
              <Text style={styles.infoSub}>{order.recipientPhone}</Text>
            )}
          </View>
        )}

        {originAddress && <AddressBlock title="Origem" address={originAddress} />}

        {destinationAddress && (
          <AddressBlock title="Destino" address={destinationAddress} />
        )}

        {canAssignCourier && (
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Entregador</Text>
            <Text style={styles.actionSub}>Nenhum entregador atribuído</Text>

            {showCouriers ? (
              <View style={{ gap: 8 }}>
                {couriers.map((courier) => (
                  <TouchableOpacity
                    key={courier.id}
                    style={styles.courierOption}
                    onPress={() => handleAssignCourier(courier.id)}
                    disabled={actionLoading || Boolean(statusLoading)}
                  >
                    <Text style={styles.courierOptionName}>{courier.name}</Text>
                    <Text style={styles.courierOptionEmail}>{courier.email}</Text>
                  </TouchableOpacity>
                ))}

                {couriers.length === 0 && (
                  <Text style={styles.actionSub}>
                    Nenhum entregador disponível.
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.cancelChip}
                  onPress={() => setShowCouriers(false)}
                >
                  <Text style={styles.cancelChipText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.assignBtn}
                onPress={loadCouriers}
                disabled={couriersLoading || actionLoading || Boolean(statusLoading)}
              >
                {couriersLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.assignBtnText}>Atribuir entregador</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {isOperator && delivery && !delivery.courierId && deliveryHasFinalStatus && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Entregador</Text>
            <Text style={styles.infoValue}>Não atribuído</Text>
            <Text style={styles.infoSub}>
              Esta entrega está com status final e não permite atribuição de entregador.
            </Text>
          </View>
        )}

        {delivery?.courierId && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Entregador atribuído</Text>
            <Text style={styles.infoValue}>ID: {delivery.courierId}</Text>
          </View>
        )}

        {allowedNext.length > 0 && (
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Atualizar status</Text>

            <View style={{ gap: 8 }}>
              {allowedNext.map((status) => {
                const isCurrentStatusLoading = statusLoading === status;

                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusBtn,
                      status === "CANCELED" && styles.cancelStatusBtn,
                    ]}
                    onPress={() => handleStatusUpdate(status)}
                    disabled={Boolean(statusLoading) || actionLoading}
                  >
                    {isCurrentStatusLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.statusBtnText}>
                        {STATUS_LABELS[status] || status}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {events.length > 0 && (
          <View style={styles.timelineCard}>
            <Text style={styles.actionTitle}>Histórico</Text>
            <Timeline events={events} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  tracking: {
    fontWeight: "800",
    color: theme.colors.text,
    fontSize: 15,
    flex: 1,
  },
  description: {
    color: theme.colors.mutedText,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  meta: {
    color: theme.colors.mutedText,
    fontSize: 13,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 4,
  },
  infoTitle: {
    fontWeight: "700",
    color: theme.colors.mutedText,
    fontSize: 12,
    textTransform: "uppercase",
  },
  infoValue: {
    fontWeight: "700",
    color: theme.colors.text,
    fontSize: 15,
  },
  infoSub: {
    color: theme.colors.mutedText,
    fontSize: 13,
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 10,
  },
  actionTitle: {
    fontWeight: "800",
    color: theme.colors.text,
    fontSize: 15,
  },
  actionSub: {
    color: theme.colors.mutedText,
    fontSize: 13,
  },
  assignBtn: {
    minHeight: 44,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  assignBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  courierOption: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: 12,
  },
  courierOptionName: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  courierOptionEmail: {
    color: theme.colors.mutedText,
    fontSize: 13,
  },
  cancelChip: {
    alignSelf: "flex-start",
    padding: 8,
  },
  cancelChipText: {
    color: theme.colors.mutedText,
    fontWeight: "600",
  },
  statusBtn: {
    minHeight: 44,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  timelineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,

    backgroundColor: theme.colors.background,
  },

  logo: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.primary,
  },

  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: theme.colors.mutedText,
  },

  backHeaderButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },

  backHeaderButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  cancelStatusBtn: {
    backgroundColor: "#b91c1c",
  },
});
