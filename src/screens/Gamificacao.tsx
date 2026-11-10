import React from 'react';
import { Text, View } from 'react-native';
import ModuloLayout, { moduloStyles as styles } from '../components/ModuloLayout';

export default function Gamificacao() {
  return (
    <ModuloLayout titulo="Conquistas" descricao="Metas, desafios e recordes para acompanhar sua evolução.">
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Desafio da semana</Text>
        <Text style={styles.texto}>Os desafios serão liberados quando os registros diários e o histórico estiverem conectados.</Text>
      </View>
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Medalhas</Text>
        <View style={styles.medalha}>
          <View style={styles.medalhaSelo}><Text style={styles.medalhaInicial}>1</Text></View>
          <View style={styles.medalhaDescricao}>
            <Text style={styles.valor}>Primeiro passo</Text>
            <Text style={styles.texto}>Registre seu primeiro hábito diário.</Text>
          </View>
          <Text style={styles.estado}>Em breve</Text>
        </View>
      </View>
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Recordes e ranking</Text>
        <Text style={styles.texto}>Sequências e ranking comunitário dependem de histórico salvo e sincronização entre usuários.</Text>
      </View>
    </ModuloLayout>
  );
}