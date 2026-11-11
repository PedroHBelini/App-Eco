import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ModuloLayout, { moduloStyles as styles } from '../components/ModuloLayout';
import { calcularRecordes } from '../data/repository';
import { Recorde, TipoRecorde, Usuario } from '../models/types';

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

export default function Gamificacao({ usuario }: Props) {
  const recordes = calcularRecordes(usuario.idUsuario);

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
        <Text style={styles.texto}>Em breve.</Text>
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
});
