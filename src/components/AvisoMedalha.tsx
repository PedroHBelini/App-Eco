import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Medalha } from '../models/types';

interface Props {
  medalhas: Medalha[];
}

// Comemora medalhas recém-conquistadas na própria tela onde o registro foi feito.
export default function AvisoMedalha({ medalhas }: Props) {
  if (medalhas.length === 0) return null;

  return (
    <View style={styles.caixa} accessibilityLiveRegion="polite">
      <Text style={styles.titulo}>{medalhas.length === 1 ? 'Nova medalha!' : `${medalhas.length} novas medalhas!`}</Text>
      {medalhas.map((m) => (
        <Text key={m.idMedalha} style={styles.texto}>
          <Text style={styles.nome}>{m.nome}</Text> · {m.descricao}
        </Text>
      ))}
      <Link href="/gamificacao" style={styles.link}>
        Ver conquistas
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { backgroundColor: '#fdf4d8', borderWidth: 1, borderColor: '#f4d06f', borderRadius: 8, padding: 12, marginTop: 12 },
  titulo: { color: '#765b13', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  texto: { color: '#4a6572', fontSize: 13, lineHeight: 19 },
  nome: { color: '#173f4f', fontWeight: '700' },
  link: { color: '#173f4f', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline', marginTop: 8 },
});
