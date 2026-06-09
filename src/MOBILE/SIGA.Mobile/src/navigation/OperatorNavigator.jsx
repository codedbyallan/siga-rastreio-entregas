import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { theme } from "../config/theme";
import { ROUTES } from "../constants/routes";
import CompanyProfileScreen from "../screens/operator/CompanyProfileScreen";
import NewShipmentScreen from "../screens/operator/NewShipmentScreen";
import OperatorCouriersScreen from "../screens/operator/OperatorCouriersScreen";
import OperatorDashboardScreen from "../screens/operator/OperatorDashboardScreen";
import OperatorReportsScreen from "../screens/operator/OperatorReportsScreen";
import OperatorShipmentsScreen from "../screens/operator/OperatorShipmentsScreen";
import OperatorTrackingScreen from "../screens/operator/OperatorTrackingScreen";
import UserProfileEditScreen from "../screens/operator/UserProfileEditScreen";
import ShipmentDetailsScreen from "../screens/shared/ShipmentDetailsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function getTabIcon(routeName, focused) {
  const icons = {
    [ROUTES.OPERATOR_DASHBOARD]: focused ? "home" : "home-outline",
    [ROUTES.OPERATOR_SHIPMENTS]: focused ? "cube" : "cube-outline",
    [ROUTES.NEW_SHIPMENT]: focused ? "add-circle" : "add-circle-outline",
    [ROUTES.OPERATOR_COURIERS]: focused ? "people" : "people-outline",
    [ROUTES.OPERATOR_TRACKING]: focused ? "search" : "search-outline",
  };

  return icons[routeName] || "ellipse-outline";
}

function OperatorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedText,
        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={getTabIcon(route.name, focused)}
            size={22}
            color={color}
          />
        ),
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          minHeight: 68,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      })}
    >
      <Tab.Screen
        name={ROUTES.OPERATOR_DASHBOARD}
        component={OperatorDashboardScreen}
        options={{
          title: "Dashboard",
          tabBarLabel: "Início",
        }}
      />

      <Tab.Screen
        name={ROUTES.OPERATOR_SHIPMENTS}
        component={OperatorShipmentsScreen}
        options={{
          title: "Encomendas",
          tabBarLabel: "Encomendas",
        }}
      />

      <Tab.Screen
        name={ROUTES.NEW_SHIPMENT}
        component={NewShipmentScreen}
        options={{
          title: "Nova Encomenda",
          tabBarLabel: "Nova",
        }}
      />

      <Tab.Screen
        name={ROUTES.OPERATOR_COURIERS}
        component={OperatorCouriersScreen}
        options={{
          title: "Entregadores",
          tabBarLabel: "Entregadores",
        }}
      />

      <Tab.Screen
        name={ROUTES.OPERATOR_TRACKING}
        component={OperatorTrackingScreen}
        options={{
          title: "Rastrear",
          tabBarLabel: "Rastrear",
        }}
      />
    </Tab.Navigator>
  );
}

export default function OperatorNavigator() {
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
        name={ROUTES.OPERATOR_TABS}
        component={OperatorTabs}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name={ROUTES.SHIPMENT_DETAILS}
        component={ShipmentDetailsScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name={ROUTES.OPERATOR_REPORTS}
        component={OperatorReportsScreen}
        options={{ title: "Relatórios" }}
      />

      <Stack.Screen
        name={ROUTES.COMPANY_PROFILE}
        component={CompanyProfileScreen}
        options={{ title: "Perfil da Empresa" }}
      />

      <Stack.Screen
        name={ROUTES.USER_PROFILE_EDIT}
        component={UserProfileEditScreen}
        options={{ title: "Editar Perfil" }}
      />
    </Stack.Navigator>
  );
}
