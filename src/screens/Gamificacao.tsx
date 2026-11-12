import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import CartaoDesafio from '../components/CartaoDesafio';
import ModuloLayout, { useModuloStyles } from '../components/ModuloLayout';
import SeloMedalha from '../components/SeloMedalha';
import { useAtualizarAoFocar } from '../hooks/useAtualizarAoFocar';
import {
  atualizarGamificacao,
  avaliarDesafioDaSemana,
  calcularRecordes,
  listarMedalhas,
  SituacaoMedalha,
} from '../data/repository';
import { Recorde, TipoRecorde, Usuario } from '../models/types';
import { formatarDiaMes } from '../utils/formatacao';
import { Cores, coresDoModulo, Modulo } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';

interface Props {
  usuario: Usuario;
}

type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];

const TEXTOS_RECORDE: Record<TipoRecorde, { titulo: string; icone: NomeIcone; modulo: Modulo; unidade: [string, string] }> = {
  SEQUENCIA_HIDRATACAO: { titulo: 'Hidratação', icone: 'water', modulo: 'agua', unidade: ['dia', 'dias'] },
  SEQUENCIA_SONO: { titulo: 'Sono', icone: 'moon', modulo: 'sono', unidade: ['noite', 'noites'] },
};

function plural(valor: number, [singular, pluralizado]: [string, string]) {
  return valor === 1 ? singular : pluralizado;
}

// Sequência atual em destaque e o recorde embaixo. A chama aparece quando a sequência atual é o recorde.
function BlocoRecorde({ recorde }: { recorde: Recorde }) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  const { cores } = useTema();
  const textos = TEXTOS_RECORDE[recorde.tipoRecorde];
  const cor = coresDoModulo(cores, textos.modulo);
  const noRecorde = recorde.sequenciaAtual > 0 && recorde.sequenciaAtual === recorde.maiorSequencia;
  const unidade = plural(recorde.sequenciaAtual, textos.unidade);

  return (
    <View
      style={[styles.secao, estilos.recorde]}
      accessible
      accessibilityLabel={
        recorde.metaDefinida
          ? `${textos.titulo}: ${recorde.sequenciaAtual} ${unidade} seguidos na meta. Recorde: ${recorde.maiorSequencia}.`
          : `${textos.titulo}: sem meta definida.`
      }
    >
      <View style={estilos.recordeCabecalho}>
        <View style={[estilos.recordeIcone, { backgroundColor: cor.suave }]}>
          <Ionicons name={textos.icone} size={14} color={cor.forte} />
        </View>
        <Text style={styles.rotulo}>{textos.titulo}</Text>
      </View>
      {recorde.metaDefinida ? (
        <>
          <Text style={estilos.recordeNumero}>
            {recorde.sequenciaAtual}
            <Text style={estilos.recordeUnidade}> {unidade}</Text>
          </Text>
          <Text style={styles.estado}>
            recorde {recorde.maiorSequencia}
            {noRecorde ? ' 🔥' : ''}
          </Text>
        </>
      ) : (
        <Text style={styles.estado}>Defina a meta em Ajustes</Text>
      )}
    </View>
  );
}

function textoProgresso(situacao: SituacaoMedalha): string {
  if (situacao.dataConquista) return `Conquistada em ${formatarDiaMes(situacao.dataConquista.slice(0, 10))}`;
  if (situacao.progresso) return `${situacao.progresso.atual} de ${situacao.progresso.alvo}`;
  return 'Bloqueada';
}

function ItemMedalha({ situacao, onPress }: { situacao: SituacaoMedalha; onPress: () => void }) {
  const estilos = useEstilos(criarEstilos);
  const { medalha, dataConquista, progresso } = situacao;
  const conquistada = dataConquista !== null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [estilos.medalha, pressed && estilos.pressionado]}
      accessibilityRole="button"
      accessibilityLabel={`${medalha.nome}. ${textoProgresso(situacao)}. Ver detalhes.`}
    >
      <SeloMedalha idMedalha={medalha.idMedalha} conquistada={conquistada} tamanho={52} />
      {!conquistada && progresso ? (
        <View style={estilos.progressoFundo}>
          <View style={[estilos.progresso, { width: `${Math.min(progresso.atual / progresso.alvo, 1) * 100}%` }]} />
        </View>
      ) : null}
      <Text style={[estilos.medalhaNome, !conquistada && estilos.medalhaBloqueada]} numberOfLines={2}>
        {medalha.nome}
      </Text>
    </Pressable>
  );
}

