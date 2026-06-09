import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAddressByCepApi } from "../../api/cepApi";
import { getCompanyByIdApi } from "../../api/companyApi";
import { createDeliveryApi } from "../../api/deliveryApi";
import { createDeliveryEventApi } from "../../api/deliveryEventApi";
import { createOrderApi } from "../../api/orderApi";
import ErrorMessage from "../../components/ErrorMessage";
import Input from "../../components/Input";
import { theme } from "../../config/theme";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../contexts/AuthContext";

function onlyNumbers(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCepInput(value) {
  const numbers = onlyNumbers(value).slice(0, 8);

  if (numbers.length <= 5) {
    return numbers;
  }

  return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
}

function formatPhoneInput(value) {
  const numbers = onlyNumbers(value).slice(0, 11);

  if (numbers.length <= 2) {
    return numbers;
  }

  if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }

  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }

  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

function formatStateInput(value) {
  return String(value || "")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 2)
    .toUpperCase();
}

function sanitizeMoneyInput(value) {
  return String(value || "").replace(/[^\d,.]/g, "");
}

function parseMoneyValue(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return NaN;
  }

  const normalizedValue =
    rawValue.includes(",") && rawValue.includes(".")
      ? rawValue.replace(/\./g, "").replace(",", ".")
      : rawValue.replace(",", ".");

  return Number(normalizedValue);
}

function isValidDateParts(year, month, day) {
  const parsedDate = new Date(year, month - 1, day);

  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  );
}

function generateTrackingCode() {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  const currentYear = new Date().getFullYear();

  return `SIGA-${currentYear}-${randomNumber}`;
}

function withTimeout(promise, label, timeoutMs = 45000) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          `${label} demorou mais que o esperado. Verifique se as APIs do Render estão acordadas e tente novamente.`
        )
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

function formatDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parsePostingDate(value) {
  const trimmedValue = String(value || "").trim();

  if (!trimmedValue) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    const [year, month, day] = trimmedValue.split("-").map(Number);

    if (!isValidDateParts(year, month, day)) {
      return null;
    }

    return new Date(year, month - 1, day);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmedValue)) {
    const [day, month, year] = trimmedValue.split("/").map(Number);

    if (!isValidDateParts(year, month, day)) {
      return null;
    }

    return new Date(year, month - 1, day);
  }

  return null;
}
function isValidEmail(email) {
  if (!email) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());
}

function getCompanyData(response) {
  return response?.data || response || null;
}

function getResponseId(response) {
  const data = response?.data || response;

  return data?.id || data?.order?.id || data?.delivery?.id;
}

function buildAddress({ street, number, neighborhood, city, state, postalCode }) {
  return {
    street: street.trim(),
    number: number.trim(),
    neighborhood: neighborhood.trim(),
    city: city.trim(),
    state: state.trim().toUpperCase(),
    postalCode: onlyNumbers(postalCode),
  };
}

