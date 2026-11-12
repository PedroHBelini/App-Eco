import { Ionicons } from '@react-native-vector-icons/ionicons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AvaliacaoDesafio } from '../data/repository';
import { TipoMeta } from '../models/types';
import { diaDaSemana, formatarDiaMes } from '../utils/formatacao';
import { Cores } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';
import { useModuloStyles } from './ModuloLayout';

const NOME_META: Record<TipoMeta, string> = { HIDRATACAO: 'hidratação', SONO: 'sono' };

// Desafio da semana: regra, uma bolinha por dia e o placar. Sem frases de situação: as bolinhas já contam.
export default function CartaoDesafio({ avaliacao }: { avaliacao: AvaliacaoDesafio }) {
  const moduloStyles = useModuloStyles();
  const styles = useEstilos(criarEstilos);
  const { cores } = useTema();
  const { desafio, dias, atual, pontuacao, concluido, metasFaltando } = avaliacao;

  return (
    <View>
      <View style={styles.cabecalho}>
        <Text style={styles.nome}>{desafio.nome}</Text>
        {concluido ? (
          <View style={styles.selo}>
            <Ionicons name="checkmark" size={14} color={cores.textoSobrePrimaria} />
            <Text style={styles.seloTexto}>Concluído</Text>
          </View>
        ) : (
          <Text style={moduloStyles.estado}>
            {formatarDiaMes(desafio.dataInicio)} a {formatarDiaMes(desafio.dataFim)}
          </Text>
        )}
      </View>
      <Text style={moduloStyles.texto}>{desafio.descricao}</Text>

      {metasFaltando.length > 0 ? (
        <Text style={[moduloStyles.texto, styles.aviso]}>
          Defina sua meta de {metasFaltando.map((t) => NOME_META[t]).join(' e de ')} em Ajustes para participar.
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
              {dia.contou ? <Ionicons name="checkmark" size={16} color={cores.textoSobrePrimaria} /> : null}
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
        <Text style={moduloStyles.valor}>{pontuacao} pts</Text>
      </View>
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    nome: { color: c.texto, fontSize: 18, fontWeight: '700' },
    selo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.sucesso,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    seloTexto: { color: c.textoSobrePrimaria, fontSize: 12, fontWeight: '700' },
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
    rotuloDia: { color: c.textoSuave, fontSize: 11 },
    rotuloHoje: { color: c.texto, fontWeight: '700' },
    placar: { flexDirection: 'row', justifyContent: 'space-between' },
  });
}
