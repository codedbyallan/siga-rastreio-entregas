import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getCompanyByIdApi } from "../../api/companyApi";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingState from "../../components/LoadingState";
import { theme } from "../../config/theme";
import { useAuth } from "../../contexts/AuthContext";
import { formatAddress } from "../../utils/formatters";

function getPayload(response) {
  return response?.data || response;
}

export default function CompanyProfileScreen() {
  const auth = useAuth();

  const token = auth?.token;
  const user = auth?.user;
  const logout = auth?.logout;
  const companyId = auth?.companyId || user?.companyId;

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadCompany = useCallback(
    async (isRefreshing = false) => {
      if (!companyId) {
        setError("Empresa não identificada. Faça login novamente.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setError("");

      if (!isRefreshing) {
        setLoading(true);
      }

      try {
        const data = await getCompanyByIdApi(companyId, token);
        const payload = getPayload(data);

        if (!payload) {
          setCompany(null);
          setError("Empresa não encontrada para este usuário.");
          return;
        }

        setCompany(payload);
      } catch (err) {
        setError(err.message || "Não foi possível carregar os dados da empresa.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [companyId, token]
  );

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  function handleRefresh() {
    setRefreshing(true);
    loadCompany(true);
  }

  if (loading) {
    return <LoadingState />;
  }

  const companyName = company?.name || "Empresa";
  const companyInitial = companyName[0]?.toUpperCase() || "E";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Perfil da Empresa</Text>
        <Text style={styles.subtitle}>
          Dados cadastrais vinculados ao operador logado
        </Text>
      </View>

      <ErrorMessage message={error} />

      <View style={styles.avatarCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{companyInitial}</Text>
        </View>

        <Text style={styles.companyName}>{companyName}</Text>
        <Text style={styles.cnpj}>CNPJ: {company?.cnpj || "Não informado"}</Text>
      </View>

      {!company && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>Empresa não carregada</Text>
          <Text style={styles.noticeText}>
            Não foi possível identificar os dados da empresa vinculada a esta
            conta. Puxe a tela para baixo para tentar carregar novamente.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados da empresa</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Nome</Text>
          <Text style={styles.fieldValue}>
            {company?.name || "Não informado"}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>CNPJ</Text>
          <Text style={styles.fieldValue}>
            {company?.cnpj || "Não informado"}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Telefone</Text>
          <Text style={styles.fieldValue}>
            {company?.phone || "Não informado"}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Endereço</Text>
          <Text style={styles.fieldValue}>
            {formatAddress(company?.address)}
          </Text>
        </View>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>Edição bloqueada no mobile</Text>
          <Text style={styles.noticeText}>
            Os dados da empresa são exibidos apenas para consulta. Alterações
            cadastrais devem ser feitas por um administrador.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Operador logado</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Nome</Text>
          <Text style={styles.fieldValue}>{user?.name || "Não informado"}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>E-mail</Text>
          <Text style={styles.fieldValue}>{user?.email || "Não informado"}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Perfil</Text>
          <Text style={styles.fieldValue}>{user?.role || "Não informado"}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
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
    gap: 14,
    paddingBottom: 40,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  subtitle: {
    color: theme.colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
  avatarCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
  },
  companyName: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.text,
    textAlign: "center",
  },
  cnpj: {
    color: theme.colors.mutedText,
    fontSize: 14,
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
  field: {
    gap: 2,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  fieldLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  fieldValue: {
    color: theme.colors.text,
    fontSize: 15,
  },
  noticeBox: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  noticeTitle: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 13,
  },
  noticeText: {
    color: theme.colors.mutedText,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  logoutBtn: {
    minHeight: 48,
    backgroundColor: "#fee2e2",
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: theme.colors.danger,
    fontWeight: "700",
  },
});
