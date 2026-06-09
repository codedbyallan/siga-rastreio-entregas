import { ScrollView, StyleSheet, View } from "react-native";
import { theme } from "../config/theme";

export default function ScreenContainer({
  children,
  scroll = true,
  contentStyle,
  style,
}) {
  if (!scroll) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={[styles.content, styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
});