import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../config/theme";
import { formatCurrency, formatDate, formatStatus } from "../utils/formatters";
import StatusBadge from "./StatusBadge";

function getEntityId(entity) {
  return entity?.id || entity?._id || "";
}

function getShipmentDescription(shipment) {
  if (shipment?.description) {
    return shipment.description;
  }

  if (Array.isArray(shipment?.items) && shipment.items.length > 0) {
    return shipment.items[0]?.name || "Encomenda";
  }

  return "Encomenda";
}

export default function ShipmentCard({ shipment, onPress }) {
  const shipmentId = getEntityId(shipment);
  const description = getShipmentDescription(shipment);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {description}
        </Text>

        <StatusBadge status={shipment?.status} />
      </View>

      <View style={styles.infoGroup}>
        <Text style={styles.text}>Pedido: {shipmentId || "Não informado"}</Text>

        {shipment?.trackingCode && (
          <Text style={styles.text}>Rastreio: {shipment.trackingCode}</Text>
        )}

        <Text style={styles.text}>Status: {formatStatus(shipment?.status)}</Text>
        <Text style={styles.text}>
          Valor: {formatCurrency(shipment?.totalPrice)}
        </Text>
      </View>

      <Text style={styles.muted}>Criado em: {formatDate(shipment?.createdAt)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
    flex: 1,
  },
  infoGroup: {
    gap: 4,
  },
  text: {
    color: theme.colors.text,
    fontSize: 13,
  },
  muted: {
    color: theme.colors.mutedText,
    fontSize: 12,
  },
});