import { Ionicons } from '@react-native-vector-icons/ionicons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Cores } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';

type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];

// Lista ou seção sem dados: ícone esmaecido e uma frase curta, centralizados.
export default function EstadoVazio({ icone, texto }: { icone: NomeIcone; texto: string }) {
  const estilos = useEstilos(criarEstilos);
  const { cores } = useTema();
  return (
    <View style={estilos.container}>
      <Ionicons name={icone} size={32} color={cores.bordaForte} />
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 12, gap: 8 },
    texto: { color: c.textoSuave, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  });
}
