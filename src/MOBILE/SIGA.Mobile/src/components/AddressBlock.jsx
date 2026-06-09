import { StyleSheet, Text, View } from "react-native";
import { theme } from "../config/theme";
import { formatAddress } from "../utils/formatters";

export default function AddressBlock({ title, address }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <Text style={styles.text}>{formatAddress(address)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontWeight: "800",
    color: theme.colors.primary,
    fontSize: 15,
  },
  text: {
    color: theme.colors.text,
    lineHeight: 20,
  },
});