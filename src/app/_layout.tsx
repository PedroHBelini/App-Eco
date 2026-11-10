import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { UsuarioProvider } from '../context/UsuarioContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <UsuarioProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
        </UsuarioProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
