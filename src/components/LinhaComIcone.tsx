import { Ionicons } from '@react-native-vector-icons/ionicons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { coresDoModulo, Modulo } from '../theme/cores';
import { useTema } from '../theme/TemaContext';
import { useModuloStyles } from './ModuloLayout';

export type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];

// Linha de lista: ícone colorido, título, descrição e, à direita, um controle (Switch, seta...).
export default function LinhaComIcone({ icone, titulo, descricao, modulo, children }: {
  icone: NomeIcone;
  titulo: string;
  descricao?: string;
  modulo?: Modulo; // sem módulo, usa a cor primária
  children?: React.ReactNode;
}) {
  const styles = useModuloStyles();
  const { cores } = useTema();
  const cor = modulo ? coresDoModulo(cores, modulo) : { forte: cores.primaria, suave: cores.primariaSuave };
  return (
    <View style={styles.linha}>
      <View style={[estilos.icone, { backgroundColor: cor.suave }]}>
        <Ionicons name={icone} size={20} color={cor.forte} />
      </View>
      <View style={styles.alertaTexto}>
        <Text style={styles.valor}>{titulo}</Text>
        {descricao ? <Text style={styles.texto}>{descricao}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  icone: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
