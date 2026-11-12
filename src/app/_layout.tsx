import { Comfortaa_700Bold, useFonts } from '@expo-google-fonts/comfortaa';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
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
  // A chave do objeto é o nome usado em fontFamily (FONTE_MARCA).
  const [fontesCarregadas, erroFontes] = useFonts({ Comfortaa_700Bold });
  // Espera a fonte (é rápido, vem do próprio app). Se falhar, segue com a fonte do sistema.
  if (!fontesCarregadas && !erroFontes) return null;

  return (
    <SafeAreaProvider>
      {/* Necessário para os KeyboardAwareScrollView rolarem até o campo focado quando o teclado abre. */}
      <KeyboardProvider>
        <UsuarioProvider>
          <TemaProvider>
            <RaizComTema />
          </TemaProvider>
        </UsuarioProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
