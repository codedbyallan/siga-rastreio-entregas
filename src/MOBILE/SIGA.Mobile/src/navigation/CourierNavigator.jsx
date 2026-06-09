import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { theme } from "../config/theme";
import { ROUTES } from "../constants/routes";
import CourierDeliveriesScreen from "../screens/courier/CourierDeliveriesScreen";
import CourierDeliveryDetailsScreen from "../screens/courier/CourierDeliveryDetailsScreen";

const Stack = createNativeStackNavigator();

export default function CourierNavigator() {
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
        name={ROUTES.COURIER_DELIVERIES}
        component={CourierDeliveriesScreen}
        options={{ title: "Minhas Entregas" }}
      />

      <Stack.Screen
        name={ROUTES.COURIER_DELIVERY_DETAILS}
        component={CourierDeliveryDetailsScreen}
        options={{ title: "Detalhes da Entrega" }}
      />
    </Stack.Navigator>
  );
}