// Painel com os detalhes da medalha tocada: o que fazer para ganhar e o progresso.
function DetalheMedalha({ situacao, onFechar }: { situacao: SituacaoMedalha | null; onFechar: () => void }) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  return (
    <Modal visible={situacao !== null} transparent animationType="fade" onRequestClose={onFechar}>
      <Pressable style={estilos.fundoModal} onPress={onFechar} accessibilityLabel="Fechar detalhes">
        {situacao ? (
          <Pressable style={[styles.secao, estilos.painel]} onPress={() => {}}>
            <SeloMedalha
              idMedalha={situacao.medalha.idMedalha}
              conquistada={situacao.dataConquista !== null}
              tamanho={72}
            />
            <Text style={estilos.painelNome}>{situacao.medalha.nome}</Text>
            <Text style={[styles.texto, estilos.centro]}>{situacao.medalha.descricao}</Text>
            <Text style={[styles.estado, estilos.painelEstado]}>{textoProgresso(situacao)}</Text>
            <Pressable onPress={onFechar} style={[styles.botao, estilos.painelBotao]} accessibilityRole="button">
              <Text style={styles.botaoTexto}>Fechar</Text>
            </Pressable>
          </Pressable>
        ) : null}
      </Pressable>
    </Modal>
  );
}

export default function Gamificacao({ usuario }: Props) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  const [selecionada, setSelecionada] = useState<SituacaoMedalha | null>(null);
  // A cada foco da aba: fecha desafios e libera medalhas cujo critério já foi atingido, depois relê tudo.
  useAtualizarAoFocar(() => atualizarGamificacao(usuario.idUsuario));
  const recordes = calcularRecordes(usuario.idUsuario);
  const medalhas = listarMedalhas(usuario.idUsuario);
  const conquistadas = medalhas.filter((m) => m.dataConquista !== null).length;
  const desafio = avaliarDesafioDaSemana(usuario.idUsuario);

  return (
    <ModuloLayout titulo="Conquistas">
      <View style={styles.secao}>
        <CartaoDesafio avaliacao={desafio} />
      </View>

      <View style={estilos.recordes}>
        {recordes.map((recorde) => (
          <BlocoRecorde key={recorde.tipoRecorde} recorde={recorde} />
        ))}
      </View>

      <View style={styles.secao}>
        <View style={estilos.medalhasCabecalho}>
          <Text style={[styles.secaoTitulo, estilos.semMargem]}>Medalhas</Text>
          <Text style={styles.estado}>
            {conquistadas} de {medalhas.length}
          </Text>
        </View>
        <View style={estilos.grade}>
          {medalhas.map((situacao) => (
            <ItemMedalha key={situacao.medalha.idMedalha} situacao={situacao} onPress={() => setSelecionada(situacao)} />
          ))}
        </View>
      </View>

      <DetalheMedalha situacao={selecionada} onFechar={() => setSelecionada(null)} />
    </ModuloLayout>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    recordes: { flexDirection: 'row', gap: 12 },
    recorde: { flex: 1, padding: 14 },
    recordeCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    recordeIcone: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    recordeNumero: { color: c.texto, fontSize: 28, fontWeight: '800', marginTop: 4 },
    recordeUnidade: { color: c.textoSecundario, fontSize: 14, fontWeight: '600' },
    medalhasCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
    semMargem: { marginBottom: 0 },
    grade: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
    medalha: { width: '25%', alignItems: 'center', paddingHorizontal: 2 },
    pressionado: { opacity: 0.6 },
    progressoFundo: { width: 40, height: 4, backgroundColor: c.superficieSuave, borderRadius: 2, overflow: 'hidden', marginTop: 6 },
    progresso: { height: '100%', backgroundColor: c.primaria },
    medalhaNome: { color: c.texto, fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 6 },
    medalhaBloqueada: { color: c.textoSuave },
    // Véu escuro atrás do painel: a cor de sombra do tema com ~45% de opacidade.
    fundoModal: { flex: 1, backgroundColor: `${c.sombra}73`, justifyContent: 'center', padding: 32 },
    painel: { alignItems: 'center', paddingVertical: 24, marginBottom: 0 },
    painelNome: { color: c.texto, fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 6 },
    centro: { textAlign: 'center' },
    painelEstado: { marginTop: 10 },
    painelBotao: { alignSelf: 'stretch', marginTop: 18 },
  });
}
