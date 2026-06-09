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
import { getDeliveryByOrderIdApi } from "../../api/deliveryApi";
import { createDeliveryEventApi } from "../../api/deliveryEventApi";
import AddressBlock from "../../components/AddressBlock";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingState from "../../components/LoadingState";
import StatusBadge from "../../components/StatusBadge";
import Timeline from "../../components/Timeline";
import { theme } from "../../config/theme";
import { FINAL_STATUSES, STATUS_LABELS } from "../../constants/status";
import { useAuth } from "../../contexts/AuthContext";
import { formatDate } from "../../utils/formatters";
import { getAllowedNextStatuses } from "../../utils/statusRules";

function getEntityId(entity) {
  return entity?.id || entity?._id || "";
}

function normalizeDelivery(delivery) {
  if (!delivery) {
    return null;
  }

  return {
    ...delivery,
    address: delivery.address || delivery.destinationAddress || null,
    destinationAddress: delivery.destinationAddress || delivery.address || null,
    originAddress: delivery.originAddress || null,
    events: delivery.events || [],
  };
}

export default function CourierDeliveryDetailsScreen({ route }) {
  const auth = useAuth();

  const token = auth?.token;
  const role = auth?.role;
  const userId = auth?.userId || auth?.user?.id || auth?.user?.userId;

  const { delivery: initialDelivery } = route.params || {};

  const [delivery, setDelivery] = useState(normalizeDelivery(initialDelivery));
  const [loading, setLoading] = useState(Boolean(initialDelivery?.orderId));
  const [loadingStatus, setLoadingStatus] = useState("");
  const [error, setError] = useState("");

  const currentOrderId = delivery?.orderId || initialDelivery?.orderId || "";
  const deliveryId = getEntityId(delivery);

  async function refreshDelivery(orderIdToLoad = currentOrderId) {
    if (!orderIdToLoad) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getDeliveryByOrderIdApi(orderIdToLoad, token);
      setDelivery(normalizeDelivery(data));
    } catch (err) {
      setError(err.message || "Não foi possível carregar a entrega.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshDelivery(initialDelivery?.orderId);
  }, []);

  async function performStatusUpdate(newStatus) {
    setError("");

    if (!deliveryId) {
      setError("Entrega não encontrada.");
      return;
    }

    if (!currentOrderId) {
      setError("Pedido da entrega não encontrado.");
      return;
    }

    setLoadingStatus(newStatus);

    try {
      await createDeliveryEventApi(
        {
          deliveryId,
          orderId: currentOrderId,
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

      await refreshDelivery(currentOrderId);
    } catch (err) {
      setError(err.message || "Não foi possível atualizar o status.");
    } finally {
      setLoadingStatus("");
    }
  }

  function handleStatusUpdate(newStatus) {
    const isFinalStatus = FINAL_STATUSES.includes(newStatus);
    const statusLabel = STATUS_LABELS[newStatus] || newStatus;

    if (!isFinalStatus) {
      performStatusUpdate(newStatus);
      return;
    }

    Alert.alert(
      "Confirmar atualização",
      `Tem certeza que deseja marcar esta entrega como "${statusLabel}"? Essa ação pode finalizar a entrega.`,
      [
        {
          text: "Voltar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          style: newStatus === "CANCELED" ? "destructive" : "default",
          onPress: () => performStatusUpdate(newStatus),
        },
      ]
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  const allowedNext = getAllowedNextStatuses(role, delivery?.status);
  const originAddress = delivery?.originAddress;
  const destinationAddress = delivery?.destinationAddress || delivery?.address;
  const events = delivery?.events || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.tracking}>
            {delivery?.trackingCode || "—"}
          </Text>

          <StatusBadge status={delivery?.status} />
        </View>

        <Text style={styles.meta}>
          Criado em: {formatDate(delivery?.createdAt)}
        </Text>
      </View>

      <ErrorMessage message={error} />

      {originAddress && (
        <AddressBlock title="Origem" address={originAddress} />
      )}

      {destinationAddress && (
        <AddressBlock title="Destino" address={destinationAddress} />
      )}

      {allowedNext.length > 0 && (
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Atualizar status da entrega</Text>

          <View style={{ gap: 8 }}>
            {allowedNext.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusBtn,
                  status === "CANCELED" && styles.cancelStatusBtn,
                ]}
                onPress={() => handleStatusUpdate(status)}
                disabled={Boolean(loadingStatus)}
              >
                {loadingStatus === status ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.statusBtnText}>
                    {STATUS_LABELS[status] || status}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {allowedNext.length === 0 && (
        <View style={styles.completedCard}>
          <Text style={styles.completedIcon}>
            {delivery?.status === "DELIVERED"
              ? "✅"
              : delivery?.status === "CANCELED"
                ? "❌"
                : "ℹ️"}
          </Text>

          <Text style={styles.completedText}>
            {delivery?.status === "DELIVERED"
              ? "Entrega concluída!"
              : delivery?.status === "CANCELED"
                ? "Entrega cancelada."
                : "Aguardando próxima ação."}
          </Text>
        </View>
      )}

      {events.length > 0 && (
        <View style={styles.timelineCard}>
          <Text style={styles.actionTitle}>Histórico de eventos</Text>
          <Timeline events={events} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
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
  meta: {
    color: theme.colors.mutedText,
    fontSize: 13,
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 12,
  },
  actionTitle: {
    fontWeight: "800",
    color: theme.colors.text,
    fontSize: 15,
  },
  statusBtn: {
    minHeight: 52,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelStatusBtn: {
    backgroundColor: "#b91c1c",
  },
  statusBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  completedCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  completedIcon: {
    fontSize: 40,
  },
  completedText: {
    fontWeight: "700",
    color: theme.colors.text,
    fontSize: 16,
    textAlign: "center",
  },
  timelineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 12,
  },
});