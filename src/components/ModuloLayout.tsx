import { Link } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface Props {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}

export default function ModuloLayout({ titulo, descricao, children }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Link href="/menu" style={styles.voltar}>Voltar ao menu</Link>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.descricao}>{descricao}</Text>
      </View>
      {children}
    </ScrollView>
  );
}

export const moduloStyles = StyleSheet.create({
  secao: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce7e5', borderRadius: 8, padding: 16, marginBottom: 14 },
  secaoTitulo: { color: '#173f4f', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  texto: { color: '#4a6572', fontSize: 14, lineHeight: 20 },
  rotulo: { color: '#173f4f', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cfe3e8', borderRadius: 8, padding: 12, color: '#173f4f', marginBottom: 12 },
  botao: { backgroundColor: '#173f4f', borderRadius: 8, padding: 13, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontWeight: '700' },
  feedback: { color: '#28764b', fontSize: 13, marginTop: 10 },
  erro: { color: '#b33b32', fontSize: 13, marginBottom: 10 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  separador: { borderTopWidth: 1, borderTopColor: '#e5ecea', marginTop: 12, paddingTop: 12 },
  opcao: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#cfe3e8', borderRadius: 8, padding: 11, marginBottom: 14 },
  opcaoAtiva: { backgroundColor: '#173f4f', borderColor: '#173f4f' },
  opcaoTexto: { color: '#173f4f', fontWeight: '600' },
  opcaoTextoAtiva: { color: '#fff' },
  valor: { color: '#173f4f', fontSize: 15, fontWeight: '700' },
  numero: { color: '#173f4f', fontSize: 28, fontWeight: '700', marginBottom: 4 },
  barraFundo: { height: 12, backgroundColor: '#e0eef2', borderRadius: 6, overflow: 'hidden', marginTop: 12 },
  barra: { height: '100%', backgroundColor: '#2e8bc0' },
  alertaTexto: { flex: 1 },
  medalha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medalhaSelo: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4d06f' },
  medalhaInicial: { color: '#765b13', fontSize: 17, fontWeight: '700' },
  medalhaDescricao: { flex: 1 },
  estado: { color: '#7b8f99', fontSize: 12, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 48, paddingBottom: 36, backgroundColor: '#f4faff' },
  voltar: { color: '#28764b', fontSize: 14, fontWeight: '700', marginBottom: 24 },
  cabecalho: { marginBottom: 24 },
  titulo: { color: '#173f4f', fontSize: 26, fontWeight: '700' },
  descricao: { color: '#4a6572', fontSize: 14, lineHeight: 20, marginTop: 6 },
});