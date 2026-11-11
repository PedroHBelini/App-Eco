import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AvisoMedalha from '../components/AvisoMedalha';
import CampoTexto from '../components/CampoTexto';
import ModuloLayout, { useModuloStyles } from '../components/ModuloLayout';
import {
  atualizarGamificacao,
  buscarMetaHidratacaoAtiva,
  calcularProgresso,
  calcularTotalIngeridoHoje,
  listarIngestoesDoDia,
  registrarIngestao,
  validarQuantidadeIngestao,
} from '../data/repository';
import { Medalha, Usuario } from '../models/types';
import { Cores } from '../theme/cores';
import { useEstilos } from '../theme/TemaContext';

interface Props {
  usuario: Usuario;
}

const ATALHOS_ML = [200, 300, 500];

export default function Hidratacao({ usuario }: Props) {
  const styles = useEstilos(criarEstilos);
  const modulo = useModuloStyles();
  const [quantidade, setQuantidade] = useState('');
  const [erro, setErro] = useState('');
  const [novasMedalhas, setNovasMedalhas] = useState<Medalha[]>([]);
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
    setNovasMedalhas(atualizarGamificacao(usuario.idUsuario));
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
      titulo="Hidratação"
      descricao={`Meta diária: ${meta ? `${meta.valorMeta} ml` : 'não definida'}`}
      scrollable={false}
    >
      <View style={modulo.secao}>
        <View style={styles.barraFundo}>
          <View style={[styles.barraProgresso, { width: `${Math.round(progresso * 100)}%` }]} />
        </View>
        <Text style={styles.progressoTexto}>
          {totalHoje} ml de {meta?.valorMeta ?? 0} ml ({Math.round(progresso * 100)}%)
        </Text>

        <View style={styles.atalhos}>
          {ATALHOS_ML.map((ml) => (
            <TouchableOpacity
              key={ml}
              style={styles.atalhoBotao}
              onPress={() => adicionar(ml)}
              accessibilityRole="button"
            >
              <Text style={styles.atalhoTexto}>+{ml} ml</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.linhaInput}>
          <CampoTexto
            style={styles.input}
            placeholder="Outra quantidade (ml)"
            value={quantidade}
            onChangeText={(valor) => {
              setQuantidade(valor);
              if (erro) setErro('');
            }}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.botao} onPress={registrarQuantidadeDigitada} accessibilityRole="button">
            <Text style={modulo.botaoTexto}>Registrar</Text>
          </TouchableOpacity>
        </View>

        {erro ? <Text style={modulo.erro} accessibilityRole="alert">{erro}</Text> : null}
        <AvisoMedalha medalhas={novasMedalhas} />
      </View>
      <Text style={styles.historicoTitulo}>Registros de hoje</Text>
      <FlatList
        style={styles.lista}
        data={registros}
        keyExtractor={(item) => item.idIngestao}
        renderItem={({ item }) => (
          <View style={styles.itemHistorico}>
            <Text style={modulo.valor}>{item.quantidadeMl} ml</Text>
            <Text style={styles.horario}>{new Date(item.dataHora).toLocaleTimeString().slice(0, 5)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.horario}>Nenhum registro ainda hoje.</Text>}
      />
    </ModuloLayout>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    barraFundo: { height: 14, backgroundColor: c.superficieSuave, borderRadius: 7, overflow: 'hidden' },
    barraProgresso: { height: '100%', backgroundColor: c.primaria, borderRadius: 7 },
    progressoTexto: { marginTop: 8, marginBottom: 18, color: c.texto, fontWeight: '600' },
    atalhos: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    atalhoBotao: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: c.primariaSuave,
      paddingVertical: 11,
      borderRadius: 10,
    },
    atalhoTexto: { color: c.primaria, fontWeight: '700' },
    linhaInput: { flexDirection: 'row', gap: 8 },
    input: { flex: 1, marginBottom: 0 },
    botao: { backgroundColor: c.primaria, borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center' },
    historicoTitulo: { fontSize: 17, fontWeight: '700', marginTop: 4, marginBottom: 8, color: c.texto },
    lista: { flex: 1 },
    itemHistorico: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borda,
    },
    horario: { color: c.textoSuave },
  });
}
