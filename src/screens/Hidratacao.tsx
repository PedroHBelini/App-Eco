import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AvisoMedalha from '../components/AvisoMedalha';
import CampoTexto from '../components/CampoTexto';
import ModuloLayout, { useModuloStyles } from '../components/ModuloLayout';
import {
  atualizarGamificacao,
  buscarAtalhoHidratacao,
  buscarMetaHidratacaoAtiva,
  calcularProgresso,
  calcularTotalIngeridoHoje,
  definirAtalhoHidratacao,
  listarIngestoesDoDia,
  registrarIngestao,
  validarAtalhoHidratacao,
  validarQuantidadeIngestao,
} from '../data/repository';
import { Medalha, Usuario } from '../models/types';
import { Cores } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';

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
  const { cores } = useTema();

  // "Meu copo": valor personalizado do perfil, também usado no botão rápido do Início.
  const [atalho, setAtalho] = useState(() => buscarAtalhoHidratacao(usuario.idUsuario));
  const [editandoAtalho, setEditandoAtalho] = useState(false);
  const [valorAtalho, setValorAtalho] = useState('');
  const [erroAtalho, setErroAtalho] = useState('');

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

  function alternarEdicaoAtalho() {
    setValorAtalho(String(atalho));
    setErroAtalho('');
    setEditandoAtalho((editando) => !editando);
  }

  function salvarAtalho() {
    const entrada = valorAtalho.trim();
    const ml = Number(entrada);
    if (!/^\d+$/.test(entrada) || !validarAtalhoHidratacao(ml)) {
      setErroAtalho('Informe um valor inteiro entre 50 e 2000 ml.');
      return;
    }
    definirAtalhoHidratacao(usuario.idUsuario, ml);
    setAtalho(ml);
    setEditandoAtalho(false);
  }

  return (
    <ModuloLayout
      voltar
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

        <View style={styles.meuCopo}>
          <TouchableOpacity
            style={styles.meuCopoBotao}
            onPress={() => adicionar(atalho)}
            accessibilityRole="button"
            accessibilityLabel={`Adicionar meu copo, ${atalho} ml`}
          >
            <Ionicons name="water" size={20} color={cores.textoSobrePrimaria} />
            <Text style={modulo.botaoTexto}>+{atalho} ml · Meu copo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editarBotao, editandoAtalho && styles.editarBotaoAtivo]}
            onPress={alternarEdicaoAtalho}
            accessibilityRole="button"
            accessibilityLabel="Alterar o valor do meu copo"
          >
            <Ionicons name={editandoAtalho ? 'close' : 'create-outline'} size={20} color={cores.primaria} />
          </TouchableOpacity>
        </View>

        {editandoAtalho ? (
          <View style={styles.editarAtalho}>
            <Text style={modulo.rotulo}>Quantos ml tem o seu copo?</Text>
            <View style={styles.linhaInput}>
              <CampoTexto
                style={styles.input}
                placeholder="Ex.: 350"
                value={valorAtalho}
                onChangeText={(valor) => {
                  setValorAtalho(valor);
                  if (erroAtalho) setErroAtalho('');
                }}
                keyboardType="number-pad"
                autoFocus
              />
              <TouchableOpacity style={styles.botao} onPress={salvarAtalho} accessibilityRole="button">
                <Text style={modulo.botaoTexto}>Salvar</Text>
              </TouchableOpacity>
            </View>
            {erroAtalho ? <Text style={[modulo.erro, styles.erroAtalho]} accessibilityRole="alert">{erroAtalho}</Text> : null}
            <Text style={modulo.estado}>Este botão também aparece no Início para registrar com um toque.</Text>
          </View>
        ) : null}

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
    meuCopo: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    meuCopoBotao: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.primaria,
      borderRadius: 10,
      paddingVertical: 14,
    },
    editarBotao: {
      width: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.bordaForte,
    },
    editarBotaoAtivo: { backgroundColor: c.primariaSuave, borderColor: c.primariaSuave },
    editarAtalho: { backgroundColor: c.superficieSuave, borderRadius: 10, padding: 12, marginBottom: 12 },
    erroAtalho: { marginTop: 8, marginBottom: 0 },
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
