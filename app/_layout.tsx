import { Stack } from "expo-router";
import { StatusBar } from "react-native";

export default function RootLayout() {
  return (
    <>
      <StatusBar hidden />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0d1117" },
        }}
      />
    </>
  );
}
