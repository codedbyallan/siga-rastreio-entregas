import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getDeliveryByOrderIdApi } from "../../api/deliveryApi";
import { getOrdersByCompanyIdApi } from "../../api/orderApi";
import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingState from "../../components/LoadingState";
import StatusBadge from "../../components/StatusBadge";
import { theme } from "../../config/theme";
import { ROUTES } from "../../constants/routes";
import { DELIVERY_STATUS, STATUS_LABELS } from "../../constants/status";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency, formatDate } from "../../utils/formatters";

const ALL_STATUSES = Object.values(DELIVERY_STATUS);
const ITEMS_PER_PAGE = 10;

function getPayload(response) {
  return response?.data || response;
}

function getEntityId(entity) {
  return entity?.id || entity?._id || "";
}

function normalizeOrders(data) {
  const payload = getPayload(data);

  if (!payload) {
    return [];
  }

  const list = Array.isArray(payload)
    ? payload
    : payload.orders || payload.items || [];

  if (!Array.isArray(list)) {
    return [];
  }

  return list;
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

function getOrderSearchText(order) {
  return [
    getEntityId(order),
    order?.description,
    order?.trackingCode,
    order?.status,
    ...(order?.items || []).map((item) => item?.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function OperatorShipmentsScreen({ navigation }) {
  const auth = useAuth();

  const token = auth?.token;
  const companyId = auth?.companyId || auth?.user?.companyId;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  async function loadOrders() {
    if (!companyId) {
      setError("Empresa não identificada. Faça login novamente.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError("");

    try {
      const data = await getOrdersByCompanyIdApi(companyId, token);
      setOrders(normalizeOrders(data));
    } catch (err) {
      setError(err.message || "Não foi possível carregar as encomendas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [companyId, token])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadOrders();
  }

  function handleSearchChange(value) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleStatusFilter(status) {
    setFilterStatus((currentStatus) => {
      const nextStatus = currentStatus === status ? "" : status;
      return nextStatus;
    });

    setCurrentPage(1);
  }

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const normalizedSearch = search.trim().toLowerCase();
      const orderStatus = order?.status || "";

      const matchSearch =
        !normalizedSearch ||
        getOrderSearchText(order).includes(normalizedSearch);

      const matchStatus = !filterStatus || orderStatus === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [orders, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const firstVisibleItem =
    filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const lastVisibleItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filtered.length
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    return filtered.slice(start, end);
  }, [filtered, currentPage]);

  async function openDetails(order) {
    const orderId = getEntityId(order);

    if (!orderId) {
      setError("Pedido inválido.");
      return;
    }

    try {
      const delivery = await getDeliveryByOrderIdApi(orderId, token);

      navigation.navigate(ROUTES.SHIPMENT_DETAILS, {
        order,
        delivery,
        orderId,
      });
    } catch {
      navigation.navigate(ROUTES.SHIPMENT_DETAILS, {
        order,
        delivery: null,
        orderId,
      });
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Encomendas</Text>
          <Text style={styles.subtitle}>Pedidos cadastrados pela empresa</Text>
        </View>

        <TouchableOpacity
          style={styles.newButton}
          onPress={() => navigation.navigate(ROUTES.NEW_SHIPMENT)}
        >
          <Text style={styles.newButtonText}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      <ErrorMessage message={error} />

      <TextInput
        style={styles.search}
        value={search}
        onChangeText={handleSearchChange}
        placeholder="Buscar por ID, descrição ou status..."
        placeholderTextColor={theme.colors.mutedText}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, !filterStatus && styles.filterChipActive]}
          onPress={() => handleStatusFilter("")}
        >
          <Text
            style={[
              styles.filterChipText,
              !filterStatus && styles.filterChipTextActive,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        {ALL_STATUSES.map((status) => (
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

      <Text style={styles.resultCount}>
        Mostrando {firstVisibleItem}–{lastVisibleItem} de {filtered.length}{" "}
        encomenda(s)
      </Text>

      {filtered.length === 0 ? (
        <EmptyState message="Nenhuma encomenda encontrada." />
      ) : (
        <>
          <View style={styles.list}>
            {paginatedOrders.map((order) => {
              const orderId = getEntityId(order);
              const description = getOrderDescription(order);

              return (
                <TouchableOpacity
                  key={orderId}
                  style={styles.card}
                  onPress={() => openDetails(order)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {description}
                    </Text>

                    <StatusBadge status={order.status} />
                  </View>

                  <Text style={styles.cardId}>ID: {orderId || "—"}</Text>

                  {order.trackingCode && (
                    <Text style={styles.cardId}>
                      Rastreio: {order.trackingCode}
                    </Text>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.cardValue}>
                      {formatCurrency(order.totalPrice)}
                    </Text>

                    <Text style={styles.cardDate}>
                      {formatDate(order.createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[
                  styles.pageButton,
                  currentPage === 1 && styles.pageButtonDisabled,
                ]}
                disabled={currentPage === 1}
                onPress={() => setCurrentPage((page) => page - 1)}
              >
                <Text style={styles.pageButtonText}>←</Text>
              </TouchableOpacity>

              <Text style={styles.pageText}>
                Página {currentPage} de {totalPages}
              </Text>

              <TouchableOpacity
                style={[
                  styles.pageButton,
                  currentPage === totalPages && styles.pageButtonDisabled,
                ]}
                disabled={currentPage === totalPages}
                onPress={() => setCurrentPage((page) => page + 1)}
              >
                <Text style={styles.pageButtonText}>→</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 44,
    gap: 14,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  subtitle: {
    color: theme.colors.mutedText,
    marginTop: 2,
    fontSize: 13,
  },
  newButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  newButtonText: {
    color: "#fff",
    fontWeight: "800",
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
    marginVertical: 4,
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
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
    flex: 1,
  },
  cardId: {
    color: theme.colors.mutedText,
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  cardValue: {
    fontWeight: "700",
    color: theme.colors.primary,
  },
  cardDate: {
    color: theme.colors.mutedText,
    fontSize: 13,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  pageButton: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  pageButtonDisabled: {
    opacity: 0.35,
  },
  pageButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  pageText: {
    color: theme.colors.text,
    fontWeight: "800",
  },
});