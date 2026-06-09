import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { theme } from "../config/theme";
import { useAuth } from "../contexts/AuthContext";
import CourierNavigator from "./CourierNavigator";
import OperatorNavigator from "./OperatorNavigator";
import PublicNavigator from "./PublicNavigator";
import UnsupportedRoleNavigator from "./UnsupportedRoleNavigator";

export default function RootNavigator() {
  const {
    isAuthenticated,
    isInitializing,
    isCompanyOperator,
    isCourier,
  } = useAuth();

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  function renderNavigator() {
    if (!isAuthenticated) {
      return <PublicNavigator />;
    }

    if (isCompanyOperator) {
      return <OperatorNavigator />;
    }

    if (isCourier) {
      return <CourierNavigator />;
    }

    return <UnsupportedRoleNavigator />;
  }

  return <NavigationContainer>{renderNavigator()}</NavigationContainer>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
});