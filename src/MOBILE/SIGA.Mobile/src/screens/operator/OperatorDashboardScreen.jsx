import { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getOrdersByCompanyIdApi } from "../../api/orderApi";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingState from "../../components/LoadingState";
import { theme } from "../../config/theme";
import { ROUTES } from "../../constants/routes";
import { DELIVERY_STATUS, STATUS_LABELS } from "../../constants/status";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency } from "../../utils/formatters";

const STATUSES = Object.values(DELIVERY_STATUS);

const STATUS_COLORS = {
  CREATED: "#dbeafe",
  POSTED: "#fef3c7",
  IN_TRANSIT: "#e0f2fe",
  OUT_FOR_DELIVERY: "#f0fdf4",
  DELIVERED: "#dcfce7",
  CANCELED: "#fee2e2",
};

const STATUS_TEXT_COLORS = {
  CREATED: "#1d4ed8",
  POSTED: "#92400e",
  IN_TRANSIT: "#075985",
  OUT_FOR_DELIVERY: "#166534",
  DELIVERED: "#15803d",
  CANCELED: "#b91c1c",
};

const STATUS_DOTS = {
  CREATED: "#2563eb",
  POSTED: "#d97706",
  IN_TRANSIT: "#0284c7",
  OUT_FOR_DELIVERY: "#16a34a",
  DELIVERED: "#15803d",
  CANCELED: "#dc2626",
};

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

function getTotalValue(orders) {
  return orders.reduce((total, order) => {
    const value = Number(order?.totalPrice) || 0;
    return total + value;
  }, 0);
}

function formatShortDate(date) {
  if (!date) {
    return "Sem data";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Sem data";
  }

  return parsedDate.toLocaleDateString("pt-BR");
}

