import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { theme } from "../config/theme";
import { ROUTES } from "../constants/routes";
import UnsupportedRoleScreen from "../screens/shared/UnsupportedRoleScreen";

const Stack = createNativeStackNavigator();

export default function UnsupportedRoleNavigator() {
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
        name={ROUTES.UNSUPPORTED_ROLE}
        component={UnsupportedRoleScreen}
        options={{ title: "Perfil não disponível" }}
      />
    </Stack.Navigator>
  );
}