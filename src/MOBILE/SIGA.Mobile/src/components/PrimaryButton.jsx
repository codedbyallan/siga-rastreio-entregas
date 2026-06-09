import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { theme } from "../config/theme";

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  style,
  textStyle,
}) {
  const isDisabled = disabled || loading;

  const buttonVariantStyle =
    variant === "outline" ? styles.outlineButton : styles.primaryButton;

  const textVariantStyle =
    variant === "outline" ? styles.outlineText : styles.primaryText;

  return (
    <TouchableOpacity
      disabled={isDisabled}
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.button,
        buttonVariantStyle,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? theme.colors.primary : "#ffffff"}
          size="small"
        />
      ) : (
        <Text style={[styles.text, textVariantStyle, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  disabled: {
    opacity: 0.65,
  },
  text: {
    fontWeight: "800",
    fontSize: 15,
  },
  primaryText: {
    color: "#ffffff",
  },
  outlineText: {
    color: theme.colors.primary,
  },
});