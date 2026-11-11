import { Link } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { sombraCartao } from '../components/ModuloLayout';
import { Usuario } from '../models/types';
import { Cores } from '../theme/cores';
import { useEstilos } from '../theme/TemaContext';

interface Props {
  usuario: Usuario;
}

const MODULOS = [
  { href: '/hidratacao', titulo: 'Hidratação' },
  { href: '/sono', titulo: 'Sono' },
  { href: '/consumo', titulo: 'Consumo residencial' },
  { href: '/alertas', titulo: 'Alertas' },
  { href: '/relatorios', titulo: 'Relatórios' },
  { href: '/gamificacao', titulo: 'Conquistas' },
] as const;

export default function Menu({ usuario }: Props) {
  const styles = useEstilos(criarEstilos);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Olá, {usuario.nickname}</Text>
      <Text style={styles.subtitulo}>Seu espaço de saúde e sustentabilidade</Text>
      <View style={styles.lista}>
        {MODULOS.map((modulo) => (
          <Link key={modulo.href} href={modulo.href} style={styles.item}>
            <Text style={styles.itemTitulo}>{modulo.titulo}</Text>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: { flexGrow: 1, padding: 20, paddingTop: 32, backgroundColor: c.fundo },
    titulo: { fontSize: 28, fontWeight: '800', color: c.texto, letterSpacing: -0.3 },
    subtitulo: { fontSize: 15, color: c.textoSecundario, marginTop: 4, marginBottom: 24 },
    lista: { gap: 12 },
    item: {
      backgroundColor: c.superficie,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borda,
      borderRadius: 14,
      padding: 18,
      ...sombraCartao(c),
    },
    itemTitulo: { fontSize: 17, fontWeight: '700', color: c.texto },
  });
}
