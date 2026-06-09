import { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getDeliveriesByCourierIdApi } from "../../api/deliveryApi";
import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingState from "../../components/LoadingState";
import StatusBadge from "../../components/StatusBadge";
import { theme } from "../../config/theme";
import { ROUTES } from "../../constants/routes";
import { FINAL_STATUSES, STATUS_LABELS } from "../../constants/status";
import { useAuth } from "../../contexts/AuthContext";
import { formatAddress, formatDate } from "../../utils/formatters";

function normalizeDelivery(delivery) {
  if (!delivery) {
    return null;
  }

  return {
    ...delivery,
    address: delivery.address || delivery.destinationAddress || null,
    destinationAddress: delivery.destinationAddress || delivery.address || null,
    originAddress: delivery.originAddress || null,
  };
}

function normalizeDeliveries(data) {
  const payload = data?.data || data;

  if (!payload) {
    return [];
  }

  const list = Array.isArray(payload)
    ? payload
    : payload.deliveries || payload.items || [];

  if (!Array.isArray(list)) {
    return [];
  }

  return list.map(normalizeDelivery).filter(Boolean);
}

function getEntityId(entity) {
  return entity?.id || entity?._id || "";
}

function getDeliverySearchText(delivery) {
  const destination = delivery?.destinationAddress || delivery?.address;
  const origin = delivery?.originAddress;

  return [
    getEntityId(delivery),
    delivery?.trackingCode,
    delivery?.status,
    STATUS_LABELS[delivery?.status],
    destination ? formatAddress(destination) : "",
    origin ? formatAddress(origin) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function CourierDeliveriesScreen({ navigation }) {
  const auth = useAuth();

  const token = auth?.token;
  const user = auth?.user;
  const logout = auth?.logout;
  const courierId = auth?.userId || user?.id || user?.userId;

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  async function loadDeliveries() {
    if (!courierId) {
      setError("Entregador não identificado. Faça login novamente.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError("");

    try {
      const data = await getDeliveriesByCourierIdApi(courierId, token);
      setDeliveries(normalizeDeliveries(data));
    } catch (err) {
      setError(err.message || "Não foi possível carregar suas entregas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadDeliveries();
    }, [courierId, token])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadDeliveries();
  }

  function goToDetails(delivery) {
    navigation.navigate(ROUTES.COURIER_DELIVERY_DETAILS, { delivery });
  }

  function handleStatusFilter(status) {
    setFilterStatus((currentStatus) =>
      currentStatus === status ? "" : status
    );
  }

  const summary = useMemo(() => {
    const activeCount = deliveries.filter(
      (delivery) => !FINAL_STATUSES.includes(delivery.status)
    ).length;

    const doneCount = deliveries.filter((delivery) =>
      FINAL_STATUSES.includes(delivery.status)
    ).length;

    return {
      total: deliveries.length,
      active: activeCount,
      done: doneCount,
    };
  }, [deliveries]);

  const availableStatuses = useMemo(() => {
    return Array.from(
      new Set(deliveries.map((delivery) => delivery.status).filter(Boolean))
    );
  }, [deliveries]);

  const filteredDeliveries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return deliveries.filter((delivery) => {
      const matchSearch =
        !normalizedSearch ||
        getDeliverySearchText(delivery).includes(normalizedSearch);

      const matchStatus = !filterStatus || delivery.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [deliveries, search, filterStatus]);

  if (loading) {
    return <LoadingState />;
  }

  const active = filteredDeliveries.filter(
    (delivery) => !FINAL_STATUSES.includes(delivery.status)
  );

  const done = filteredDeliveries.filter((delivery) =>
    FINAL_STATUSES.includes(delivery.status)
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTextArea}>
          <Text style={styles.greeting}>
            Olá, {user?.name?.split(" ")[0] || "Entregador"}
          </Text>
          <Text style={styles.subtitle}>Suas entregas atribuídas</Text>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ErrorMessage message={error} />

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{summary.total}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{summary.active}</Text>
          <Text style={styles.summaryLabel}>Em andamento</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{summary.done}</Text>
          <Text style={styles.summaryLabel}>Concluídas</Text>
        </View>
      </View>

      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar por código, status ou destino..."
        placeholderTextColor={theme.colors.mutedText}
      />

      {availableStatuses.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filters}
          contentContainerStyle={styles.filtersContent}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              !filterStatus && styles.filterChipActive,
            ]}
            onPress={() => setFilterStatus("")}
          >
            <Text
              style={[
                styles.filterChipText,
                !filterStatus && styles.filterChipTextActive,
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>

          {availableStatuses.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filterStatus === status && styles.filterChipActive,
              ]}
              onPress={() => handleStatusFilter(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === status && styles.filterChipTextActive,
                ]}
              >
                {STATUS_LABELS[status] || status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Text style={styles.resultCount}>
        Mostrando {filteredDeliveries.length} de {deliveries.length} entrega(s)
      </Text>

      {deliveries.length === 0 ? (
        <EmptyState message="Nenhuma entrega atribuída ainda." />
      ) : filteredDeliveries.length === 0 ? (
        <EmptyState message="Nenhuma entrega encontrada com os filtros atuais." />
      ) : (
        <>
          {active.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>
                Em andamento ({active.length})
              </Text>

              <View style={styles.list}>
                {active.map((delivery, index) => {
                  const destination =
                    delivery.destinationAddress || delivery.address;
                  const deliveryId = getEntityId(delivery);

                  return (
                    <TouchableOpacity
                      key={deliveryId || delivery.trackingCode || index}
                      style={styles.card}
                      onPress={() => goToDetails(delivery)}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={styles.trackingCode}>
                          {delivery.trackingCode || "Sem código"}
                        </Text>

                        <StatusBadge status={delivery.status} />
                      </View>

                      {destination && (
                        <Text style={styles.address} numberOfLines={2}>
                          Destino: {formatAddress(destination)}
                        </Text>
                      )}

                      <Text style={styles.date}>
                        Criada em: {formatDate(delivery.createdAt)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {done.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>
                Concluídas ({done.length})
              </Text>

              <View style={styles.list}>
                {done.map((delivery, index) => {
                  const destination =
                    delivery.destinationAddress || delivery.address;
                  const deliveryId = getEntityId(delivery);

                  return (
                    <TouchableOpacity
                      key={deliveryId || delivery.trackingCode || index}
                      style={[styles.card, styles.cardDone]}
                      onPress={() => goToDetails(delivery)}
                    >
                      <View style={styles.cardHeader}>
                        <Text
                          style={[
                            styles.trackingCode,
                            { color: theme.colors.mutedText },
                          ]}
                        >
                          {delivery.trackingCode || "Sem código"}
                        </Text>

                        <StatusBadge status={delivery.status} />
                      </View>

                      {destination && (
                        <Text style={styles.address} numberOfLines={2}>
                          Destino: {formatAddress(destination)}
                        </Text>
                      )}

                      <Text style={styles.date}>
                        Criada em: {formatDate(delivery.createdAt)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    gap: 12,
  },
  headerTextArea: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  subtitle: {
    color: theme.colors.mutedText,
    marginTop: 2,
  },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fee2e2",
    borderRadius: theme.radius.sm,
  },
  logoutText: {
    color: theme.colors.danger,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    alignItems: "center",
    gap: 2,
  },
  summaryNumber: {
    color: theme.colors.primary,
    fontSize: 22,
    fontWeight: "900",
  },
  summaryLabel: {
    color: theme.colors.mutedText,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  search: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    minHeight: 46,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
  filters: {
    marginVertical: 2,
  },
  filtersContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 13,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  resultCount: {
    color: theme.colors.mutedText,
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    fontWeight: "800",
    color: theme.colors.text,
    fontSize: 15,
    marginTop: 4,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 8,
  },
  cardDone: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  trackingCode: {
    fontWeight: "800",
    color: theme.colors.text,
    fontSize: 14,
    flex: 1,
  },
  address: {
    color: theme.colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
  date: {
    color: theme.colors.mutedText,
    fontSize: 12,
  },
});