function getCalendarDays(currentMonth) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekDay = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const days = [];

  for (let index = 0; index < firstWeekDay; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function CalendarModal({ visible, selectedDate, onClose, onSelect }) {
  const initialDate = parsePostingDate(selectedDate) || new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );

  useEffect(() => {
    if (visible) {
      const date = parsePostingDate(selectedDate) || new Date();
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [selectedDate, visible]);

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth]
  );

  const monthLabel = currentMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  function goToPreviousMonth() {
    setCurrentMonth(
      (previousMonth) =>
        new Date(previousMonth.getFullYear(), previousMonth.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setCurrentMonth(
      (previousMonth) =>
        new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 1)
    );
  }

  function isSelectedDate(date) {
    const parsedSelectedDate = parsePostingDate(selectedDate);

    if (!parsedSelectedDate || !date) {
      return false;
    }

    return formatDateOnly(parsedSelectedDate) === formatDateOnly(date);
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              style={styles.calendarNavButton}
              onPress={goToPreviousMonth}
            >
              <Text style={styles.calendarNavButtonText}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.calendarTitle}>{monthLabel}</Text>

            <TouchableOpacity
              style={styles.calendarNavButton}
              onPress={goToNextMonth}
            >
              <Text style={styles.calendarNavButtonText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {["D", "S", "T", "Q", "Q", "S", "S"].map((weekDay, index) => (
              <Text key={`${weekDay}-${index}`} style={styles.weekDay}>
                {weekDay}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              const selected = isSelectedDate(date);

              return (
                <TouchableOpacity
                  key={date ? formatDateOnly(date) : `empty-${index}`}
                  style={[
                    styles.dayButton,
                    selected && styles.dayButtonSelected,
                    !date && styles.dayButtonEmpty,
                  ]}
                  disabled={!date}
                  onPress={() => {
                    onSelect(formatDateOnly(date));
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      selected && styles.dayButtonTextSelected,
                    ]}
                  >
                    {date ? date.getDate() : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.calendarCloseButton} onPress={onClose}>
            <Text style={styles.calendarCloseButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function AddressSection({
  title,
  cep,
  onCepChange,
  onCepSearch,
  cepLoading,
  street,
  onStreet,
  number,
  onNumber,
  neighborhood,
  onNeighborhood,
  city,
  onCity,
  state,
  onState,
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.cepRow}>
        <View style={{ flex: 1 }}>
          <Input
            label="CEP"
            value={cep}
            onChangeText={onCepChange}
            placeholder="00000-000"
            keyboardType="numeric"
            maxLength={9}
          />
        </View>

        <TouchableOpacity
          style={styles.cepBtn}
          onPress={onCepSearch}
          disabled={cepLoading}
        >
          {cepLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.cepBtnText}>Buscar</Text>
          )}
        </TouchableOpacity>
      </View>

      <Input
        label="Endereço"
        value={street}
        onChangeText={onStreet}
        placeholder="Nome da rua"
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Input
            label="Número"
            value={number}
            onChangeText={onNumber}
            placeholder="Nº"
          />
        </View>

        <View style={{ flex: 2 }}>
          <Input
            label="Bairro"
            value={neighborhood}
            onChangeText={onNeighborhood}
            placeholder="Bairro"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 2 }}>
          <Input
            label="Cidade"
            value={city}
            onChangeText={onCity}
            placeholder="Cidade"
          />
        </View>

        <View style={{ flex: 1 }}>
          <Input
            label="UF"
            value={state}
            onChangeText={onState}
            placeholder="UF"
            autoCapitalize="characters"
            maxLength={2}
          />
        </View>
      </View>
    </View>
  );
}

export default function NewShipmentScreen({ navigation }) {
  const auth = useAuth();

  const token = auth?.token;
  const companyId = auth?.companyId || auth?.user?.companyId;
  const userId = auth?.userId || auth?.user?.id || auth?.user?.userId;

  const [trackingCode, setTrackingCode] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [carrier, setCarrier] = useState("");
  const [postingDate, setPostingDate] = useState("");
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);

  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [originCep, setOriginCep] = useState("");
  const [originStreet, setOriginStreet] = useState("");
  const [originNumber, setOriginNumber] = useState("");
  const [originNeighborhood, setOriginNeighborhood] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [originState, setOriginState] = useState("");
  const [originCepLoading, setOriginCepLoading] = useState(false);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);
  const [senderAutoFillMessage, setSenderAutoFillMessage] = useState("");

  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [destCep, setDestCep] = useState("");
  const [destStreet, setDestStreet] = useState("");
  const [destNumber, setDestNumber] = useState("");
  const [destNeighborhood, setDestNeighborhood] = useState("");
  const [destCity, setDestCity] = useState("");
  const [destState, setDestState] = useState("");
  const [destCepLoading, setDestCepLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    async function loadCompanyData() {
      if (!token || !companyId) {
        return;
      }

      setIsLoadingCompanyData(true);
      setSenderAutoFillMessage("");

      try {
        const response = await getCompanyByIdApi(companyId, token);
        const company = getCompanyData(response);
        const address = company?.address || {};

        setSenderName(company?.name || auth?.user?.name || "");
        setSenderEmail(String(company?.email || auth?.user?.email || "").trim().toLowerCase());
        setSenderPhone(formatPhoneInput(company?.phone || auth?.user?.phone || ""));
        setOriginCep(formatCepInput(address.postalCode || address.zipCode || ""));
        setOriginStreet(address.street || "");
        setOriginNumber(address.number || "");
        setOriginNeighborhood(address.neighborhood || "");
        setOriginCity(address.city || "");
        setOriginState(formatStateInput(address.state || ""));

        setSenderAutoFillMessage(
          "Remetente preenchido automaticamente com os dados da empresa logada. Você pode editar se a origem for diferente."
        );
      } catch (err) {
        setSenderAutoFillMessage(
          err.message ||
            "Não foi possível preencher o remetente automaticamente. Preencha manualmente."
        );
      } finally {
        setIsLoadingCompanyData(false);
      }
    }

    loadCompanyData();
  }, [auth?.user, companyId, token]);

  async function searchCep(
    cep,
    setStreet,
    setNeighborhood,
    setCity,
    setState,
    setLoading
  ) {
    if (onlyNumbers(cep).length !== 8) {
      setError("Informe um CEP com 8 dígitos.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const addr = await getAddressByCepApi(cep);

      setStreet(addr.street || "");
      setNeighborhood(addr.neighborhood || "");
      setCity(addr.city || "");
      setState(addr.state || "");
    } catch (err) {
      setError(err.message || "Erro ao buscar CEP.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  }

  function handleGenerateTrackingCode() {
    setTrackingCode(generateTrackingCode());
    setError("");
    setSuccess(null);
  }

  function handleTrackingCodeChange(value) {
    setTrackingCode(String(value || "").trim().toUpperCase());
  }

  function handlePriceChange(value) {
    setPrice(sanitizeMoneyInput(value));
  }

  function handleSenderEmailChange(value) {
    setSenderEmail(String(value || "").trim().toLowerCase());
  }

  function handleOriginCepChange(value) {
    setOriginCep(formatCepInput(value));
  }

  function handleDestinationCepChange(value) {
    setDestCep(formatCepInput(value));
  }

  function handleSenderPhoneChange(value) {
    setSenderPhone(formatPhoneInput(value));
  }

  function handleRecipientPhoneChange(value) {
    setRecipientPhone(formatPhoneInput(value));
  }

  function handleOriginStateChange(value) {
    setOriginState(formatStateInput(value));
  }

  function handleDestinationStateChange(value) {
    setDestState(formatStateInput(value));
  }

  function resetShipmentForm() {
    setTrackingCode("");
    setDescription("");
    setPrice("");
    setCarrier("");
    setPostingDate("");

    setRecipientName("");
    setRecipientPhone("");
    setDestCep("");
    setDestStreet("");
    setDestNumber("");
    setDestNeighborhood("");
    setDestCity("");
    setDestState("");

    setError("");
    setLoadingStep("");
    setSuccess(null);
  }

  function handleGoToDashboard() {
    const currentRouteNames = navigation?.getState?.()?.routeNames || [];
    const parentRouteNames = navigation?.getParent?.()?.getState?.()?.routeNames || [];

    if (currentRouteNames.includes(ROUTES.OPERATOR_DASHBOARD)) {
      navigation.navigate(ROUTES.OPERATOR_DASHBOARD);
      return;
    }

    if (parentRouteNames.includes(ROUTES.OPERATOR_DASHBOARD)) {
      navigation.getParent().navigate(ROUTES.OPERATOR_DASHBOARD);
      return;
    }

    if (parentRouteNames.includes(ROUTES.OPERATOR_TABS)) {
      navigation.getParent().navigate(ROUTES.OPERATOR_TABS, {
        screen: ROUTES.OPERATOR_DASHBOARD,
      });
      return;
    }

    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    setSuccess(null);
  }

  function validateRequiredFields() {
    if (!token) {
      return "Usuário não autenticado. Faça login novamente.";
    }

    if (!userId || !companyId) {
      return "Dados do usuário ou da empresa não foram encontrados. Faça login novamente.";
    }

    if (!trackingCode.trim()) {
      return "Gere ou informe o código de rastreio.";
    }

    if (!description.trim()) {
      return "Informe a descrição do objeto.";
    }

    if (!price.trim()) {
      return "Informe o valor declarado.";
    }

    const parsedPrice = parseMoneyValue(price);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return "Informe um valor declarado válido e maior que zero.";
    }

    if (!senderName.trim()) {
      return "Informe o nome/empresa do remetente.";
    }

    if (senderEmail && !isValidEmail(senderEmail)) {
      return "Informe um e-mail válido para o remetente.";
    }

    if (!recipientName.trim()) {
      return "Informe o nome do destinatário.";
    }

    if (!carrier.trim()) {
      return "Informe a transportadora.";
    }

    if (!postingDate.trim()) {
      return "Informe a data de postagem.";
    }

    if (!parsePostingDate(postingDate)) {
      return "Informe uma data de postagem válida no formato AAAA-MM-DD ou DD/MM/AAAA.";
    }

    if (
      !originStreet.trim() ||
      !originNumber.trim() ||
      !originNeighborhood.trim() ||
      !originCity.trim() ||
      !originState.trim() ||
      onlyNumbers(originCep).length !== 8
    ) {
      return "Preencha o endereço de origem completo.";
    }

    if (
      !destStreet.trim() ||
      !destNumber.trim() ||
      !destNeighborhood.trim() ||
      !destCity.trim() ||
      !destState.trim() ||
      onlyNumbers(destCep).length !== 8
    ) {
      return "Preencha o endereço de destino completo.";
    }

    return "";
  }

  const isFormReady = useMemo(() => {
    return Boolean(
      token &&
        userId &&
        companyId &&
        trackingCode.trim() &&
        description.trim() &&
        price.trim() &&
        senderName.trim() &&
        recipientName.trim() &&
        carrier.trim() &&
        postingDate.trim() &&
        originStreet.trim() &&
        originNumber.trim() &&
        originNeighborhood.trim() &&
        originCity.trim() &&
        originState.trim() &&
        onlyNumbers(originCep).length === 8 &&
        destStreet.trim() &&
        destNumber.trim() &&
        destNeighborhood.trim() &&
        destCity.trim() &&
        destState.trim() &&
        onlyNumbers(destCep).length === 8
    );
  }, [
    token,
    userId,
    companyId,
    trackingCode,
    description,
    price,
    senderName,
    recipientName,
    carrier,
    postingDate,
    originStreet,
    originNumber,
    originNeighborhood,
    originCity,
    originState,
    originCep,
    destStreet,
    destNumber,
    destNeighborhood,
    destCity,
    destState,
    destCep,
  ]);

  function buildPostingDateIso() {
    const parsedDate = parsePostingDate(postingDate);

    if (!parsedDate) {
      throw new Error("Data de postagem inválida.");
    }

    return parsedDate.toISOString();
  }

  async function handleCreate() {
    setError("");

    const validationError = validateRequiredFields();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setLoadingStep("Preparando dados da encomenda...");

    try {
      const totalPrice = parseMoneyValue(price);

      const originAddress = buildAddress({
        street: originStreet,
        number: originNumber,
        neighborhood: originNeighborhood,
        city: originCity,
        state: originState,
        postalCode: originCep,
      });

      const destinationAddress = buildAddress({
        street: destStreet,
        number: destNumber,
        neighborhood: destNeighborhood,
        city: destCity,
        state: destState,
        postalCode: destCep,
      });

      const orderPayload = {
        userId,
        companyId,
        totalPrice,
        status: "CREATED",
        items: [
          {
            name: description.trim(),
            quantity: 1,
            price: totalPrice,
          },
        ],
      };

      setLoadingStep("Criando pedido...");
      const order = await withTimeout(
        createOrderApi(orderPayload, token),
        "A criação do pedido"
      );
      const orderId = getResponseId(order);

      if (!orderId) {
        throw new Error("A API de pedidos não retornou o ID da encomenda.");
      }

      const deliveryPayload = {
        orderId,
        address: destinationAddress,
        originAddress,
        trackingCode: trackingCode.trim(),
        carrier: carrier.trim(),
        postingDate: buildPostingDateIso(),
        status: "CREATED",
        estimatedDeliveryDate: null,
      };

      setLoadingStep("Criando entrega...");
      const delivery = await withTimeout(
        createDeliveryApi(deliveryPayload, token),
        "A criação da entrega"
      );
      const deliveryId = getResponseId(delivery);

      if (!deliveryId) {
        throw new Error("A API de entregas não retornou o ID da entrega.");
      }

      const deliveryEventPayload = {
        deliveryId,
        orderId,
        status: "CREATED",
        description: "Encomenda cadastrada e entrega criada no sistema.",
        eventType: "DELIVERY_CREATED",
        actor: {
          type: "SYSTEM",
          id: userId,
        },
      };

      setLoadingStep("Registrando evento inicial de rastreio...");
      await withTimeout(
        createDeliveryEventApi(deliveryEventPayload, token),
        "A criação do evento inicial"
      );

      setSuccess({ trackingCode: trackingCode.trim(), orderId });
    } catch (err) {
      setError(err.message || "Erro ao criar encomenda.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  }

  if (success) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.successCard}>
          <Ionicons
            name="cube-outline"
            size={56}
            color={theme.colors.primary}
          />
          <Text style={styles.successTitle}>Encomenda criada!</Text>

          <Text style={styles.successLabel}>Código de rastreio</Text>
          <Text style={styles.successCode}>{success.trackingCode}</Text>

          <View style={styles.successActions}>
            <TouchableOpacity
              style={[styles.button, styles.successActionButton]}
              onPress={handleGoToDashboard}
            >
              <Text style={styles.buttonText}>Voltar para Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryActionButton, styles.successActionButton]}
              onPress={resetShipmentForm}
            >
              <Text style={styles.secondaryActionButtonText}>Cadastrar nova encomenda</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Nova Encomenda</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Informações da Encomenda</Text>
              <Text style={styles.sectionDescription}>
                Dados principais para identificação e rastreamento.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleGenerateTrackingCode}
            >
              <Text style={styles.secondaryButtonText}>Gerar código</Text>
            </TouchableOpacity>
          </View>

          <Input
            label="Código de rastreio *"
            value={trackingCode}
            onChangeText={handleTrackingCodeChange}
            placeholder="Clique em gerar código"
            autoCapitalize="characters"
          />

          <Input
            label="Transportadora *"
            value={carrier}
            onChangeText={setCarrier}
            placeholder="Ex: SIGA Express"
          />

          <Input
            label="Descrição do objeto *"
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: Caixa com eletrônicos"
          />

          <Input
            label="Valor declarado (R$) *"
            value={price}
            onChangeText={handlePriceChange}
            placeholder="0,00"
            keyboardType="decimal-pad"
          />

          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <Input
                label="Data da postagem *"
                value={postingDate}
                onChangeText={(value) => setPostingDate(String(value || "").trim())}
                placeholder="AAAA-MM-DD ou DD/MM/AAAA"
              />
            </View>

            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => setIsCalendarVisible(true)}
            >
              <Text style={styles.calendarButtonText}>Calendário</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remetente</Text>
          <Text style={styles.sectionDescription}>
            Pessoa ou empresa responsável pelo envio da encomenda.
          </Text>

          {isLoadingCompanyData ? (
            <Text style={styles.helperText}>Carregando dados da empresa...</Text>
          ) : null}

          {senderAutoFillMessage ? (
            <Text style={styles.helperText}>{senderAutoFillMessage}</Text>
          ) : null}

          <Input
            label="Nome / Empresa *"
            value={senderName}
            onChangeText={setSenderName}
            placeholder="Nome ou empresa do remetente"
          />

          <Input
            label="E-mail"
            value={senderEmail}
            onChangeText={handleSenderEmailChange}
            placeholder="email@empresa.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Telefone"
            value={senderPhone}
            onChangeText={handleSenderPhoneChange}
            placeholder="(11) 99999-9999"
            keyboardType="phone-pad"
          />
        </View>

        <AddressSection
          title="Endereço do Remetente"
          cep={originCep}
          onCepChange={handleOriginCepChange}
          onCepSearch={() =>
            searchCep(
              originCep,
              setOriginStreet,
              setOriginNeighborhood,
              setOriginCity,
              setOriginState,
              setOriginCepLoading
            )
          }
          cepLoading={originCepLoading}
          street={originStreet}
          onStreet={setOriginStreet}
          number={originNumber}
          onNumber={setOriginNumber}
          neighborhood={originNeighborhood}
          onNeighborhood={setOriginNeighborhood}
          city={originCity}
          onCity={setOriginCity}
          state={originState}
          onState={handleOriginStateChange}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destinatário</Text>

          <Input
            label="Nome *"
            value={recipientName}
            onChangeText={setRecipientName}
            placeholder="Nome do destinatário"
          />

          <Input
            label="Telefone"
            value={recipientPhone}
            onChangeText={handleRecipientPhoneChange}
            placeholder="(11) 99999-9999"
            keyboardType="phone-pad"
          />
        </View>

        <AddressSection
          title="Endereço de Destino"
          cep={destCep}
          onCepChange={handleDestinationCepChange}
          onCepSearch={() =>
            searchCep(
              destCep,
              setDestStreet,
              setDestNeighborhood,
              setDestCity,
              setDestState,
              setDestCepLoading
            )
          }
          cepLoading={destCepLoading}
          street={destStreet}
          onStreet={setDestStreet}
          number={destNumber}
          onNumber={setDestNumber}
          neighborhood={destNeighborhood}
          onNeighborhood={setDestNeighborhood}
          city={destCity}
          onCity={setDestCity}
          state={destState}
          onState={handleDestinationStateChange}
        />

        <ErrorMessage message={error} />

        {loadingStep ? (
          <Text style={styles.loadingStepText}>{loadingStep}</Text>
        ) : null}

        {!isFormReady && !loading ? (
          <Text style={styles.requiredHint}>
            Preencha todos os campos obrigatórios para cadastrar.
          </Text>
        ) : null}

        <TouchableOpacity
          style={[styles.button, (loading || !isFormReady) && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading || !isFormReady}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Cadastrar Encomenda</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <CalendarModal
        visible={isCalendarVisible}
        selectedDate={postingDate}
        onClose={() => setIsCalendarVisible(false)}
        onSelect={setPostingDate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
content: {
  padding: 20,
  paddingTop: 40,
  gap: 14,
  paddingBottom: 40,
},
  pageTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 12,
    ...theme.shadow.card,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  sectionTitle: {
    fontWeight: "800",
    color: theme.colors.text,
    fontSize: 16,
  },
  sectionDescription: {
    color: theme.colors.mutedText,
    fontSize: 13,
    marginTop: 4,
  },
  helperText: {
    color: theme.colors.info,
    fontSize: 12,
    fontWeight: "700",
  },
  requiredHint: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  loadingStepText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  cepRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  cepBtn: {
    minHeight: 48,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cepBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 13,
  },
  calendarButton: {
    minHeight: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  button: {
    minHeight: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    textAlign: "center",
  },
  successActions: {
    width: "100%",
    gap: 10,
    marginTop: 8,
  },
  successActionButton: {
    width: "100%",
  },
  secondaryActionButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
  },
  secondaryActionButtonText: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 15,
    textAlign: "center",
  },
  successCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 32,
    alignItems: "center",
    gap: 12,
    marginTop: 40,
    ...theme.shadow.card,
  },
  successIcon: {
    fontSize: 48,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.success,
  },
  successLabel: {
    color: theme.colors.mutedText,
    marginTop: 8,
  },
  successCode: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.primary,
    letterSpacing: 2,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  calendarCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 12,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendarTitle: {
    flex: 1,
    textAlign: "center",
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 16,
    textTransform: "capitalize",
  },
  calendarNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarNavButtonText: {
    color: theme.colors.primary,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 28,
  },
  weekRow: {
    flexDirection: "row",
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    color: theme.colors.mutedText,
    fontWeight: "800",
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayButton: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
  },
  dayButtonEmpty: {
    opacity: 0,
  },
  dayButtonSelected: {
    backgroundColor: theme.colors.primary,
  },
  dayButtonText: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  dayButtonTextSelected: {
    color: "#fff",
  },
  calendarCloseButton: {
    minHeight: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarCloseButtonText: {
    color: theme.colors.text,
    fontWeight: "800",
  },
});
