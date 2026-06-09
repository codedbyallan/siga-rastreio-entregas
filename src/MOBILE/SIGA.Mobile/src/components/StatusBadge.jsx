import { StyleSheet, Text, View } from "react-native";
import { STATUS_LABELS } from "../constants/status";

const STATUS_STYLES = {
  CREATED: {
    bg: "#dbeafe",
    text: "#1d4ed8",
  },
  POSTED: {
    bg: "#fef3c7",
    text: "#92400e",
  },
  IN_TRANSIT: {
    bg: "#e0f2fe",
    text: "#075985",
  },
  OUT_FOR_DELIVERY: {
    bg: "#f0fdf4",
    text: "#166534",
  },
  DELIVERED: {
    bg: "#dcfce7",
    text: "#15803d",
  },
  CANCELED: {
    bg: "#fee2e2",
    text: "#b91c1c",
  },
};

function normalizeStatus(status) {
  return String(status || "").trim().toUpperCase();
}

export default function StatusBadge({ status }) {
  const normalizedStatus = normalizeStatus(status);
  const statusStyle = STATUS_STYLES[normalizedStatus] || {
    bg: "#f1f5f9",
    text: "#475569",
  };

  return (
    <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
      <Text style={[styles.text, { color: statusStyle.text }]}>
        {STATUS_LABELS[normalizedStatus] || normalizedStatus || "Não informado"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontWeight: "700",
    fontSize: 12,
  },
});