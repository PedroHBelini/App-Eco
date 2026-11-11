import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ModuloLayout, { moduloStyles as styles } from '../components/ModuloLayout';
import { calcularRecordes, listarMedalhas, SituacaoMedalha, verificarMedalhas } from '../data/repository';
import { Recorde, TipoRecorde, Usuario } from '../models/types';
import { formatarDiaMes } from '../utils/formatacao';

interface Props {
  usuario: Usuario;
}

const TEXTOS_RECORDE: Record<TipoRecorde, { titulo: string; unidade: [string, string]; semMeta: string }> = {
  SEQUENCIA_HIDRATACAO: {
    titulo: 'Hidratação',
    unidade: ['dia', 'dias'],
    semMeta: 'Defina uma meta de hidratação para começar a contar.',
  },
  SEQUENCIA_SONO: {
    titulo: 'Sono',
    unidade: ['noite', 'noites'],
    semMeta: 'Defina uma meta de sono na tela de Sono para começar a contar.',
  },
};

function plural(valor: number, [singular, pluralizado]: [string, string]) {
  return `${valor} ${valor === 1 ? singular : pluralizado}`;
}

function mensagemDoDia(recorde: Recorde, unidade: [string, string]): string {
  if (recorde.hojeConcluido) return 'Meta de hoje concluída.';
  if (recorde.sequenciaAtual > 0) {
    return `Bata a meta hoje para chegar a ${plural(recorde.sequenciaAtual + 1, unidade)}.`;
  }
  return 'Bata a meta hoje para começar uma sequência.';
}

function CartaoRecorde({ recorde }: { recorde: Recorde }) {
  const textos = TEXTOS_RECORDE[recorde.tipoRecorde];
  const ehNovoRecorde = recorde.sequenciaAtual > 0 && recorde.sequenciaAtual === recorde.maiorSequencia;

  return (
    <View style={estilos.cartao}>
      <Text style={styles.rotulo}>{textos.titulo}</Text>
      {!recorde.metaDefinida ? (
        <Text style={styles.texto}>{textos.semMeta}</Text>
      ) : (
        <>
          <View style={estilos.numeros}>
            <View style={estilos.numero}>
              <Text style={estilos.valor}>{recorde.sequenciaAtual}</Text>
              <Text style={styles.texto}>sequência atual</Text>
            </View>
            <View style={estilos.numero}>
              <Text style={estilos.valor}>{recorde.maiorSequencia}</Text>
              <Text style={styles.texto}>recorde</Text>
            </View>
          </View>
          <Text style={styles.texto}>
            {ehNovoRecorde ? 'Você está no seu recorde! ' : ''}
            {mensagemDoDia(recorde, textos.unidade)}
          </Text>
        </>
      )}
    </View>
  );
}

function ItemMedalha({ situacao }: { situacao: SituacaoMedalha }) {
  const { medalha, dataConquista, progresso } = situacao;
  const conquistada = dataConquista !== null;
  const estado = conquistada
    ? `Conquistada em ${formatarDiaMes(dataConquista.slice(0, 10))}`
    : progresso
      ? `${progresso.atual} de ${progresso.alvo}`
      : 'Bloqueada';

  return (
    <View
      style={styles.medalha}
      accessible
      accessibilityLabel={`${medalha.nome}. ${medalha.descricao} ${estado}.`}
    >
      <View style={[styles.medalhaSelo, !conquistada && estilos.seloBloqueado]}>
        <Text style={[styles.medalhaInicial, !conquistada && estilos.inicialBloqueada]}>
          {conquistada ? '✓' : medalha.nome.charAt(0)}
        </Text>
      </View>
      <View style={styles.medalhaDescricao}>
        <Text style={[styles.valor, !conquistada && estilos.nomeBloqueado]}>{medalha.nome}</Text>
        <Text style={styles.texto}>{medalha.descricao}</Text>
        {!conquistada && progresso ? (
          <View style={estilos.progressoFundo}>
            <View style={[estilos.progresso, { width: `${(progresso.atual / progresso.alvo) * 100}%` }]} />
          </View>
        ) : null}
        <Text style={[styles.estado, estilos.estado]}>{estado}</Text>
      </View>
    </View>
  );
}

export default function Gamificacao({ usuario }: Props) {
  const recordes = calcularRecordes(usuario.idUsuario);
  // Ao abrir a tela, libera também medalhas cujo critério já foi atingido (ex.: histórico anterior às medalhas).
  const [medalhas] = useState(() => {
    verificarMedalhas(usuario.idUsuario);
    return listarMedalhas(usuario.idUsuario);
  });
  const conquistadas = medalhas.filter((m) => m.dataConquista !== null).length;

  return (
    <ModuloLayout titulo="Conquistas" descricao="Metas, desafios e recordes para acompanhar sua evolução.">
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Recordes</Text>
        <Text style={[styles.texto, estilos.explicacao]}>Dias consecutivos em que você bateu a meta.</Text>
        {recordes.map((recorde, index) => (
          <View key={recorde.tipoRecorde} style={index > 0 && styles.separador}>
            <CartaoRecorde recorde={recorde} />
          </View>
        ))}
      </View>
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Desafio da semana</Text>
        <Text style={styles.texto}>Em breve.</Text>
      </View>
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Medalhas</Text>
        <Text style={[styles.texto, estilos.explicacao]}>
          {conquistadas} de {medalhas.length} conquistadas
        </Text>
        {medalhas.map((situacao, index) => (
          <View key={situacao.medalha.idMedalha} style={index > 0 ? styles.separador : estilos.primeiraMedalha}>
            <ItemMedalha situacao={situacao} />
          </View>
        ))}
      </View>
    </ModuloLayout>
  );
}

const estilos = StyleSheet.create({
  explicacao: { marginBottom: 4 },
  cartao: { paddingTop: 8 },
  numeros: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  numero: { flex: 1, backgroundColor: '#f4faff', borderRadius: 8, padding: 12 },
  valor: { color: '#173f4f', fontSize: 28, fontWeight: '700' },
  primeiraMedalha: { paddingTop: 12 },
  seloBloqueado: { backgroundColor: '#e5ecea' },
  inicialBloqueada: { color: '#7b8f99' },
  nomeBloqueado: { color: '#4a6572' },
  progressoFundo: { height: 6, backgroundColor: '#e0eef2', borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  progresso: { height: '100%', backgroundColor: '#2e8bc0', borderRadius: 3 },
  estado: { marginTop: 6 },
});
