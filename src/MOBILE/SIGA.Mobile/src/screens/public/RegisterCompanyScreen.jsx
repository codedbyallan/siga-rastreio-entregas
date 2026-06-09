import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getAddressByCepApi } from "../../api/cepApi";
import { createCompanyApi } from "../../api/companyApi";
import { createUserApi } from "../../api/userApi";
import ErrorMessage from "../../components/ErrorMessage";
import Input from "../../components/Input";
import ScreenContainer from "../../components/ScreenContainer";
import { theme } from "../../config/theme";
import { ROLES } from "../../constants/roles";
import { ROUTES } from "../../constants/routes";

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function cleanText(value) {
  return String(value || "").trim();
}

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(String(email || "").trim());
}

function formatCnpj(value) {
  const digits = onlyDigits(value).slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatCep(value) {
  const digits = onlyDigits(value).slice(0, 8);

  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

function formatPhoneInput(value) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function getEntityId(entity) {
  return entity?.id || entity?._id || entity?.data?.id || entity?.data?._id || "";
}

function buildAddress({ street, number, neighborhood, city, state, postalCode }) {
  return {
    street: cleanText(street),
    number: cleanText(number),
    neighborhood: cleanText(neighborhood),
    city: cleanText(city),
    state: cleanText(state).toUpperCase(),
    postalCode: onlyDigits(postalCode),
  };
}

export default function RegisterCompanyScreen({ navigation }) {
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");

  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const [operatorName, setOperatorName] = useState("");
  const [operatorEmail, setOperatorEmail] = useState("");
  const [operatorPassword, setOperatorPassword] = useState("");
  const [operatorPasswordConfirm, setOperatorPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isFormReady =
    cleanText(companyName) &&
    onlyDigits(cnpj).length === 14 &&
    onlyDigits(cep).length === 8 &&
    cleanText(street) &&
    cleanText(number) &&
    cleanText(neighborhood) &&
    cleanText(city) &&
    cleanText(state) &&
    cleanText(operatorName) &&
    cleanText(operatorEmail) &&
    cleanText(operatorPassword) &&
    cleanText(operatorPasswordConfirm);

  function handleCnpjChange(value) {
    setCnpj(formatCnpj(value));
  }

  function handlePhoneChange(value) {
    setPhone(formatPhoneInput(value));
  }

  function handleCepChange(value) {
    setCep(formatCep(value));
  }

  function handleStateChange(value) {
    setState(cleanText(value).toUpperCase().slice(0, 2));
  }

  function handleOperatorEmailChange(value) {
    setOperatorEmail(cleanText(value).toLowerCase());
  }

  async function handleCepSearch() {
    const cleanCep = onlyDigits(cep);

    if (cleanCep.length !== 8) {
      setError("Informe um CEP com 8 dígitos.");
      return;
    }

    setError("");
    setCepLoading(true);

    try {
      const addr = await getAddressByCepApi(cleanCep);

      setStreet(addr?.street || "");
      setNeighborhood(addr?.neighborhood || "");
      setCity(addr?.city || "");
      setState(addr?.state || "");
    } catch (err) {
      setError(err.message || "Não foi possível buscar o CEP.");
    } finally {
      setCepLoading(false);
    }
  }

  function validateForm() {
    const cleanCnpj = onlyDigits(cnpj);
    const cleanCep = onlyDigits(cep);
    const email = cleanText(operatorEmail).toLowerCase();

    if (!cleanText(companyName)) {
      return "Informe o nome da empresa.";
    }

    if (!cleanCnpj) {
      return "Informe o CNPJ da empresa.";
    }

    if (cleanCnpj.length !== 14) {
      return "Informe um CNPJ com 14 dígitos.";
    }

    if (
      !cleanText(street) ||
      !cleanText(number) ||
      !cleanText(neighborhood) ||
      !cleanText(city) ||
      !cleanText(state) ||
      cleanCep.length !== 8
    ) {
      return "Preencha o endereço completo da empresa.";
    }

    if (!cleanText(operatorName)) {
      return "Informe o nome do operador.";
    }

    if (!email) {
      return "Informe o e-mail do operador.";
    }

    if (!isValidEmail(email)) {
      return "Informe um e-mail válido para o operador.";
    }

    if (!cleanText(operatorPassword)) {
      return "Informe a senha do operador.";
    }

    if (cleanText(operatorPassword).length < 6) {
      return "A senha deve ter pelo menos 6 caracteres.";
    }

    if (cleanText(operatorPassword) !== cleanText(operatorPasswordConfirm)) {
      return "As senhas do operador não conferem.";
    }

    return "";
  }

  async function handleRegister() {
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const companyPayload = {
        name: cleanText(companyName),
        cnpj: onlyDigits(cnpj),
        phone: cleanText(phone),
        address: buildAddress({
          street,
          number,
          neighborhood,
          city,
          state,
          postalCode: cep,
        }),
      };

      const company = await createCompanyApi(companyPayload);
      const companyId = getEntityId(company);

      if (!companyId) {
        throw new Error("A API não retornou o ID da empresa cadastrada.");
      }

      await createUserApi({
        name: cleanText(operatorName),
        email: cleanText(operatorEmail).toLowerCase(),
        password: cleanText(operatorPassword),
        role: ROLES.COMPANY_OPERATOR,
        companyId,
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Erro ao cadastrar empresa e operador.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <ScreenContainer>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✓</Text>

          <Text style={styles.successTitle}>Cadastro realizado!</Text>

          <Text style={styles.successText}>
            Empresa e operador criados com sucesso. Faça login para continuar.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate(ROUTES.LOGIN)}
          >
            <Text style={styles.buttonText}>Ir para o login</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.pageTitle}>Cadastro de Empresa</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados da empresa</Text>

        <Input
          label="Nome da empresa *"
          value={companyName}
          onChangeText={setCompanyName}
          placeholder="Razão social"
        />

        <Input
          label="CNPJ *"
          value={cnpj}
          onChangeText={handleCnpjChange}
          placeholder="00.000.000/0000-00"
          keyboardType="numeric"
        />

        <Input
          label="Telefone"
          value={phone}
          onChangeText={handlePhoneChange}
          placeholder="(11) 99999-9999"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Endereço</Text>

        <View style={styles.cepRow}>
          <View style={{ flex: 1 }}>
            <Input
              label="CEP *"
              value={cep}
              onChangeText={handleCepChange}
              placeholder="00000-000"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={styles.cepButton}
            onPress={handleCepSearch}
            disabled={cepLoading}
          >
            {cepLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.cepButtonText}>Buscar</Text>
            )}
          </TouchableOpacity>
        </View>

        <Input
          label="Rua *"
          value={street}
          onChangeText={setStreet}
          placeholder="Nome da rua"
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input
              label="Número *"
              value={number}
              onChangeText={setNumber}
              placeholder="Nº"
              keyboardType="numeric"
            />
          </View>

          <View style={{ flex: 2 }}>
            <Input
              label="Bairro *"
              value={neighborhood}
              onChangeText={setNeighborhood}
              placeholder="Bairro"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <Input
              label="Cidade *"
              value={city}
              onChangeText={setCity}
              placeholder="Cidade"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Input
              label="UF *"
              value={state}
              onChangeText={handleStateChange}
              placeholder="UF"
              autoCapitalize="characters"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados do operador</Text>

        <Input
          label="Nome *"
          value={operatorName}
          onChangeText={setOperatorName}
          placeholder="Seu nome"
        />

        <Input
          label="E-mail *"
          value={operatorEmail}
          onChangeText={handleOperatorEmailChange}
          placeholder="email@empresa.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Input
          label="Senha *"
          value={operatorPassword}
          onChangeText={setOperatorPassword}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry={!showPassword}
        />

        <Input
          label="Confirmar senha *"
          value={operatorPasswordConfirm}
          onChangeText={setOperatorPasswordConfirm}
          placeholder="Digite a senha novamente"
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
      </View>

      <ErrorMessage message={error} />

      <TouchableOpacity
        style={[
          styles.button,
          (loading || !isFormReady) && styles.buttonDisabled,
        ]}
        onPress={handleRegister}
        disabled={loading || !isFormReady}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Cadastrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.link}
        onPress={() => navigation.navigate(ROUTES.LOGIN)}
      >
        <Text style={styles.linkText}>Já tem conta? Entrar</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.primary,
    marginBottom: 16,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "800",
    color: theme.colors.text,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  cepRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  cepButton: {
    minHeight: 48,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cepButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  passwordToggle: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  passwordToggleText: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  button: {
    minHeight: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
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
    padding: 8,
    marginBottom: 16,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  successCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 32,
    alignItems: "center",
    gap: 16,
    marginTop: 40,
  },
  successIcon: {
    fontSize: 48,
    color: theme.colors.success,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.success,
  },
  successText: {
    color: theme.colors.mutedText,
    textAlign: "center",
    lineHeight: 22,
  },
});