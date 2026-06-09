import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { theme } from "../config/theme";
import { ROUTES } from "../constants/routes";
import HomeTrackingScreen from "../screens/public/HomeTrackingScreen";
import LoginScreen from "../screens/public/LoginScreen";
import RegisterCompanyScreen from "../screens/public/RegisterCompanyScreen";

const Stack = createNativeStackNavigator();

export default function PublicNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontWeight: "800",
        },
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name={ROUTES.PUBLIC_HOME}
        component={HomeTrackingScreen}
        options={{ title: "SIGA" }}
      />

      <Stack.Screen
        name={ROUTES.LOGIN}
        component={LoginScreen}
        options={{ title: "Entrar" }}
      />

      <Stack.Screen
        name={ROUTES.REGISTER_COMPANY}
        component={RegisterCompanyScreen}
        options={{ title: "Cadastro de Empresa" }}
      />
    </Stack.Navigator>
  );
}