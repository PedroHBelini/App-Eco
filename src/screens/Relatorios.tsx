import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GraficoBarras, { BarraGrafico } from '../components/GraficoBarras';
import ModuloLayout, { useModuloStyles } from '../components/ModuloLayout';
import {
  buscarMetaHidratacaoAtiva,
  buscarMetaSonoAtiva,
  PontoDiario,
  PontoMensal,
  serieConsumoMensal,
  serieHidratacao,
  serieSono,
  unidadeDoRecurso,
} from '../data/repository';
import { TipoRecurso, Usuario } from '../models/types';
import { Cores } from '../theme/cores';
import { useEstilos } from '../theme/TemaContext';
import { diaDaSemana, formatarDiaMes, formatarHoras, formatarNumero, nomeMes } from '../utils/formatacao';

interface Props {
  usuario: Usuario;
}

type Periodo = 'SEMANA' | 'MES';

const DIAS_POR_PERIODO: Record<Periodo, number> = { SEMANA: 7, MES: 30 };
const MESES_DE_CONSUMO = 6;

// Semana: todos os dias da semana. Mês: um rótulo a cada 7 dias, ancorado em hoje.
function rotuloDoDia(data: string, indice: number, total: number, periodo: Periodo): string | undefined {
  if (periodo === 'SEMANA') return diaDaSemana(data);
  return (total - 1 - indice) % 7 === 0 ? formatarDiaMes(data) : undefined;
}

function resumir(pontos: PontoDiario[]) {
  const comValor = pontos.filter((p): p is PontoDiario & { valor: number } => p.valor !== null);
  const comMeta = comValor.filter((p) => p.meta !== null);
  const soma = comValor.reduce((total, p) => total + p.valor, 0);
  return {
    quantidade: comValor.length,
    media: comValor.length > 0 ? soma / comValor.length : 0,
    temAlgumDado: comValor.some((p) => p.valor > 0),
    naMeta: comMeta.filter((p) => p.valor >= (p.meta as number)).length,
    comMeta: comMeta.length,
  };
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: string }) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.indicador}>
      <Text style={styles.indicadorRotulo}>{rotulo}</Text>
      <Text style={styles.indicadorValor}>{valor}</Text>
    </View>
  );
}

function comparacaoMensal(pontos: PontoMensal[], unidade: string): string | null {
  const registrados = pontos.filter((p): p is PontoMensal & { valor: number } => p.valor !== null);
  if (registrados.length < 2) return null;
  const atual = registrados[registrados.length - 1];
  const anterior = registrados[registrados.length - 2];
  const variacao = ((atual.valor - anterior.valor) / anterior.valor) * 100;
  const base = `${formatarNumero(atual.valor, 1)} ${unidade} em ${nomeMes(atual.mes)}`;
  if (Math.abs(variacao) < 0.5) return `${base}, igual a ${nomeMes(anterior.mes)}.`;
  return `${base}, ${formatarNumero(Math.abs(variacao), 1)}% ${variacao < 0 ? 'abaixo' : 'acima'} de ${nomeMes(anterior.mes)}.`;
}

function GraficoConsumo({ usuario, tipo, titulo }: { usuario: Usuario; tipo: TipoRecurso; titulo: string }) {
  const moduloStyles = useModuloStyles();
  const styles = useEstilos(criarEstilos);
  const unidade = unidadeDoRecurso(tipo);
  const pontos = serieConsumoMensal(usuario.idUsuario, tipo, MESES_DE_CONSUMO);
  if (pontos.every((p) => p.valor === null)) return null;

  const barras: BarraGrafico[] = pontos.map((p) => ({
    chave: `${p.ano}-${p.mes}`,
    valor: p.valor,
    rotuloEixo: nomeMes(p.mes),
    descricao: `${nomeMes(p.mes)}/${p.ano} · ${p.valor === null ? 'sem registro' : `${formatarNumero(p.valor, 1)} ${unidade}`}`,
  }));
  const comparacao = comparacaoMensal(pontos, unidade);

  return (
    <View style={styles.blocoConsumo}>
      <Text style={moduloStyles.rotulo}>{titulo} ({unidade})</Text>
      {comparacao ? <Text style={[moduloStyles.texto, styles.comparacao]}>{comparacao}</Text> : null}
      <GraficoBarras
        barras={barras}
        formatarValor={(v) => formatarNumero(v)}
        rotuloAcessivel={`Consumo de ${titulo.toLowerCase()} nos últimos ${MESES_DE_CONSUMO} meses. ${comparacao ?? ''}`}
      />
    </View>
  );
}

