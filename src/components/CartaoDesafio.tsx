import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BONUS_CONCLUSAO } from '../data/catalogoDesafios';
import { AvaliacaoDesafio, ResultadoDesafio } from '../data/repository';
import { Desafio, TipoMeta } from '../models/types';
import { diaDaSemana, formatarDiaMes } from '../utils/formatacao';
import { Cores } from '../theme/cores';
import { useEstilos } from '../theme/TemaContext';
import { useModuloStyles } from './ModuloLayout';

const NOME_META: Record<TipoMeta, string> = { HIDRATACAO: 'hidratação', SONO: 'sono' };

function situacao(avaliacao: AvaliacaoDesafio): string {
  if (avaliacao.concluido) return `Desafio concluído! +${BONUS_CONCLUSAO} pontos de bônus.`;
  const faltam = avaliacao.desafio.alvo - avaliacao.atual;
  if (avaliacao.aindaPossivel) return `Faltam ${faltam} ${faltam === 1 ? 'dia' : 'dias'} para concluir. Ainda dá tempo!`;
  return 'Não dá mais para concluir esta semana. Os pontos dos dias cumpridos continuam valendo.';
}

interface Props {
  avaliacao: AvaliacaoDesafio;
  proximo: Desafio;
  anteriores: ResultadoDesafio[];
}

export default function CartaoDesafio({ avaliacao, proximo, anteriores }: Props) {
  const moduloStyles = useModuloStyles();
  const styles = useEstilos(criarEstilos);
  const { desafio, dias, atual, pontuacao, concluido, metasFaltando } = avaliacao;

  return (
    <View>
      <View style={styles.cabecalho}>
        <Text style={styles.nome}>{desafio.nome}</Text>
        <Text style={moduloStyles.estado}>
          {formatarDiaMes(desafio.dataInicio)} a {formatarDiaMes(desafio.dataFim)}
        </Text>
      </View>
      <Text style={moduloStyles.texto}>{desafio.descricao}</Text>

      {metasFaltando.length > 0 ? (
        <Text style={[moduloStyles.texto, styles.aviso]}>
          Defina sua meta de {metasFaltando.map((t) => NOME_META[t]).join(' e de ')} em Ajustes para os dias começarem a contar.
        </Text>
      ) : null}

      <View
        style={styles.semana}
        accessible
        accessibilityLabel={`${atual} de ${desafio.alvo} dias cumpridos nesta semana.`}
      >
        {dias.map((dia) => (
          <View key={dia.data} style={styles.dia}>
            <View
              style={[
                styles.bolinha,
                dia.contou && styles.bolinhaCumprida,
                dia.futuro && styles.bolinhaFutura,
                dia.hoje && styles.bolinhaHoje,
              ]}
            >
              {dia.contou ? <Text style={styles.check}>✓</Text> : null}
            </View>
            <Text style={[styles.rotuloDia, dia.hoje && styles.rotuloHoje]}>
              {dia.hoje ? 'hoje' : diaDaSemana(dia.data)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.placar}>
        <Text style={moduloStyles.valor}>
          {atual} de {desafio.alvo} dias
        </Text>
        <Text style={moduloStyles.valor}>{pontuacao} pontos</Text>
      </View>
      <Text style={[moduloStyles.texto, concluido && styles.concluido]}>{situacao(avaliacao)}</Text>

      <Text style={[moduloStyles.estado, styles.proximo]}>Próxima semana: {proximo.nome}</Text>

      {anteriores.length > 0 ? (
        <View style={moduloStyles.separador}>
          <Text style={moduloStyles.rotulo}>Semanas anteriores</Text>
          {anteriores.map(({ desafio: d, participacao: p }) => (
            <View key={d.idDesafio} style={[moduloStyles.linha, styles.anterior]}>
              <Text style={[moduloStyles.texto, styles.anteriorNome]}>
                {formatarDiaMes(d.dataInicio)} · {d.nome}
              </Text>
              <Text style={moduloStyles.estado}>
                {p.concluido ? 'Concluído' : 'Não concluído'} · {p.pontuacao} pts
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
    nome: { color: c.texto, fontSize: 18, fontWeight: '700' },
    aviso: { color: c.aviso, marginTop: 8 },
    semana: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 14 },
    dia: { alignItems: 'center', gap: 4 },
    bolinha: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: c.superficieSuave,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bolinhaCumprida: { backgroundColor: c.primaria },
    bolinhaFutura: { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.bordaForte, borderStyle: 'dashed' },
    bolinhaHoje: { borderWidth: 2, borderColor: c.primaria },
    check: { color: c.textoSobrePrimaria, fontSize: 14, fontWeight: '700' },
    rotuloDia: { color: c.textoSuave, fontSize: 11 },
    rotuloHoje: { color: c.texto, fontWeight: '700' },
    placar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    concluido: { color: c.sucesso, fontWeight: '600' },
    proximo: { marginTop: 10 },
    anterior: { marginTop: 6 },
    anteriorNome: { flex: 1 },
  });
}
