import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import EstadoVazio from '../components/EstadoVazio';
import GraficoBarras, { BarraGrafico } from '../components/GraficoBarras';
import ModuloLayout, { useModuloStyles } from '../components/ModuloLayout';
import { useAtualizarAoFocar } from '../hooks/useAtualizarAoFocar';
import {
  buscarMetaHidratacaoAtiva,
  buscarMetaSonoAtiva,
  PontoDiario,
  PontoMensal,
  dataCadastroLocal,
  serieConsumoMensal,
  serieHidratacaoNasDatas,
  serieSonoNasDatas,
  unidadeDoRecurso,
} from '../data/repository';
import { TipoRecurso, Usuario } from '../models/types';
import { Cores, coresDoModulo, Modulo } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';
import { datasDaSemana, datasDoMes, deDataISO, hojeISO, paraDataISO, somarDias } from '../utils/datas';
import { diaDaSemana, formatarDiaMes, formatarHoras, formatarMesAno, formatarNumero, nomeMes } from '../utils/formatacao';

interface Props {
  usuario: Usuario;
}

type Periodo = 'SEMANA' | 'MES';

const MESES_DE_CONSUMO = 6;

type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];

// Título da seção com o ícone na cor do módulo, igual aos cartões do Início.
function TituloSecao({ titulo, icone, modulo }: { titulo: string; icone: NomeIcone; modulo: Modulo }) {
  const moduloStyles = useModuloStyles();
  const styles = useEstilos(criarEstilos);
  const { cores } = useTema();
  const cor = coresDoModulo(cores, modulo);
  return (
    <View style={styles.tituloSecao}>
      <View style={[styles.tituloIcone, { backgroundColor: cor.suave }]}>
        <Ionicons name={icone} size={16} color={cor.forte} />
      </View>
      <Text style={[moduloStyles.secaoTitulo, styles.tituloTexto]}>{titulo}</Text>
    </View>
  );
}

// Semana: todos os dias da semana. Mês: os dias 1, 8, 15, 22 e 29.
function rotuloDoDia(data: string, periodo: Periodo): string | undefined {
  if (periodo === 'SEMANA') return diaDaSemana(data);
  const dia = deDataISO(data).getDate();
  return (dia - 1) % 7 === 0 ? String(dia) : undefined;
}

// Semana (segunda a domingo) ou mês do calendário. `deslocamento` 0 = o atual, -1 = o anterior...
function datasDoPeriodo(periodo: Periodo, deslocamento: number): string[] {
  const hoje = hojeISO();
  if (periodo === 'SEMANA') return datasDaSemana(somarDias(hoje, 7 * deslocamento));
  const d = deDataISO(hoje);
  return datasDoMes(paraDataISO(new Date(d.getFullYear(), d.getMonth() + deslocamento, 1)));
}

function nomeDoPeriodo(periodo: Periodo, deslocamento: number, datas: string[]): { titulo: string; detalhe?: string } {
  const intervalo = `${formatarDiaMes(datas[0])} – ${formatarDiaMes(datas[datas.length - 1])}`;
  const textoMes = formatarMesAno(deDataISO(datas[0])); // 'novembro de 2026'
  const mes = textoMes.charAt(0).toUpperCase() + textoMes.slice(1);
  if (periodo === 'SEMANA') return deslocamento === 0 ? { titulo: 'Esta semana', detalhe: intervalo } : { titulo: intervalo };
  return deslocamento === 0 ? { titulo: 'Este mês', detalhe: mes } : { titulo: mes };
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
  const { cores } = useTema();
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
        cor={cores.consumo}
        rotuloAcessivel={`Consumo de ${titulo.toLowerCase()} nos últimos ${MESES_DE_CONSUMO} meses. ${comparacao ?? ''}`}
      />
    </View>
  );
}

