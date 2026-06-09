import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getOrdersByCompanyIdApi } from "../../api/orderApi";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingState from "../../components/LoadingState";
import StatusBadge from "../../components/StatusBadge";
import { theme } from "../../config/theme";
import { DELIVERY_STATUS, STATUS_LABELS } from "../../constants/status";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency, formatDate } from "../../utils/formatters";

const STATUS_LIST = Object.values(DELIVERY_STATUS);

function getPayload(response) {
  return response?.data || response;
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

function countByStatus(orders, status) {
  return orders.filter((order) => order?.status === status).length;
}

function getTotalValue(orders) {
  return orders.reduce((total, order) => {
    const value = Number(order?.totalPrice) || 0;
    return total + value;
  }, 0);
}

function formatPercentage(value) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${value.toFixed(0)}%`;
}

export default function OperatorReportsScreen() {
  const auth = useAuth();

  const token = auth?.token;
  const user = auth?.user;
  const companyId = auth?.companyId || user?.companyId;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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
      setError(err.message || "Não foi possível carregar os relatórios.");
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

  if (loading) {
    return <LoadingState />;
  }

  const totalOrders = orders.length;
  const deliveredCount = countByStatus(orders, DELIVERY_STATUS.DELIVERED);
  const canceledCount = countByStatus(orders, DELIVERY_STATUS.CANCELED);
  const inProgressCount =
    countByStatus(orders, DELIVERY_STATUS.POSTED) +
    countByStatus(orders, DELIVERY_STATUS.IN_TRANSIT) +
    countByStatus(orders, DELIVERY_STATUS.OUT_FOR_DELIVERY);

  const totalValue = getTotalValue(orders);
  const deliveredRate = totalOrders ? (deliveredCount / totalOrders) * 100 : 0;
  const canceledRate = totalOrders ? (canceledCount / totalOrders) * 100 : 0;

  const recent = [...orders]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Text style={styles.title}>Relatórios</Text>
      <Text style={styles.subtitle}>
        Acompanhe os principais indicadores das encomendas da empresa.
      </Text>

      <ErrorMessage message={error} />

      {totalOrders === 0 && (
        <View style={styles.noDataBox}>
          <Text style={styles.noDataTitle}>Sem dados suficientes</Text>
          <Text style={styles.noDataText}>
            Cadastre encomendas para visualizar indicadores, percentuais e
            histórico recente.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Totais</Text>

        <View style={styles.totalsRow}>
          <View style={styles.totalItem}>
            <Text style={styles.totalNumber}>{totalOrders}</Text>
            <Text style={styles.totalLabel}>Total</Text>
          </View>

          <View style={styles.totalItem}>
            <Text style={[styles.totalNumber, { color: "#15803d" }]}>
              {deliveredCount}
            </Text>
            <Text style={styles.totalLabel}>Entregues</Text>
          </View>

          <View style={styles.totalItem}>
            <Text style={[styles.totalNumber, { color: theme.colors.danger }]}>
              {canceledCount}
            </Text>
            <Text style={styles.totalLabel}>Canceladas</Text>
          </View>

          <View style={styles.totalItem}>
            <Text style={[styles.totalNumber, { color: "#075985" }]}>
              {inProgressCount}
            </Text>
            <Text style={styles.totalLabel}>Em andamento</Text>
          </View>
        </View>

        <View style={styles.valueBox}>
          <Text style={styles.valueLabel}>Valor declarado total</Text>
          <Text style={styles.valueText}>{formatCurrency(totalValue)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Indicadores</Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricNumber, { color: "#15803d" }]}>
              {formatPercentage(deliveredRate)}
            </Text>
            <Text style={styles.metricLabel}>Taxa de entrega</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={[styles.metricNumber, { color: theme.colors.danger }]}>
              {formatPercentage(canceledRate)}
            </Text>
            <Text style={styles.metricLabel}>Taxa de cancelamento</Text>
          </View>
        </View>

        <Text style={styles.metricHint}>
          Os percentuais são calculados sobre o total de encomendas cadastradas.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumo por status</Text>

        {STATUS_LIST.map((status) => {
          const count = countByStatus(orders, status);
          const percentage = totalOrders ? (count / totalOrders) * 100 : 0;

          return (
            <View key={status} style={styles.statusRow}>
              <Text style={styles.statusName}>
                {STATUS_LABELS[status] || status}
              </Text>

              <View style={styles.statusBar}>
                <View
                  style={[
                    styles.statusFill,
                    { width: `${percentage}%` },
                  ]}
                />
              </View>

              <View style={styles.statusMeta}>
                <Text style={styles.statusCount}>{count}</Text>
                <Text style={styles.statusPercent}>
                  {formatPercentage(percentage)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Encomendas recentes</Text>

        {recent.length === 0 ? (
          <Text style={styles.empty}>Nenhuma encomenda ainda.</Text>
        ) : (
          recent.map((order) => {
            const orderId = getEntityId(order);

            return (
              <View key={orderId} style={styles.recentItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentDesc} numberOfLines={1}>
                    {getOrderDescription(order)}
                  </Text>

                  <Text style={styles.recentDate}>
                    {formatDate(order.createdAt)}
                  </Text>

                  {orderId && (
                    <Text style={styles.recentId}>ID: {orderId}</Text>
                  )}
                </View>

                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <StatusBadge status={order.status} />

                  <Text style={styles.recentValue}>
                    {formatCurrency(order.totalPrice)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
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
    gap: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  subtitle: {
    color: theme.colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
  noDataBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  noDataTitle: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 15,
  },
  noDataText: {
    color: theme.colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 14,
  },
  cardTitle: {
    fontWeight: "800",
    color: theme.colors.text,
    fontSize: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusName: {
    width: 110,
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  statusBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 999,
    overflow: "hidden",
  },
  statusFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
  },
  statusMeta: {
    width: 46,
    alignItems: "flex-end",
  },
  statusCount: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  statusPercent: {
    color: theme.colors.mutedText,
    fontSize: 11,
  },
  totalsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  totalItem: {
    width: "47%",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: 12,
  },
  totalNumber: {
    fontSize: 28,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  totalLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    textAlign: "center",
  },
  valueBox: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: 14,
    alignItems: "center",
  },
  valueLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  valueText: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricItem: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  metricLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    textAlign: "center",
  },
  metricHint: {
    color: theme.colors.mutedText,
    fontSize: 12,
    lineHeight: 17,
  },
  recentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  recentDesc: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  recentDate: {
    color: theme.colors.mutedText,
    fontSize: 12,
    marginTop: 2,
  },
  recentId: {
    color: theme.colors.mutedText,
    fontSize: 11,
    marginTop: 2,
  },
  recentValue: {
    color: theme.colors.mutedText,
    fontSize: 12,
  },
  empty: {
    color: theme.colors.mutedText,
    textAlign: "center",
  },
});
