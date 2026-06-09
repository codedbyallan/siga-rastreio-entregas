import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../config/theme";

export default function EmptyState({
  title = "Nenhum registro encontrado",
  message = "Ainda não há informações para exibir.",
  icon = "file-tray-outline",
}) {
  return (
    <View style={styles.container}>
      <Ionicons
        name={icon}
        size={42}
        color={theme.colors.mutedText}
        style={styles.icon}
      />

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  icon: {
    marginBottom: 2,
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    color: theme.colors.mutedText,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