export default function OperatorDashboardScreen({ navigation }) {
  const auth = useAuth();

  const token = auth?.token;
  const user = auth?.user;
  const logout = auth?.logout;
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
      setError(err.message || "Não foi possível carregar o dashboard.");
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

  function countByStatus(status) {
    return orders.filter((order) => order?.status === status).length;
  }

  const dashboardData = useMemo(() => {
    const totalOrders = orders.length;
    const totalValue = getTotalValue(orders);
    const deliveredCount = countByStatus(DELIVERY_STATUS.DELIVERED);
    const canceledCount = countByStatus(DELIVERY_STATUS.CANCELED);
    const createdCount = countByStatus(DELIVERY_STATUS.CREATED);
    const postedCount = countByStatus(DELIVERY_STATUS.POSTED);
    const inTransitCount = countByStatus(DELIVERY_STATUS.IN_TRANSIT);
    const outForDeliveryCount = countByStatus(DELIVERY_STATUS.OUT_FOR_DELIVERY);

    const inProgressCount =
      postedCount + inTransitCount + outForDeliveryCount;

    const pendingOrders = orders.filter(
      (order) =>
        order?.status !== DELIVERY_STATUS.DELIVERED &&
        order?.status !== DELIVERY_STATUS.CANCELED
    ).length;

    const completionRate = totalOrders
      ? Math.round((deliveredCount / totalOrders) * 100)
      : 0;

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 4);

    return {
      totalOrders,
      totalValue,
      deliveredCount,
      canceledCount,
      createdCount,
      inProgressCount,
      pendingOrders,
      completionRate,
      recentOrders,
    };
  }, [orders]);

  if (loading) {
    return <LoadingState />;
  }

  const firstName = user?.name?.split(" ")[0] || "Operador";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />

          <View style={styles.heroTopRow}>
            <View style={styles.heroTextArea}>
              <Text style={styles.eyebrow}>Painel operacional</Text>
              <Text style={styles.greeting}>Olá, {firstName}</Text>
              <Text style={styles.subtitle}>
                Acompanhe as encomendas da empresa em tempo real.
              </Text>
            </View>

            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={() => navigation.navigate(ROUTES.USER_PROFILE_EDIT)}
                style={styles.profileButton}
              >
                <Text style={styles.profileButtonText}>Perfil</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                <Text style={styles.logoutText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>
                {dashboardData.totalOrders}
              </Text>
              <Text style={styles.heroStatLabel}>Total</Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>
                {dashboardData.pendingOrders}
              </Text>
              <Text style={styles.heroStatLabel}>Pendentes</Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>
                {dashboardData.completionRate}%
              </Text>
              <Text style={styles.heroStatLabel}>Entrega</Text>
            </View>
          </View>
        </View>

        <ErrorMessage message={error} />

        <View style={styles.summaryGrid}>
          <View style={[styles.metricCard, styles.metricCardWide]}>
            <View style={styles.metricIconBox}>
              <Ionicons
                name="wallet-outline"
                size={26}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.metricTextArea}>
              <Text style={styles.metricLabel}>Valor declarado</Text>
              <Text style={styles.metricValue} numberOfLines={1}>
                {formatCurrency(dashboardData.totalValue)}
              </Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricSmallIconBox}>
              <Ionicons
                name="cube-outline"
                size={24}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.metricSmallValue}>
              {dashboardData.createdCount}
            </Text>
            <Text style={styles.metricSmallLabel}>Criadas</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricSmallIconBox}>
              <Ionicons
                name="trail-sign-outline"
                size={24}
                color="#0284c7"
              />
            </View>
            <Text style={styles.metricSmallValue}>
              {dashboardData.inProgressCount}
            </Text>
            <Text style={styles.metricSmallLabel}>Em andamento</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricSmallIconBoxSuccess}>
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color="#15803d"
              />
            </View>
            <Text style={styles.metricSmallValueSuccess}>
              {dashboardData.deliveredCount}
            </Text>
            <Text style={styles.metricSmallLabel}>Entregues</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricSmallIconBoxDanger}>
              <Ionicons
                name="close-circle-outline"
                size={24}
                color={theme.colors.danger}
              />
            </View>
            <Text style={styles.metricSmallValueDanger}>
              {dashboardData.canceledCount}
            </Text>
            <Text style={styles.metricSmallLabel}>Canceladas</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Atalhos principais</Text>
          <Text style={styles.sectionHint}>ações rápidas</Text>
        </View>

        <View style={styles.shortcuts}>
          <TouchableOpacity
            style={[styles.shortcut, styles.shortcutPrimary]}
            onPress={() => navigation.navigate(ROUTES.NEW_SHIPMENT)}
          >
            <View style={styles.shortcutIconBoxPrimary}>
              <Ionicons
                name="add-circle-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.shortcutTextPrimary}>Nova encomenda</Text>
            <Text style={styles.shortcutSubPrimary}>cadastrar pedido</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcut}
            onPress={() => navigation.navigate(ROUTES.OPERATOR_SHIPMENTS)}
          >
            <View style={styles.shortcutIconBox}>
              <Ionicons
                name="cube-outline"
                size={26}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.shortcutText}>Encomendas</Text>
            <Text style={styles.shortcutSub}>listar pedidos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcut}
            onPress={() => navigation.navigate(ROUTES.OPERATOR_COURIERS)}
          >
            <View style={styles.shortcutIconBox}>
              <Ionicons
                name="people-outline"
                size={26}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.shortcutText}>Entregadores</Text>
            <Text style={styles.shortcutSub}>gerenciar equipe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcut}
            onPress={() => navigation.navigate(ROUTES.OPERATOR_TRACKING)}
          >
            <View style={styles.shortcutIconBox}>
              <Ionicons
                name="search-outline"
                size={26}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.shortcutText}>Rastrear</Text>
            <Text style={styles.shortcutSub}>consultar código</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcut}
            onPress={() => navigation.navigate(ROUTES.COMPANY_PROFILE)}
          >
            <View style={styles.shortcutIconBox}>
              <Ionicons
                name="business-outline"
                size={26}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.shortcutText}>Empresa</Text>
            <Text style={styles.shortcutSub}>dados cadastrais</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcut}
            onPress={() => navigation.navigate(ROUTES.OPERATOR_REPORTS)}
          >
            <View style={styles.shortcutIconBox}>
              <Ionicons
                name="bar-chart-outline"
                size={26}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.shortcutText}>Relatórios</Text>
            <Text style={styles.shortcutSub}>indicadores</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Resumo por status</Text>
          <Text style={styles.sectionHint}>distribuição</Text>
        </View>

        <View style={styles.statusPanel}>
          {STATUSES.map((status) => {
            const count = countByStatus(status);
            const percentage = dashboardData.totalOrders
              ? Math.round((count / dashboardData.totalOrders) * 100)
              : 0;

            return (
              <View key={status} style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: STATUS_DOTS[status] || theme.colors.primary },
                  ]}
                />

                <View style={styles.statusInfo}>
                  <View style={styles.statusLabelRow}>
                    <Text style={styles.statusName} numberOfLines={1}>
                      {STATUS_LABELS[status] || status}
                    </Text>
                    <Text
                      style={[
                        styles.statusCount,
                        { color: STATUS_TEXT_COLORS[status] || theme.colors.text },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>

                  <View style={styles.statusBar}>
                    <View
                      style={[
                        styles.statusFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor:
                            STATUS_DOTS[status] || theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>

                <Text style={styles.statusPercent}>{percentage}%</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Encomendas recentes</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate(ROUTES.OPERATOR_SHIPMENTS)}
          >
            <Text style={styles.seeAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentPanel}>
          {dashboardData.recentOrders.length === 0 ? (
            <View style={styles.emptyRecent}>
              <View style={styles.emptyIconBox}>
                <Ionicons
                  name="file-tray-outline"
                  size={36}
                  color={theme.colors.mutedText}
                />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma encomenda ainda</Text>
              <Text style={styles.emptyText}>
                Cadastre a primeira encomenda para visualizar o acompanhamento
                por aqui.
              </Text>
            </View>
          ) : (
            dashboardData.recentOrders.map((order) => {
              const orderId = getEntityId(order);
              const status = order?.status;

              return (
                <TouchableOpacity
                  key={orderId}
                  style={styles.recentItem}
                  onPress={() =>
                    navigation.navigate(ROUTES.SHIPMENT_DETAILS, {
                      order,
                      orderId,
                    })
                  }
                >
                  <View style={styles.recentIconBox}>
                    <Ionicons
                      name="cube-outline"
                      size={22}
                      color={theme.colors.primary}
                    />
                  </View>

                  <View style={styles.recentContent}>
                    <Text style={styles.recentTitle} numberOfLines={1}>
                      {getOrderDescription(order)}
                    </Text>
                    <Text style={styles.recentMeta} numberOfLines={1}>
                      {formatShortDate(order?.createdAt)} · {orderId || "sem ID"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.recentBadge,
                      {
                        backgroundColor:
                          STATUS_COLORS[status] || theme.colors.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.recentBadgeText,
                        {
                          color:
                            STATUS_TEXT_COLORS[status] || theme.colors.text,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {STATUS_LABELS[status] || status || "—"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
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
    padding: 18,
    gap: 18,
    paddingBottom: 42,
  },
  heroCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    padding: 20,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  heroGlowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.12)",
    right: -64,
    top: -70,
  },
  heroGlowSmall: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.08)",
    left: -42,
    bottom: -45,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  heroTextArea: {
    flex: 1,
  },
  eyebrow: {
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  greeting: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    marginTop: 6,
  },
  subtitle: {
    color: "#dbeafe",
    marginTop: 6,
    lineHeight: 20,
    fontSize: 13,
  },
  headerButtons: {
    gap: 8,
    alignItems: "flex-end",
  },
  profileButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  profileButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
  },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(254,226,226,0.95)",
    borderRadius: theme.radius.md,
  },
  logoutText: {
    color: theme.colors.danger,
    fontWeight: "900",
    fontSize: 12,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginTop: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
  },
  heroStatValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  heroStatLabel: {
    color: "#bfdbfe",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
    textTransform: "uppercase",
  },
  heroDivider: {
    width: 1,
    height: 34,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 16,
    width: "47%",
    minHeight: 116,
    justifyContent: "space-between",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  metricCardWide: {
    width: "100%",
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  metricIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
  },
  metricSmallIconBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
  },
  metricSmallIconBoxSuccess: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  metricSmallIconBoxDanger: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  metricTextArea: {
    flex: 1,
  },
  metricLabel: {
    color: theme.colors.mutedText,
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
  },
  metricValue: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },

  metricSmallValue: {
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: "900",
  },
  metricSmallValueSuccess: {
    color: "#15803d",
    fontSize: 28,
    fontWeight: "900",
  },
  metricSmallValueDanger: {
    color: theme.colors.danger,
    fontSize: 28,
    fontWeight: "900",
  },
  metricSmallLabel: {
    color: theme.colors.mutedText,
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontWeight: "900",
    color: theme.colors.text,
    fontSize: 17,
  },
  sectionHint: {
    color: theme.colors.mutedText,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
  },
  seeAllText: {
    color: theme.colors.primary,
    fontWeight: "900",
  },
  shortcuts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  shortcut: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 16,
    width: "47%",
    minHeight: 132,
    justifyContent: "space-between",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  shortcutPrimary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  shortcutIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutIconBoxPrimary: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutText: {
    fontWeight: "900",
    color: theme.colors.text,
    fontSize: 15,
  },
  shortcutTextPrimary: {
    fontWeight: "900",
    color: theme.colors.primary,
    fontSize: 15,
  },
  shortcutSub: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  shortcutSubPrimary: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  statusPanel: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 16,
    gap: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusInfo: {
    flex: 1,
    gap: 6,
  },
  statusLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statusName: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 13,
    flex: 1,
  },
  statusCount: {
    fontWeight: "900",
    fontSize: 13,
  },
  statusBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 999,
    overflow: "hidden",
  },
  statusFill: {
    height: "100%",
    borderRadius: 999,
  },
  statusPercent: {
    color: theme.colors.mutedText,
    fontWeight: "900",
    fontSize: 12,
    width: 38,
    textAlign: "right",
  },
  recentPanel: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  recentIconBox: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },

  recentContent: {
    flex: 1,
  },
  recentTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 14,
  },
  recentMeta: {
    color: theme.colors.mutedText,
    fontSize: 12,
    marginTop: 3,
  },
  recentBadge: {
    maxWidth: 96,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  recentBadgeText: {
    fontWeight: "900",
    fontSize: 10,
  },
  emptyRecent: {
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyIconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 16,
  },
  emptyText: {
    color: theme.colors.mutedText,
    textAlign: "center",
    lineHeight: 20,
  },
});
