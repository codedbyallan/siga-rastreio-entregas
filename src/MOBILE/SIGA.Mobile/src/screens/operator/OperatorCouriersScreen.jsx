import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createUserApi, getCouriersByCompanyIdApi } from "../../api/userApi";
import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import Input from "../../components/Input";
import LoadingState from "../../components/LoadingState";
import { theme } from "../../config/theme";
import { ROLES } from "../../constants/roles";
import { useAuth } from "../../contexts/AuthContext";

function getPayload(response) {
  return response?.data || response;
}

function normalizeCouriers(data) {
  const payload = getPayload(data);

  if (!payload) {
    return [];
  }

  const list = Array.isArray(payload)
    ? payload
    : payload.users || payload.couriers || payload.items || [];

  if (!Array.isArray(list)) {
    return [];
  }

  return list;
}

function getEntityId(entity) {
  return entity?.id || entity?._id || "";
}

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(String(email || "").trim());
}

export default function OperatorCouriersScreen() {
  const auth = useAuth();

  const token = auth?.token;
  const user = auth?.user;
  const companyId = auth?.companyId || user?.companyId;

  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadCouriers() {
    if (!companyId) {
      setError("Empresa não identificada. Faça login novamente.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError("");

    try {
      const data = await getCouriersByCompanyIdApi(companyId, token);
      setCouriers(normalizeCouriers(data));
    } catch (err) {
      setError(err.message || "Não foi possível carregar entregadores.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadCouriers();
    }, [companyId, token])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadCouriers();
  }

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setFormError("");
  }

  function toggleForm() {
    if (showForm) {
      resetForm();
    } else {
      setSuccessMessage("");
    }

    setShowForm(!showForm);
  }

  function handleEmailChange(value) {
    setEmail(String(value || "").toLowerCase());
  }

  function validateForm() {
    if (!companyId) {
      return "Empresa não identificada. Faça login novamente.";
    }

    if (!name.trim()) {
      return "Informe o nome do entregador.";
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return "Informe o e-mail do entregador.";
    }

    if (!isValidEmail(normalizedEmail)) {
      return "Informe um e-mail válido.";
    }

    if (!password.trim()) {
      return "Informe uma senha para o entregador.";
    }

    if (password.trim().length < 6) {
      return "A senha deve ter pelo menos 6 caracteres.";
    }

    return "";
  }

  async function handleCreate() {
    setFormError("");
    setSuccessMessage("");

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      await createUserApi(
        {
          name: name.trim(),
          email: normalizedEmail,
          password: password.trim(),
          role: ROLES.COURIER,
          companyId,
        },
        token
      );

      resetForm();
      setShowForm(false);
      setSuccessMessage("Entregador cadastrado com sucesso.");
      await loadCouriers();
    } catch (err) {
      setFormError(err.message || "Não foi possível cadastrar o entregador.");
    } finally {
      setSaving(false);
    }
  }

  const isSubmitDisabled =
    saving || !name.trim() || !email.trim() || !password.trim();

  if (loading) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Entregadores</Text>
            <Text style={styles.subtitle}>Usuários vinculados à empresa</Text>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={toggleForm}>
            <Text style={styles.addBtnText}>
              {showForm ? "Cancelar" : "+ Novo"}
            </Text>
          </TouchableOpacity>
        </View>

        <ErrorMessage message={error} />

        {!!successMessage && (
          <Text style={styles.successText}>{successMessage}</Text>
        )}

        {showForm && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Novo entregador</Text>

            <Input
              label="Nome"
              value={name}
              onChangeText={setName}
              placeholder="Nome completo"
            />

            <Input
              label="E-mail"
              value={email}
              onChangeText={handleEmailChange}
              placeholder="email@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword((current) => !current)}
            >
              <Text style={styles.passwordToggleText}>
                {showPassword ? "Ocultar senha" : "Mostrar senha"}
              </Text>
            </TouchableOpacity>

            <ErrorMessage message={formError} />

            <TouchableOpacity
              style={[styles.button, isSubmitDisabled && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={isSubmitDisabled}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Cadastrar entregador</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {couriers.length === 0 ? (
          <EmptyState message="Nenhum entregador cadastrado." />
        ) : (
          <View style={styles.list}>
            {couriers.map((courier) => {
              const courierId = getEntityId(courier);
              const courierName = courier?.name || "Entregador";
              const courierInitial = courierName[0]?.toUpperCase() || "?";

              return (
                <View key={courierId || courier.email} style={styles.courierCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{courierInitial}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.courierName}>{courierName}</Text>

                    <Text style={styles.courierEmail}>
                      {courier?.email || "E-mail não informado"}
                    </Text>

                    {courierId && (
                      <Text style={styles.courierId}>ID: {courierId}</Text>
                    )}
                  </View>

                  <View style={styles.roleTag}>
                    <Text style={styles.roleTagText}>Entregador</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
    padding: 20,
    gap: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  subtitle: {
    color: theme.colors.mutedText,
    marginTop: 2,
    fontSize: 13,
  },
  addBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontWeight: "800",
    color: theme.colors.text,
    fontSize: 16,
  },
  button: {
    minHeight: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
  },
  passwordToggle: {
    alignSelf: "flex-end",
    paddingVertical: 4,
  },
  passwordToggleText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  successText: {
    color: "#15803d",
    fontWeight: "700",
    backgroundColor: "#dcfce7",
    borderRadius: theme.radius.md,
    padding: 12,
  },
  list: {
    gap: 10,
  },
  courierCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  courierName: {
    fontWeight: "800",
    color: theme.colors.text,
  },
  courierEmail: {
    color: theme.colors.mutedText,
    fontSize: 13,
    marginTop: 2,
  },
  courierId: {
    color: theme.colors.mutedText,
    fontSize: 11,
    marginTop: 2,
  },
  roleTag: {
    backgroundColor: "#e0f2fe",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleTagText: {
    color: "#075985",
    fontWeight: "700",
    fontSize: 12,
  },
});