export default function Relatorios({ usuario }: Props) {
  const moduloStyles = useModuloStyles();
  const styles = useEstilos(criarEstilos);
  const [periodo, setPeriodo] = useState<Periodo>('SEMANA');
  const dias = DIAS_POR_PERIODO[periodo];

  const hidratacao = useMemo(() => serieHidratacao(usuario.idUsuario, dias), [usuario.idUsuario, dias]);
  const sono = useMemo(() => serieSono(usuario.idUsuario, dias), [usuario.idUsuario, dias]);
  const resumoHidratacao = resumir(hidratacao);
  const resumoSono = resumir(sono);
  const metaHidratacao = buscarMetaHidratacaoAtiva(usuario.idUsuario);
  const metaSono = buscarMetaSonoAtiva(usuario.idUsuario);

  const barrasHidratacao: BarraGrafico[] = hidratacao.map((p, i) => ({
    chave: p.data,
    valor: p.valor,
    rotuloEixo: rotuloDoDia(p.data, i, hidratacao.length, periodo),
    descricao:
      `${diaDaSemana(p.data)}, ${formatarDiaMes(p.data)} · ` +
      (p.valor === null
        ? 'antes do cadastro'
        : `${formatarNumero(p.valor)} ml${p.meta ? ` de ${formatarNumero(p.meta)} ml` : ''}`),
  }));

  const barrasSono: BarraGrafico[] = sono.map((p, i) => ({
    chave: p.data,
    valor: p.valor,
    rotuloEixo: rotuloDoDia(p.data, i, sono.length, periodo),
    descricao: `${diaDaSemana(p.data)}, ${formatarDiaMes(p.data)} · ${p.valor === null ? 'sem registro' : formatarHoras(p.valor)}`,
  }));

  const temConsumo = (['ENERGIA', 'AGUA_RESIDENCIAL'] as const).some((tipo) =>
    serieConsumoMensal(usuario.idUsuario, tipo, MESES_DE_CONSUMO).some((p) => p.valor !== null),
  );
  const textoPeriodo = periodo === 'SEMANA' ? 'nos últimos 7 dias' : 'nos últimos 30 dias';

  return (
    <ModuloLayout titulo="Relatórios" descricao="Acompanhe seus hábitos e consumo ao longo do tempo.">
      <View style={moduloStyles.linha}>
        {(['SEMANA', 'MES'] as const).map((opcao) => (
          <TouchableOpacity
            key={opcao}
            onPress={() => setPeriodo(opcao)}
            style={[moduloStyles.opcao, periodo === opcao && moduloStyles.opcaoAtiva]}
            accessibilityRole="button"
            accessibilityState={{ selected: periodo === opcao }}
          >
            <Text style={[moduloStyles.opcaoTexto, periodo === opcao && moduloStyles.opcaoTextoAtiva]}>
              {opcao === 'SEMANA' ? 'Semana' : 'Mês'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={moduloStyles.secao}>
        <Text style={moduloStyles.secaoTitulo}>Hidratação</Text>
        {resumoHidratacao.temAlgumDado ? (
          <>
            <View style={styles.indicadores}>
              <Indicador rotulo="Média diária" valor={`${formatarNumero(resumoHidratacao.media)} ml`} />
              <Indicador
                rotulo="Dias na meta"
                valor={resumoHidratacao.comMeta > 0 ? `${resumoHidratacao.naMeta} de ${resumoHidratacao.comMeta}` : '—'}
              />
            </View>
            <GraficoBarras
              key={periodo}
              barras={barrasHidratacao}
              meta={metaHidratacao?.valorMeta}
              rotuloMeta={metaHidratacao ? `meta ${formatarNumero(metaHidratacao.valorMeta)} ml` : undefined}
              formatarValor={(v) => formatarNumero(v)}
              rotuloAcessivel={`Água ingerida por dia ${textoPeriodo}. Média de ${formatarNumero(resumoHidratacao.media)} ml, meta atingida em ${resumoHidratacao.naMeta} dias.`}
            />
          </>
        ) : (
          <Text style={moduloStyles.texto}>Nenhuma ingestão registrada {textoPeriodo}.</Text>
        )}
      </View>

      <View style={moduloStyles.secao}>
        <Text style={moduloStyles.secaoTitulo}>Sono</Text>
        {resumoSono.quantidade > 0 ? (
          <>
            <View style={styles.indicadores}>
              <Indicador rotulo="Média por noite" valor={formatarHoras(resumoSono.media)} />
              <Indicador
                rotulo="Noites na meta"
                valor={resumoSono.comMeta > 0 ? `${resumoSono.naMeta} de ${resumoSono.comMeta}` : '—'}
              />
            </View>
            <GraficoBarras
              key={periodo}
              barras={barrasSono}
              meta={metaSono?.valorMeta}
              rotuloMeta={metaSono ? `meta ${formatarHoras(metaSono.valorMeta)}` : undefined}
              formatarValor={(v) => `${formatarNumero(v, 1)}h`}
              rotuloAcessivel={`Horas de sono por noite ${textoPeriodo}. Média de ${formatarHoras(resumoSono.media)} em ${resumoSono.quantidade} noites registradas.`}
            />
          </>
        ) : (
          <Text style={moduloStyles.texto}>Nenhuma noite registrada {textoPeriodo}.</Text>
        )}
      </View>

      <View style={moduloStyles.secao}>
        <Text style={moduloStyles.secaoTitulo}>Consumo residencial</Text>
        <Text style={[moduloStyles.texto, styles.legendaConsumo]}>
          Últimos {MESES_DE_CONSUMO} meses, conforme as contas informadas.
        </Text>
        {temConsumo ? (
          <>
            <GraficoConsumo usuario={usuario} tipo="ENERGIA" titulo="Energia" />
            <GraficoConsumo usuario={usuario} tipo="AGUA_RESIDENCIAL" titulo="Água" />
          </>
        ) : (
          <Text style={moduloStyles.texto}>Nenhuma conta registrada nos últimos {MESES_DE_CONSUMO} meses.</Text>
        )}
      </View>
    </ModuloLayout>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    indicadores: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    indicador: { flex: 1, backgroundColor: c.superficieSuave, borderRadius: 12, padding: 14 },
    indicadorRotulo: { color: c.textoSecundario, fontSize: 12 },
    indicadorValor: { color: c.texto, fontSize: 20, fontWeight: '700', marginTop: 2 },
    legendaConsumo: { marginBottom: 12 },
    blocoConsumo: { marginBottom: 16 },
    comparacao: { marginBottom: 10 },
  });
}
