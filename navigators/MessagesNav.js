import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Room from "../screens/Room";
import Rooms from "../screens/Rooms";
import { Ionicons } from "@expo/vector-icons";

const Stack = createStackNavigator();

export default function MessagesNav() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: "white",
        headerBackTitleVisible: false,
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: "black",
          borderBottomColor: "rgba(255, 255, 255, 0.3)",
          shadowColor: "rgba(255, 255, 255, 0.3)",
        },
        headerBackImage: ({ tintColor }) => (
          <Ionicons color={tintColor} name="close" size={28} />
        ),
      }}
    >
      <Stack.Screen name="Rooms" component={Rooms} />
      <Stack.Screen name="Room" component={Room} />
    </Stack.Navigator>
  );
}
