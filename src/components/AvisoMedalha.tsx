import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Medalha } from '../models/types';
import { Cores } from '../theme/cores';
import { useEstilos } from '../theme/TemaContext';

interface Props {
  medalhas: Medalha[];
}

// Comemora medalhas recém-conquistadas na própria tela onde o registro foi feito.
export default function AvisoMedalha({ medalhas }: Props) {
  const styles = useEstilos(criarEstilos);
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

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    caixa: { backgroundColor: c.ouroSuave, borderWidth: 1, borderColor: c.ouro, borderRadius: 12, padding: 12, marginTop: 12 },
    titulo: { color: c.aviso, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    texto: { color: c.textoSecundario, fontSize: 13, lineHeight: 19 },
    nome: { color: c.texto, fontWeight: '700' },
    link: { color: c.texto, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline', marginTop: 8 },
  });
}
