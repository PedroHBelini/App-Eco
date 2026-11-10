import { Link } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Usuario } from '../models/types';

interface Props {
  usuario: Usuario;
}

export default function Menu({ usuario }: Props) {
  const modulos = [
    { href: '/hidratacao', titulo: 'Hidratação', cor: '#dff3fb' },
    { href: '/sono', titulo: 'Sono', cor: '#e8e9f8' },
    { href: '/consumo', titulo: 'Consumo residencial', cor: '#e4f2e7' },
    { href: '/alertas', titulo: 'Alertas', cor: '#fff0d9' },
    { href: '/relatorios', titulo: 'Relatórios', cor: '#fbe6e1' },
    { href: '/gamificacao', titulo: 'Conquistas', cor: '#f2e8d8' },
  ] as const;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Olá, {usuario.nickname}</Text>
      <Text style={styles.subtitulo}>Seu espaço de saúde e sustentabilidade</Text>
      <View style={styles.lista}>
        {modulos.map((modulo) => (
          <Link key={modulo.href} href={modulo.href} style={[styles.item, { backgroundColor: modulo.cor }]}>
            <Text style={styles.itemTitulo}>{modulo.titulo}</Text>
            <Text style={styles.itemDetalhe}>{modulo.detalhe}</Text>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 56, backgroundColor: '#f4faff' },
  titulo: { fontSize: 22, fontWeight: '700', color: '#173f4f' },
  subtitulo: { fontSize: 14, color: '#4a6572', marginTop: 4, marginBottom: 24 },
  lista: { gap: 12 },
  item: {
    borderWidth: 1,
    borderColor: '#d3e2e2',
    borderRadius: 8,
    padding: 18,
  },
  itemTitulo: { fontSize: 17, fontWeight: '700', color: '#173f4f' },
  itemDetalhe: { fontSize: 13, color: '#4a6572', marginTop: 4 },
});
