import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getDeliveryTrackingApi } from "../../api/trackingApi";
import AddressBlock from "../../components/AddressBlock";
import ErrorMessage from "../../components/ErrorMessage";
import Input from "../../components/Input";
import ScreenContainer from "../../components/ScreenContainer";
import StatusBadge from "../../components/StatusBadge";
import Timeline from "../../components/Timeline";
import { theme } from "../../config/theme";
import { ROUTES } from "../../constants/routes";
import { formatStatus } from "../../utils/formatters";

function normalizeTrackingResult(result) {
  if (!result) {
    return null;
  }

  const delivery = result.delivery || result;

  return {
    ...delivery,
    trackingCode: delivery.trackingCode || result.trackingCode,
    status: delivery.status || result.status,
    originAddress: delivery.originAddress || result.originAddress || null,
    destinationAddress:
      delivery.destinationAddress ||
      delivery.address ||
      result.destinationAddress ||
      result.address ||
      null,
    events: result.events || delivery.events || [],
  };
}

export default function HomeTrackingScreen({ navigation }) {
  const [trackingCode, setTrackingCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasTrackingCode = trackingCode.trim().length > 0;

  function handleTrackingCodeChange(value) {
    setTrackingCode(value.toUpperCase());
  }

  async function handleSearch() {
    const cleanTrackingCode = trackingCode.trim().toUpperCase();

    if (!cleanTrackingCode) {
      setError("Informe o código de rastreio.");
      return;
    }

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const data = await getDeliveryTrackingApi(cleanTrackingCode);
      setResult(normalizeTrackingResult(data));
    } catch (err) {
      setError(err.message || "Não foi possível localizar a encomenda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.logo}>SIGA</Text>
        <Text style={styles.subtitle}>Rastreamento de Encomendas</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rastrear encomenda</Text>

        <Input
          label="Código de rastreio"
          value={trackingCode}
          onChangeText={handleTrackingCodeChange}
          placeholder="Ex: SIGA-ABC123-XYZ"
          autoCapitalize="characters"
        />

        <ErrorMessage message={error} />

        <TouchableOpacity
          style={[
            styles.button,
            (!hasTrackingCode || loading) && styles.buttonDisabled,
          ]}
          onPress={handleSearch}
          disabled={!hasTrackingCode || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Consultar</Text>
          )}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultWrapper}>
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                Código: {result.trackingCode || "—"}
              </Text>

              <StatusBadge status={result.status} />
            </View>

            <Text style={styles.resultLabel}>Status atual</Text>
            <Text style={styles.resultValue}>{formatStatus(result.status)}</Text>
          </View>

          {result.originAddress && (
            <AddressBlock title="Origem" address={result.originAddress} />
          )}

          {result.destinationAddress && (
            <AddressBlock title="Destino" address={result.destinationAddress} />
          )}

          {result.events?.length > 0 && (
            <View style={styles.timelineCard}>
              <Text style={styles.sectionTitle}>Histórico</Text>
              <Timeline events={result.events} />
            </View>
          )}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate(ROUTES.LOGIN)}
        >
          <Text style={styles.linkText}>Entrar na conta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate(ROUTES.REGISTER_COMPANY)}
        >
          <Text style={styles.linkText}>Cadastrar empresa</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingVertical: 32,
  },
  logo: {
    fontSize: 48,
    fontWeight: "900",
    color: theme.colors.primary,
    letterSpacing: 8,
  },
  subtitle: {
    color: theme.colors.mutedText,
    marginTop: 4,
    fontSize: 14,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
  },
  button: {
    minHeight: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  resultWrapper: {
    marginTop: 16,
    gap: 12,
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    gap: 6,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
    flex: 1,
  },
  resultLabel: {
    fontWeight: "700",
    color: theme.colors.mutedText,
    fontSize: 12,
    textTransform: "uppercase",
    marginTop: 8,
  },
  resultValue: {
    color: theme.colors.text,
    fontSize: 15,
  },
  timelineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontWeight: "800",
    color: theme.colors.text,
    fontSize: 15,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 24,
  },
  linkButton: {
    padding: 8,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
});
