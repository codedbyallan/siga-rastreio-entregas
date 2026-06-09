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

export default function OperatorTrackingScreen() {
  const [trackingCode, setTrackingCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    const cleanTrackingCode = trackingCode.trim();

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
      <Text style={styles.title}>Rastrear encomenda</Text>

      <View style={styles.card}>
        <Input
          label="Código de rastreio"
          value={trackingCode}
          onChangeText={setTrackingCode}
          placeholder="SIGA-XXXXXX-XXXXXX"
          autoCapitalize="characters"
        />

        <ErrorMessage message={error} />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Consultar</Text>
          )}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={{ gap: 12, marginTop: 4 }}>
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultCode}>
                {result.trackingCode || "—"}
              </Text>

              <StatusBadge status={result.status} />
            </View>

            <Text style={styles.resultStatus}>
              {formatStatus(result.status)}
            </Text>
          </View>

          {result.originAddress && (
            <AddressBlock title="Origem" address={result.originAddress} />
          )}

          {result.destinationAddress && (
            <AddressBlock title="Destino" address={result.destinationAddress} />
          )}

          {result.events?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Histórico</Text>
              <Timeline events={result.events} />
            </View>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.primary,
    marginTop: 24,
    marginBottom: 4,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 12,
  },
  button: {
    minHeight: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 8,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  resultCode: {
    fontWeight: "800",
    color: theme.colors.text,
    fontSize: 15,
    flex: 1,
  },
  resultStatus: {
    color: theme.colors.mutedText,
  },
  sectionTitle: {
    fontWeight: "800",
    color: theme.colors.text,
  },
});