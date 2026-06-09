import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { theme } from "../config/theme";

export default function LoadingState({ message = "Carregando..." }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: theme.colors.background,
  },
  message: {
    color: theme.colors.mutedText,
    fontWeight: "600",
    textAlign: "center",
  },
});