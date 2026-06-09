import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "../../components/ScreenContainer";
import { theme } from "../../config/theme";
import { getRoleLabel } from "../../constants/roles";
import { useAuth } from "../../contexts/AuthContext";

export default function UnsupportedRoleScreen() {
  const { logout, role, user } = useAuth();

  const roleLabel = getRoleLabel(role);

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Ionicons
          name="ban-outline"
          size={56}
          color={theme.colors.danger || "#dc2626"}
        />

        <Text style={styles.title}>Perfil não disponível no mobile</Text>

        <Text style={styles.description}>
          O perfil {roleLabel.toLowerCase()} ainda não está disponível no
          aplicativo mobile. Acesse o painel web para utilizar todas as
          funcionalidades do SIGA com este perfil.
        </Text>

        {user?.email && (
          <Text style={styles.email}>Conta: {user.email}</Text>
        )}

        <TouchableOpacity style={styles.button} onPress={logout}>
          <Text style={styles.buttonText}>Sair e usar o painel web</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 32,
    alignItems: "center",
    gap: 16,
    marginTop: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.text,
    textAlign: "center",
  },
  description: {
    color: theme.colors.mutedText,
    textAlign: "center",
    lineHeight: 22,
  },
  email: {
    color: theme.colors.mutedText,
    fontSize: 13,
    textAlign: "center",
  },
  button: {
    minHeight: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    width: "100%",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});