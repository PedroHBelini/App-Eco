import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ModuloLayout, { moduloStyles } from '../components/ModuloLayout';
import {
  buscarMetaHidratacaoAtiva,
  calcularProgresso,
  calcularTotalIngeridoHoje,
  listarIngestoesDoDia,
  registrarIngestao,
  validarQuantidadeIngestao,
} from '../data/mockRepository';
import { Usuario } from '../models/types';

interface Props {
  usuario: Usuario;
}

const ATALHOS_ML = [200, 300, 500];

export default function Hidratacao({ usuario }: Props) {
  const [quantidade, setQuantidade] = useState('');
  const [erro, setErro] = useState('');
  const [, forcarAtualizacao] = useState(0);

  const meta = buscarMetaHidratacaoAtiva(usuario.idUsuario);
  const totalHoje = calcularTotalIngeridoHoje(usuario.idUsuario);
  const progresso = calcularProgresso(usuario.idUsuario);
  const registros = listarIngestoesDoDia(usuario.idUsuario).slice().reverse();

  function adicionar(quantidadeMl: number) {
    if (!validarQuantidadeIngestao(quantidadeMl)) {
      setErro('Informe uma quantidade válida maior que zero.');
      return;
    }

    registrarIngestao(usuario.idUsuario, quantidadeMl);
    setQuantidade('');
    setErro('');
    forcarAtualizacao((n) => n + 1);
  }

  function registrarQuantidadeDigitada() {
    const entrada = quantidade.trim();
    if (!/^\d+(?:[.,]\d+)?$/.test(entrada)) {
      setErro('Informe uma quantidade válida maior que zero.');
      return;
    }

    adicionar(Number(entrada.replace(',', '.')));
  }

  return (
    <ModuloLayout
      titulo={`Olá, ${usuario.nickname}`}
      descricao={`Meta diária: ${meta ? `${meta.valorMeta} ml` : 'não definida'}`}
      scrollable={false}
    >
      <View style={moduloStyles.secao}>
        <View style={styles.barraFundo}>
          <View style={[styles.barraProgresso, { width: `${Math.round(progresso * 100)}%` }]} />
        </View>
        <Text style={styles.progressoTexto}>
          {totalHoje} ml de {meta?.valorMeta ?? 0} ml ({Math.round(progresso * 100)}%)
        </Text>

        <View style={styles.atalhos}>
          {ATALHOS_ML.map((ml) => (
            <TouchableOpacity key={ml} style={styles.atalhoBotao} onPress={() => adicionar(ml)}>
              <Text style={styles.atalhoTexto}>+{ml} ml</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.linhaInput}>
          <TextInput
            style={styles.input}
            placeholder="Outra quantidade (ml)"
            value={quantidade}
            onChangeText={(valor) => {
              setQuantidade(valor);
              if (erro) setErro('');
            }}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.botao} onPress={registrarQuantidadeDigitada}>
            <Text style={styles.botaoTexto}>Registrar</Text>
          </TouchableOpacity>
        </View>

        {erro ? <Text style={styles.erro} accessibilityRole="alert">{erro}</Text> : null}
        <Text style={styles.historicoTitulo}>Registros de hoje</Text>
      </View>
      <FlatList
        style={styles.lista}
        data={registros}
        keyExtractor={(item) => item.idIngestao}
        renderItem={({ item }) => (
          <View style={styles.itemHistorico}>
            <Text>{item.quantidadeMl} ml</Text>
            <Text style={styles.horario}>
              {new Date(item.dataHora).toLocaleTimeString().slice(0, 5)}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.vazio}>Nenhum registro ainda hoje.</Text>}
      />
    </ModuloLayout>
  );
}

const styles = StyleSheet.create({
  secao: { paddingBottom: 12 },
  barraFundo: { height: 16, backgroundColor: '#e0eef2', borderRadius: 8, overflow: 'hidden' },
  barraProgresso: { height: '100%', backgroundColor: '#2e8bc0' },
  progressoTexto: { marginTop: 6, marginBottom: 20, color: '#173f4f' },
  atalhos: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  atalhoBotao: { backgroundColor: '#dff3fb', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  atalhoTexto: { color: '#173f4f', fontWeight: '600' },
  linhaInput: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cfe3e8', borderRadius: 8, padding: 12 },
  botao: { backgroundColor: '#173f4f', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  botaoTexto: { color: '#fff', fontWeight: '600' },
  erro: { color: '#b33b32', fontSize: 13, marginBottom: 10 },
  historicoTitulo: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#173f4f' },
  lista: { flex: 1 },
  itemHistorico: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e0eef2' },
  horario: { color: '#7b8f99' },
  vazio: { color: '#7b8f99' },
});
