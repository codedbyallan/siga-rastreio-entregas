import { StyleSheet, Text, View } from "react-native";
import { theme } from "../config/theme";

export default function ErrorMessage({ message, title = "Atenção" }) {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.dangerLight || "#fee2e2",
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 4,
  },
  title: {
    color: theme.colors.danger,
    fontWeight: "800",
    fontSize: 13,
  },
  message: {
    color: theme.colors.danger,
    fontWeight: "600",
    lineHeight: 18,
  },
});