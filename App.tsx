import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import Cadastro from './src/screens/Cadastro';
import Hidratacao from './src/screens/Hidratacao';
import { Usuario } from './src/models/types';

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {usuario ? (
        <Hidratacao usuario={usuario} />
      ) : (
        <Cadastro onCadastroConcluido={setUsuario} />
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
