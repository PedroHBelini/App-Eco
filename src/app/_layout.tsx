import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { UsuarioProvider } from '../context/UsuarioContext';
import { TemaProvider, useTema } from '../theme/TemaContext';

function RaizComTema() {
  const { cores, modo } = useTema();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />
      <StatusBar style={modo === 'escuro' ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <UsuarioProvider>
        <TemaProvider>
          <RaizComTema />
        </TemaProvider>
      </UsuarioProvider>
    </SafeAreaProvider>
  );
}
