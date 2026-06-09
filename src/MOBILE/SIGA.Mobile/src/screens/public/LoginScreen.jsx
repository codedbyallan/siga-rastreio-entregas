import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ErrorMessage from "../../components/ErrorMessage";
import Input from "../../components/Input";
import ScreenContainer from "../../components/ScreenContainer";
import { theme } from "../../config/theme";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../contexts/AuthContext";

const REMEMBERED_EMAIL_KEY = "@siga:rememberedEmail";

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(String(email || "").trim());
}

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    email.trim().length > 0 && password.trim().length > 0 && !loading;

  useEffect(() => {
    async function loadRememberedEmail() {
      try {
        const savedEmail = await AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);

        if (savedEmail) {
          setEmail(savedEmail);
          setRememberEmail(true);
        }
      } catch {
        // Falha ao carregar e-mail salvo não deve bloquear o login.
      }
    }

    loadRememberedEmail();
  }, []);

  function handleForgotPassword() {
    Alert.alert(
      "Recuperação de senha",
      "No momento, solicite a redefinição de senha ao administrador da plataforma."
    );
  }

  async function handleLogin() {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    setError("");

    if (!normalizedEmail) {
      setError("Informe o e-mail.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (!normalizedPassword) {
      setError("Informe a senha.");
      return;
    }

    setLoading(true);

    try {
      await login(normalizedEmail, normalizedPassword);

      if (rememberEmail) {
        await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, normalizedEmail);
      } else {
        await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch (err) {
      setError(err.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.logoArea}>
        <Text style={styles.logo}>SIGA</Text>
        <Text style={styles.logoSub}>Acesse sua conta</Text>
      </View>

      <View style={styles.card}>
        <Input
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Input
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
        />

        <View style={styles.loginOptions}>
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberEmail((currentValue) => !currentValue)}
          >
            <View
              style={[
                styles.checkbox,
                rememberEmail && styles.checkboxChecked,
              ]}
            >
              {rememberEmail && <Text style={styles.checkboxMark}>✓</Text>}
            </View>

            <Text style={styles.rememberText}>Lembrar meu e-mail</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword((currentValue) => !currentValue)}
          >
            <Text style={styles.passwordToggleText}>
              {showPassword ? "Ocultar senha" : "Mostrar senha"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={handleForgotPassword}
        >
          <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <ErrorMessage message={error} />

        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.link}
        onPress={() => navigation.navigate(ROUTES.REGISTER_COMPANY)}
      >
        <Text style={styles.linkText}>Não tem conta? Cadastre sua empresa</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  logoArea: {
    alignItems: "center",
    paddingVertical: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: "900",
    color: theme.colors.primary,
    letterSpacing: 8,
  },
  logoSub: {
    color: theme.colors.mutedText,
    marginTop: 4,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    gap: 14,
  },
  loginOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxMark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
  rememberText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  passwordToggle: {
    paddingVertical: 4,
  },
  passwordToggleText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    paddingVertical: 2,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  button: {
    minHeight: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  link: {
    alignItems: "center",
    marginTop: 20,
    padding: 8,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
});
