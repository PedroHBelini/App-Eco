import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Tabs } from 'expo-router';
import React from 'react';
import { ColorValue } from 'react-native';
import { useTema } from '../../theme/TemaContext';

type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];

// Ícone preenchido na aba ativa e contornado nas demais.
function icone(ativo: NomeIcone, inativo: NomeIcone) {
  function IconeDaAba({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) {
    return <Ionicons name={focused ? ativo : inativo} size={size} color={color} />;
  }
  return IconeDaAba;
}

export default function TabsLayout() {
  const { cores } = useTema();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSuave,
        tabBarStyle: { backgroundColor: cores.superficie, borderTopColor: cores.borda },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Tabs.Screen name="inicio" options={{ title: 'Início', tabBarIcon: icone('home', 'home-outline') }} />
      <Tabs.Screen
        name="relatorios"
        options={{ title: 'Relatórios', tabBarIcon: icone('stats-chart', 'stats-chart-outline') }}
      />
      <Tabs.Screen
        name="gamificacao"
        options={{ title: 'Conquistas', tabBarIcon: icone('trophy', 'trophy-outline') }}
      />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes', tabBarIcon: icone('settings', 'settings-outline') }} />
    </Tabs>
  );
}
