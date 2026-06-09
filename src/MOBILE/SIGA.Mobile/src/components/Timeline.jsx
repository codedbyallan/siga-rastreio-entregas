import { StyleSheet, Text, View } from "react-native";
import { theme } from "../config/theme";
import { formatDate, formatStatus } from "../utils/formatters";

function getEventDate(event) {
  return event?.createdAt || event?.timestamp || event?.date;
}

function getEventKey(event, index) {
  return event?.id || event?._id || `${event?.status || "event"}-${index}`;
}

function sortEvents(events) {
  return [...events].sort((a, b) => {
    const dateA = new Date(getEventDate(a) || 0);
    const dateB = new Date(getEventDate(b) || 0);

    return dateB - dateA;
  });
}

export default function Timeline({ events = [] }) {
  if (!Array.isArray(events) || events.length === 0) {
    return <Text style={styles.empty}>Nenhum evento registrado.</Text>;
  }

  const sortedEvents = sortEvents(events);

  return (
    <View style={styles.wrapper}>
      {sortedEvents.map((event, index) => (
        <View key={getEventKey(event, index)} style={styles.item}>
          <View style={styles.dot} />

          <View style={styles.content}>
            <Text style={styles.status}>{formatStatus(event.status)}</Text>

            <Text style={styles.description}>
              {event.description || "Sem descrição"}
            </Text>

            {event.eventType && (
              <Text style={styles.eventType}>Tipo: {event.eventType}</Text>
            )}

            <Text style={styles.date}>{formatDate(getEventDate(event))}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  item: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    marginTop: 5,
  },
  content: {
    flex: 1,
  },
  status: {
    fontWeight: "800",
    color: theme.colors.primary,
  },
  description: {
    color: theme.colors.text,
    marginTop: 4,
    lineHeight: 20,
  },
  eventType: {
    color: theme.colors.mutedText,
    marginTop: 4,
    fontSize: 12,
  },
  date: {
    color: theme.colors.mutedText,
    marginTop: 6,
    fontSize: 12,
  },
  empty: {
    color: theme.colors.mutedText,
  },
});