export default function Relatorios({ usuario }: Props) {
  const moduloStyles = useModuloStyles();
  const styles = useEstilos(criarEstilos);
  const { cores } = useTema();
  const [periodo, setPeriodo] = useState<Periodo>('SEMANA');
  const [deslocamento, setDeslocamento] = useState(0);
  const datas = useMemo(() => datasDoPeriodo(periodo, deslocamento), [periodo, deslocamento]);
  const hoje = hojeISO();
  const nome = nomeDoPeriodo(periodo, deslocamento, datas);
  // Não volta para antes do cadastro nem avança para o futuro.
  const cadastro = dataCadastroLocal(usuario.idUsuario);
  const podeVoltar = cadastro !== null && datas[0] > cadastro;
  const podeAvancar = deslocamento < 0;
  // Destaca hoje quando está no período; senão, o último dia.
  const indiceHoje = datas.indexOf(hoje);
  const indiceInicial = indiceHoje >= 0 ? indiceHoje : datas.length - 1;
  const chaveGrafico = `${periodo}${deslocamento}`;

  // Relê o histórico sempre que a aba volta ao foco (ex.: depois de registrar água).
  const versao = useAtualizarAoFocar();
  const hidratacao = useMemo(
    () => serieHidratacaoNasDatas(usuario.idUsuario, datas),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usuario.idUsuario, datas, versao],
  );
  const sono = useMemo(
    () => serieSonoNasDatas(usuario.idUsuario, datas),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usuario.idUsuario, datas, versao],
  );
  const resumoHidratacao = resumir(hidratacao);
  const resumoSono = resumir(sono);
  const metaHidratacao = buscarMetaHidratacaoAtiva(usuario.idUsuario);
  const metaSono = buscarMetaSonoAtiva(usuario.idUsuario);

  const barrasHidratacao: BarraGrafico[] = hidratacao.map((p) => ({
    chave: p.data,
    valor: p.valor,
    futura: p.data > hoje,
    rotuloEixo: rotuloDoDia(p.data, periodo),
    descricao:
      `${diaDaSemana(p.data)}, ${formatarDiaMes(p.data)} · ` +
      (p.data > hoje
        ? 'ainda não chegou'
        : p.valor === null
          ? 'antes do cadastro'
          : `${formatarNumero(p.valor)} ml${p.meta ? ` de ${formatarNumero(p.meta)} ml` : ''}`),
  }));

  const barrasSono: BarraGrafico[] = sono.map((p) => ({
    chave: p.data,
    valor: p.valor,
    futura: p.data > hoje,
    rotuloEixo: rotuloDoDia(p.data, periodo),
    descricao:
      `${diaDaSemana(p.data)}, ${formatarDiaMes(p.data)} · ` +
      (p.data > hoje ? 'ainda não chegou' : p.valor === null ? 'sem registro' : formatarHoras(p.valor)),
  }));

  const temConsumo = (['ENERGIA', 'AGUA_RESIDENCIAL'] as const).some((tipo) =>
    serieConsumoMensal(usuario.idUsuario, tipo, MESES_DE_CONSUMO).some((p) => p.valor !== null),
  );
  const textoPeriodo = deslocamento !== 0 ? 'neste período' : periodo === 'SEMANA' ? 'nesta semana' : 'neste mês';

  return (
    <ModuloLayout titulo="Relatórios">
      <View style={moduloStyles.linha}>
        {(['SEMANA', 'MES'] as const).map((opcao) => (
          <TouchableOpacity
            key={opcao}
            onPress={() => {
              setPeriodo(opcao);
              setDeslocamento(0);
            }}
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

      <View style={styles.navegacao}>
        <Pressable
          onPress={() => setDeslocamento((d) => d - 1)}
          disabled={!podeVoltar}
          style={[styles.seta, !podeVoltar && styles.desabilitada]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={periodo === 'SEMANA' ? 'Semana anterior' : 'Mês anterior'}
          accessibilityState={{ disabled: !podeVoltar }}
        >
          <Ionicons name="chevron-back" size={22} color={cores.primaria} />
        </Pressable>
        <View style={styles.periodoNome} accessibilityLiveRegion="polite">
          <Text style={styles.periodoTitulo}>{nome.titulo}</Text>
          {nome.detalhe ? <Text style={moduloStyles.estado}>{nome.detalhe}</Text> : null}
        </View>
        <Pressable
          onPress={() => setDeslocamento((d) => d + 1)}
          disabled={!podeAvancar}
          style={[styles.seta, !podeAvancar && styles.desabilitada]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={periodo === 'SEMANA' ? 'Próxima semana' : 'Próximo mês'}
          accessibilityState={{ disabled: !podeAvancar }}
        >
          <Ionicons name="chevron-forward" size={22} color={cores.primaria} />
        </Pressable>
      </View>

      <View style={moduloStyles.secao}>
        <TituloSecao titulo="Hidratação" icone="water" modulo="agua" />
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
              key={chaveGrafico}
              indiceInicial={indiceInicial}
              barras={barrasHidratacao}
              meta={metaHidratacao?.valorMeta}
              rotuloMeta={metaHidratacao ? `meta ${formatarNumero(metaHidratacao.valorMeta)} ml` : undefined}
              formatarValor={(v) => formatarNumero(v)}
              cor={cores.agua}
              rotuloAcessivel={`Água ingerida por dia ${textoPeriodo}. Média de ${formatarNumero(resumoHidratacao.media)} ml, meta atingida em ${resumoHidratacao.naMeta} dias.`}
            />
          </>
        ) : (
          <EstadoVazio icone="water-outline" texto={`Nenhuma ingestão registrada ${textoPeriodo}.`} />
        )}
      </View>

      <View style={moduloStyles.secao}>
        <TituloSecao titulo="Sono" icone="moon" modulo="sono" />
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
              key={chaveGrafico}
              indiceInicial={indiceInicial}
              barras={barrasSono}
              meta={metaSono?.valorMeta}
              rotuloMeta={metaSono ? `meta ${formatarHoras(metaSono.valorMeta)}` : undefined}
              formatarValor={(v) => `${formatarNumero(v, 1)}h`}
              cor={cores.sono}
              rotuloAcessivel={`Horas de sono por noite ${textoPeriodo}. Média de ${formatarHoras(resumoSono.media)} em ${resumoSono.quantidade} noites registradas.`}
            />
          </>
        ) : (
          <EstadoVazio icone="moon-outline" texto={`Nenhuma noite registrada ${textoPeriodo}.`} />
        )}
      </View>

      <View style={moduloStyles.secao}>
        <TituloSecao titulo="Consumo residencial" icone="flash" modulo="consumo" />
        {temConsumo ? (
          <>
            <GraficoConsumo usuario={usuario} tipo="ENERGIA" titulo="Energia" />
            <GraficoConsumo usuario={usuario} tipo="AGUA_RESIDENCIAL" titulo="Água" />
          </>
        ) : (
          <EstadoVazio icone="flash-outline" texto={`Nenhuma conta registrada nos últimos ${MESES_DE_CONSUMO} meses.`} />
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
    blocoConsumo: { marginBottom: 16 },
    comparacao: { marginBottom: 10 },
    navegacao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    seta: { padding: 6 },
    desabilitada: { opacity: 0.3 },
    periodoNome: { alignItems: 'center' },
    periodoTitulo: { color: c.texto, fontSize: 16, fontWeight: '700' },
    tituloSecao: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    tituloIcone: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    tituloTexto: { marginBottom: 0 },
  });
}
