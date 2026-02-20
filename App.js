import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TouchableOpacity, Text } from "react-native";

import HomeScreen from "./src/screens/HomeScreen";
import AddCardScreen from "./src/screens/AddCardScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Vault"
            component={HomeScreen}
            options={({ navigation }) => ({
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate("Add Card")}
                  style={{ marginRight: 15 }}
                >
                  <Text style={{ fontSize: 28, color: "#2ecc71" }}>
                    +
                  </Text>
                </TouchableOpacity>
              ),
            })}
          />

          <Stack.Screen name="Add Card" component={AddCardScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
