import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { updateUserApi, getUserByIdApi } from "../../api/userApi";
import ErrorMessage from "../../components/ErrorMessage";
import Input from "../../components/Input";
import LoadingState from "../../components/LoadingState";
import { theme } from "../../config/theme";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../contexts/AuthContext";

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function normalizeText(value) {
  return String(value || "").trim();
}

function buildAddressData({
  street,
  number,
  neighborhood,
  city,
  state,
  postalCode,
}) {
  return {
    street: normalizeText(street) || null,
    number: normalizeText(number) || null,
    neighborhood: normalizeText(neighborhood) || null,
    city: normalizeText(city) || null,
    state: normalizeText(state).toUpperCase() || null,
    postalCode: normalizeText(postalCode) || null,
  };
}

export default function UserProfileEditScreen({ navigation }) {
  const auth = useAuth();
  const token = auth?.token;
  const user = auth?.user;
  const address = user?.address || {};

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const [street, setStreet] = useState(address?.street || "");
  const [number, setNumber] = useState(address?.number || "");
  const [neighborhood, setNeighborhood] = useState(address?.neighborhood || "");
  const [city, setCity] = useState(address?.city || "");
  const [state, setState] = useState(address?.state || "");
  const [postalCode, setPostalCode] = useState(address?.postalCode || "");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [initialProfile, setInitialProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      try {
        if (!user?.id || !token) {
          setError("Usuário não autenticado.");
          setLoading(false);
          return;
        }

        const response = await getUserByIdApi(user.id, token);

        const userData = response?.data || response;
        const userAddress = userData?.address || {};

        const loadedProfile = {
          name: userData?.name || "",
          email: userData?.email || "",
          phone: userData?.phone || "",
          street: userAddress?.street || "",
          number: userAddress?.number || "",
          neighborhood: userAddress?.neighborhood || "",
          city: userAddress?.city || "",
          state: userAddress?.state || "",
          postalCode: userAddress?.postalCode || "",
        };

        setName(loadedProfile.name);
        setEmail(loadedProfile.email);
        setPhone(loadedProfile.phone);
        setStreet(loadedProfile.street);
        setNumber(loadedProfile.number);
        setNeighborhood(loadedProfile.neighborhood);
        setCity(loadedProfile.city);
        setState(loadedProfile.state);
        setPostalCode(loadedProfile.postalCode);
        setInitialProfile(loadedProfile);

        setError("");
      } catch (err) {
        setError(err.message || "Erro ao carregar dados do usuário.");
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [user?.id, token]);

  const hasChanges = useMemo(() => {
    if (!initialProfile) {
      return false;
    }

    const currentProfile = {
      name,
      email,
      phone,
      street,
      number,
      neighborhood,
      city,
      state,
      postalCode,
    };

    const profileChanged = Object.keys(currentProfile).some((key) => {
      if (key === "email") {
        return normalizeEmail(currentProfile[key]) !== normalizeEmail(initialProfile[key]);
      }

      if (key === "state") {
        return normalizeText(currentProfile[key]).toUpperCase() !==
          normalizeText(initialProfile[key]).toUpperCase();
      }

      return normalizeText(currentProfile[key]) !== normalizeText(initialProfile[key]);
    });

    const passwordChanged = Boolean(password || confirmPassword);

    return profileChanged || passwordChanged;
  }, [
    initialProfile,
    name,
    email,
    phone,
    street,
    number,
    neighborhood,
    city,
    state,
    postalCode,
    password,
    confirmPassword,
  ]);

  function validateForm() {
    if (!name.trim()) {
      return "Informe seu nome completo.";
    }

    if (!email.trim()) {
      return "Informe seu e-mail.";
    }

    if (!/\S+@\S+\.\S+/.test(normalizeEmail(email))) {
      return "Informe um e-mail válido.";
    }

    if (confirmPassword && !password) {
      return "Informe a nova senha ou limpe o campo de confirmação.";
    }

    if (password && password.length < 6) {
      return "A senha deve ter pelo menos 6 caracteres.";
    }

    if (password && password !== confirmPassword) {
      return "As senhas não coincidem.";
    }

    if (!hasChanges) {
      return "Nenhuma alteração foi feita.";
    }

    return "";
  }

  function handleBack() {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate(ROUTES.OPERATOR_DASHBOARD);
  }

  async function handleSave() {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!token || !user?.id) {
      setError("Usuário não autenticado. Faça login novamente.");
      return;
    }

    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const addressData = buildAddressData({
        street,
        number,
        neighborhood,
        city,
        state,
        postalCode,
      });

      const hasAddressData = Object.values(addressData).some((val) => val);

      const payload = {
        name: name.trim(),
        email: normalizeEmail(email),
        phone: phone.trim() || null,
        ...(hasAddressData && { address: addressData }),
      };

      if (password) {
        payload.password = password;
      }

      await updateUserApi(user.id, payload, token);

      setInitialProfile({
        name: payload.name,
        email: payload.email,
        phone: payload.phone || "",
        street: addressData.street || "",
        number: addressData.number || "",
        neighborhood: addressData.neighborhood || "",
        city: addressData.city || "",
        state: addressData.state || "",
        postalCode: addressData.postalCode || "",
      });

      setPassword("");
      setConfirmPassword("");
      setSuccess(true);

      setTimeout(() => {
        handleBack();
      }, 2000);
    } catch (err) {
      setError(err.message || "Erro ao atualizar perfil.");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !success) {
    return <LoadingState />;
  }

  const isSaveDisabled = loading || !hasChanges;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Editar Perfil</Text>
        <Text style={styles.subtitle}>Atualize suas informações</Text>
      </View>

      <ErrorMessage message={error} />

      {success && (
        <View style={styles.successMessage}>
          <Text style={styles.successText}>✓ Perfil atualizado com sucesso!</Text>
        </View>
      )}

      <View style={styles.form}>
        <Text style={styles.sectionLabel}>Informações Pessoais</Text>

        <Input
          label="Nome Completo"
          value={name}
          onChangeText={setName}
          placeholder="Digite seu nome completo"
          editable={!loading}
        />

        <Input
          label="E-mail"
          value={email}
          onChangeText={(text) => setEmail(text.toLowerCase())}
          placeholder="seu@email.com"
          keyboardType="email-address"
          editable={!loading}
        />

        <Input
          label="Telefone"
          value={phone}
          onChangeText={setPhone}
          placeholder="(11) 99999-9999"
          keyboardType="phone-pad"
          editable={!loading}
        />

        <Text style={styles.sectionLabel}>Endereço</Text>

        <Input
          label="Rua"
          value={street}
          onChangeText={setStreet}
          placeholder="Nome da rua"
          editable={!loading}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Input
              label="Número"
              value={number}
              onChangeText={setNumber}
              placeholder="123"
              keyboardType="numeric"
              editable={!loading}
            />
          </View>

          <View style={styles.halfInput}>
            <Input
              label="Bairro"
              value={neighborhood}
              onChangeText={setNeighborhood}
              placeholder="Bairro"
              editable={!loading}
            />
          </View>
        </View>

        <Input
          label="CEP"
          value={postalCode}
          onChangeText={setPostalCode}
          placeholder="12345-678"
          editable={!loading}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Input
              label="Cidade"
              value={city}
              onChangeText={setCity}
              placeholder="São Paulo"
              editable={!loading}
            />
          </View>

          <View style={styles.halfInput}>
            <Input
              label="Estado (UF)"
              value={state}
              onChangeText={(text) => setState(text.toUpperCase().slice(0, 2))}
              placeholder="SP"
              maxLength={2}
              editable={!loading}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Alterar Senha (Opcional)</Text>

        <Input
          label="Nova Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="Deixe em branco para não alterar"
          secureTextEntry={!showPassword}
          editable={!loading}
        />

        <Input
          label="Confirmar Senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirme a nova senha"
          secureTextEntry={!showPassword}
          editable={!loading}
        />

        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={() => setShowPassword((current) => !current)}
          disabled={loading}
        >
          <Text style={styles.passwordToggleText}>
            {showPassword ? "Ocultar senha" : "Mostrar senha"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, isSaveDisabled && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSaveDisabled}
        >
          <Text style={styles.saveButtonText}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleBack}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  subtitle: {
    color: theme.colors.mutedText,
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  sectionLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.mutedText,
    textTransform: "uppercase",
  },
  passwordToggle: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  passwordToggleText: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  successMessage: {
    backgroundColor: "#dcfce7",
    borderRadius: theme.radius.md,
    padding: 16,
    alignItems: "center",
  },
  successText: {
    color: "#15803d",
    fontWeight: "700",
  },
  buttonContainer: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
