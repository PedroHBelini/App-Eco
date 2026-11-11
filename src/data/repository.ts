import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ConfiguracaoAlerta,
  ConsumoRecurso,
  IdMedalha,
  Medalha,
  Meta,
  RegistroIngestaoAgua,
  Recorde,
  RegistroSono,
  TipoAlerta,
  TipoMeta,
  TipoRecorde,
  TipoRecurso,
  Usuario,
  UsuarioMedalha,
} from '../models/types';
import { CATALOGO_MEDALHAS } from './catalogoMedalhas';

const CHAVE_BANCO = '@appeco/banco';
const VERSAO_BANCO = 1;

interface Banco {
  versao: number;
  idUsuarioSessao: string | null;
  usuarios: Usuario[];
  metas: Meta[];
  ingestoes: RegistroIngestaoAgua[];
  registrosSono: RegistroSono[];
  consumos: ConsumoRecurso[];
  configuracoesAlerta: ConfiguracaoAlerta[];
  usuarioMedalhas: UsuarioMedalha[];
}

function bancoVazio(): Banco {
  return {
    versao: VERSAO_BANCO,
    idUsuarioSessao: null,
    usuarios: [],
    metas: [],
    ingestoes: [],
    registrosSono: [],
    consumos: [],
    configuracoesAlerta: [],
    usuarioMedalhas: [],
  };
}

// Cache em memória: as leituras são síncronas e cada alteração é gravada no AsyncStorage.
let banco: Banco = bancoVazio();
let filaGravacao: Promise<void> = Promise.resolve();

export async function carregarBanco(): Promise<void> {
  try {
    const json = await AsyncStorage.getItem(CHAVE_BANCO);
    if (json) {
      banco = { ...bancoVazio(), ...(JSON.parse(json) as Partial<Banco>) };
    }
  } catch (erro) {
    console.warn('Não foi possível carregar os dados salvos.', erro);
    banco = bancoVazio();
  }
}

// As gravações são enfileiradas para que um snapshot antigo nunca sobrescreva um mais novo.
function persistir(): Promise<void> {
  const snapshot = JSON.stringify(banco);
  filaGravacao = filaGravacao
    .then(() => AsyncStorage.setItem(CHAVE_BANCO, snapshot))
    .catch((erro) => console.warn('Não foi possível salvar os dados.', erro));
  return filaGravacao;
}

function gerarId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

// Data no fuso do aparelho (AAAA-MM-DD). toISOString() usaria UTC e viraria o dia às 21h no Brasil.
function dataLocal(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function hojeLocal(): string {
  return dataLocal(new Date());
}

// ---- Sessão ----

export function buscarUsuarioDaSessao(): Usuario | null {
  const id = banco.idUsuarioSessao;
  return banco.usuarios.find((u) => u.idUsuario === id) ?? null;
}

export function definirUsuarioDaSessao(idUsuario: string | null): void {
  banco.idUsuarioSessao = idUsuario;
  persistir();
}

// ---- Usuário ----

export function cadastrarUsuario(nome: string, nickname: string, email: string): Usuario {
  const usuario: Usuario = {
    idUsuario: gerarId(),
    nome,
    nickname,
    email,
    notificacoesHabilitadas: true,
    dataCadastro: new Date().toISOString(),
  };
  banco.usuarios = [...banco.usuarios, usuario];
  persistir();
  return usuario;
}

// ---- Metas ----

function definirMeta(idUsuario: string, tipo: TipoMeta, valorMeta: number, unidade: string): Meta {
  const meta: Meta = {
    idMeta: gerarId(),
    idUsuario,
    tipo,
    valorMeta,
    unidade,
    dataInicio: hojeLocal(),
    ativa: true,
  };
  // Metas anteriores ficam inativas (e não apagadas) para os relatórios usarem a meta vigente em cada dia.
  banco.metas = [
    ...banco.metas.map((m) => (m.idUsuario === idUsuario && m.tipo === tipo ? { ...m, ativa: false } : m)),
    meta,
  ];
  persistir();
  return meta;
}

function buscarMetaAtiva(idUsuario: string, tipo: TipoMeta): Meta | undefined {
  return banco.metas.find((m) => m.idUsuario === idUsuario && m.tipo === tipo && m.ativa);
}

export function definirMetaHidratacao(idUsuario: string, valorMetaMl: number): Meta {
  return definirMeta(idUsuario, 'HIDRATACAO', valorMetaMl, 'ml_por_dia');
}

export function buscarMetaHidratacaoAtiva(idUsuario: string): Meta | undefined {
  return buscarMetaAtiva(idUsuario, 'HIDRATACAO');
}

export function validarMetaSono(horas: number): boolean {
  return Number.isFinite(horas) && horas > 0 && horas <= 18;
}

export function definirMetaSono(idUsuario: string, horasPorNoite: number): Meta {
  if (!validarMetaSono(horasPorNoite)) {
    throw new RangeError('A meta de sono deve ficar entre 0 e 18 horas.');
  }
  return definirMeta(idUsuario, 'SONO', horasPorNoite, 'horas_por_noite');
}

export function buscarMetaSonoAtiva(idUsuario: string): Meta | undefined {
  return buscarMetaAtiva(idUsuario, 'SONO');
}

// ---- Ingestão de água ----

export function validarQuantidadeIngestao(quantidadeMl: number): boolean {
  return Number.isFinite(quantidadeMl) && quantidadeMl > 0;
}

export function registrarIngestao(idUsuario: string, quantidadeMl: number): RegistroIngestaoAgua {
  if (!validarQuantidadeIngestao(quantidadeMl)) {
    throw new RangeError('A quantidade de ingestão deve ser um número finito maior que zero.');
  }

  const registro: RegistroIngestaoAgua = {
    idIngestao: gerarId(),
    idUsuario,
    quantidadeMl,
    dataHora: new Date().toISOString(),
  };
  banco.ingestoes = [...banco.ingestoes, registro];
  persistir();
  return registro;
}

export function listarIngestoesDoDia(idUsuario: string): RegistroIngestaoAgua[] {
  const hoje = hojeLocal();
  return banco.ingestoes.filter(
    (i) => i.idUsuario === idUsuario && dataLocal(new Date(i.dataHora)) === hoje,
  );
}

export function calcularTotalIngeridoHoje(idUsuario: string): number {
  return listarIngestoesDoDia(idUsuario).reduce((total, i) => total + i.quantidadeMl, 0);
}

export function calcularProgresso(idUsuario: string): number {
  const meta = buscarMetaHidratacaoAtiva(idUsuario);
  if (!meta || meta.valorMeta <= 0) return 0;
  const total = calcularTotalIngeridoHoje(idUsuario);
  return Math.min(total / meta.valorMeta, 1);
}

// ---- Sono ----

const FORMATO_HORARIO = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DURACAO_MAXIMA_SONO_MIN = 18 * 60;

// Retorna a duração em minutos, ou null se os horários forem inválidos. Acordar antes de dormir = virou a noite.
export function calcularDuracaoSonoMinutos(horarioDormir: string, horarioAcordar: string): number | null {
  const inicio = horarioDormir.match(FORMATO_HORARIO);
  const fim = horarioAcordar.match(FORMATO_HORARIO);
  if (!inicio || !fim) return null;

  const minutosInicio = Number(inicio[1]) * 60 + Number(inicio[2]);
  let minutosFim = Number(fim[1]) * 60 + Number(fim[2]);
  if (minutosFim <= minutosInicio) minutosFim += 24 * 60;
  const duracao = minutosFim - minutosInicio;
  return duracao > DURACAO_MAXIMA_SONO_MIN ? null : duracao;
}

// Um registro por noite: registrar de novo no mesmo dia substitui o anterior.
export function registrarSono(idUsuario: string, horarioDormir: string, horarioAcordar: string): RegistroSono {
  const minutos = calcularDuracaoSonoMinutos(horarioDormir, horarioAcordar);
  if (minutos === null) {
    throw new RangeError('Horários de sono inválidos.');
  }

  const dataReferencia = hojeLocal();
  const registro: RegistroSono = {
    idSono: gerarId(),
    idUsuario,
    dataReferencia,
    horarioDormir,
    horarioAcordar,
    duracaoHoras: Math.round((minutos / 60) * 100) / 100,
  };
  banco.registrosSono = [
    ...banco.registrosSono.filter((r) => !(r.idUsuario === idUsuario && r.dataReferencia === dataReferencia)),
    registro,
  ];
  persistir();
  return registro;
}

export function listarRegistrosSono(idUsuario: string): RegistroSono[] {
  return banco.registrosSono
    .filter((r) => r.idUsuario === idUsuario)
    .sort((a, b) => b.dataReferencia.localeCompare(a.dataReferencia));
}

// ---- Consumo residencial ----

export function unidadeDoRecurso(tipo: TipoRecurso): string {
  return tipo === 'ENERGIA' ? 'kWh' : 'm³';
}

export function validarConsumo(mes: number, ano: number, quantidade: number): boolean {
  return (
    Number.isInteger(mes) &&
    mes >= 1 &&
    mes <= 12 &&
    Number.isInteger(ano) &&
    ano >= 2000 &&
    ano <= 2100 &&
    Number.isFinite(quantidade) &&
    quantidade > 0
  );
}

// Um registro por recurso e mês: informar de novo o mesmo mês corrige o valor anterior.
export function registrarConsumo(
  idUsuario: string,
  tipoRecurso: TipoRecurso,
  mesReferencia: number,
  anoReferencia: number,
  quantidade: number,
): ConsumoRecurso {
  if (!validarConsumo(mesReferencia, anoReferencia, quantidade)) {
    throw new RangeError('Mês de referência ou quantidade de consumo inválidos.');
  }

  const registro: ConsumoRecurso = {
    idConsumo: gerarId(),
    idUsuario,
    tipoRecurso,
    mesReferencia,
    anoReferencia,
    quantidade,
    unidade: unidadeDoRecurso(tipoRecurso),
  };
  banco.consumos = [
    ...banco.consumos.filter(
      (c) =>
        !(
          c.idUsuario === idUsuario &&
          c.tipoRecurso === tipoRecurso &&
          c.mesReferencia === mesReferencia &&
          c.anoReferencia === anoReferencia
        ),
    ),
    registro,
  ];
  persistir();
  return registro;
}

export function listarConsumos(idUsuario: string): ConsumoRecurso[] {
  return banco.consumos
    .filter((c) => c.idUsuario === idUsuario)
    .sort(
      (a, b) =>
        b.anoReferencia - a.anoReferencia ||
        b.mesReferencia - a.mesReferencia ||
        a.tipoRecurso.localeCompare(b.tipoRecurso),
    );
}

// ---- Alertas ----

const ALERTAS_PADRAO: Record<TipoAlerta, Pick<ConfiguracaoAlerta, 'horario' | 'frequencia' | 'habilitado'>> = {
  HIDRATACAO: { horario: '09:00', frequencia: 'A_CADA_2_HORAS', habilitado: true },
  SONO: { horario: '22:00', frequencia: 'DIARIA', habilitado: false },
  CONSUMO: { horario: '09:00', frequencia: 'MENSAL', habilitado: false },
};

const TIPOS_ALERTA = Object.keys(ALERTAS_PADRAO) as TipoAlerta[];

// Cria a configuração padrão dos tipos que o usuário ainda não tem, para que os ids fiquem estáveis.
export function listarConfiguracoesAlerta(idUsuario: string): ConfiguracaoAlerta[] {
  const doUsuario = banco.configuracoesAlerta.filter((c) => c.idUsuario === idUsuario);
  const faltantes = TIPOS_ALERTA.filter((tipo) => !doUsuario.some((c) => c.tipoAlerta === tipo)).map(
    (tipo): ConfiguracaoAlerta => ({ idConfiguracao: gerarId(), idUsuario, tipoAlerta: tipo, ...ALERTAS_PADRAO[tipo] }),
  );

  if (faltantes.length > 0) {
    banco.configuracoesAlerta = [...banco.configuracoesAlerta, ...faltantes];
    persistir();
  }

  return TIPOS_ALERTA.map((tipo) => [...doUsuario, ...faltantes].find((c) => c.tipoAlerta === tipo)!);
}

export function definirAlertaHabilitado(idUsuario: string, tipoAlerta: TipoAlerta, habilitado: boolean): void {
  listarConfiguracoesAlerta(idUsuario);
  banco.configuracoesAlerta = banco.configuracoesAlerta.map((c) =>
    c.idUsuario === idUsuario && c.tipoAlerta === tipoAlerta ? { ...c, habilitado } : c,
  );
  persistir();
}

// ---- Relatórios ----

export interface PontoDiario {
  data: string; // AAAA-MM-DD
  valor: number | null; // null = sem dado para o dia (antes do cadastro ou noite não registrada)
  meta: number | null; // meta vigente naquele dia
}

export interface PontoMensal {
  ano: number;
  mes: number;
  valor: number | null;
}

// Últimos `quantidade` dias (incluindo hoje), do mais antigo para o mais recente.
function ultimosDias(quantidade: number): string[] {
  const hoje = new Date();
  return Array.from({ length: quantidade }, (_, i) =>
    dataLocal(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (quantidade - 1 - i))),
  );
}

// Meta que valia na data: a mais recente com dataInicio até aquele dia.
function metaVigenteEm(idUsuario: string, tipo: TipoMeta, data: string): number | null {
  let valor: number | null = null;
  for (const m of banco.metas) {
    if (m.idUsuario === idUsuario && m.tipo === tipo && m.dataInicio <= data) {
      valor = m.valorMeta;
    }
  }
  return valor;
}

function dataCadastroLocal(idUsuario: string): string | null {
  const usuario = banco.usuarios.find((u) => u.idUsuario === idUsuario);
  return usuario ? dataLocal(new Date(usuario.dataCadastro)) : null;
}

export function serieHidratacao(idUsuario: string, dias: number): PontoDiario[] {
  const totais = new Map<string, number>();
  for (const i of banco.ingestoes) {
    if (i.idUsuario !== idUsuario) continue;
    const dia = dataLocal(new Date(i.dataHora));
    totais.set(dia, (totais.get(dia) ?? 0) + i.quantidadeMl);
  }
  const inicio = dataCadastroLocal(idUsuario);

  return ultimosDias(dias).map((data) => ({
    data,
    // Dias depois do cadastro sem registro contam como 0 ml; antes do cadastro não há dado.
    valor: totais.get(data) ?? (inicio !== null && data >= inicio ? 0 : null),
    meta: metaVigenteEm(idUsuario, 'HIDRATACAO', data),
  }));
}

export function serieSono(idUsuario: string, dias: number): PontoDiario[] {
  const porDia = new Map(
    banco.registrosSono.filter((r) => r.idUsuario === idUsuario).map((r) => [r.dataReferencia, r.duracaoHoras]),
  );
  return ultimosDias(dias).map((data) => ({
    data,
    valor: porDia.get(data) ?? null,
    meta: metaVigenteEm(idUsuario, 'SONO', data),
  }));
}

// Últimos `meses` meses (incluindo o atual), do mais antigo para o mais recente.
export function serieConsumoMensal(idUsuario: string, tipo: TipoRecurso, meses: number): PontoMensal[] {
  const hoje = new Date();
  return Array.from({ length: meses }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (meses - 1 - i), 1);
    const ano = d.getFullYear();
    const mes = d.getMonth() + 1;
    const registro = banco.consumos.find(
      (c) => c.idUsuario === idUsuario && c.tipoRecurso === tipo && c.anoReferencia === ano && c.mesReferencia === mes,
    );
    return { ano, mes, valor: registro?.quantidade ?? null };
  });
}

// ---- Gamificação: recordes ----

// Dias do cadastro até hoje (inclusive), no mínimo 1.
function diasDesdeCadastro(idUsuario: string): number {
  const inicio = dataCadastroLocal(idUsuario);
  if (!inicio) return 1;
  const [ano, mes, dia] = inicio.split('-').map(Number);
  const hoje = new Date();
  const diferenca = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime() - new Date(ano, mes - 1, dia).getTime();
  return Math.max(Math.round(diferenca / 86_400_000) + 1, 1);
}

function metaAtingida(ponto: PontoDiario): boolean {
  return ponto.valor !== null && ponto.meta !== null && ponto.valor >= ponto.meta;
}

function calcularRecorde(idUsuario: string, tipoRecorde: TipoRecorde, serie: PontoDiario[]): Recorde {
  let maiorSequencia = 0;
  let corrente = 0;
  for (const ponto of serie) {
    corrente = metaAtingida(ponto) ? corrente + 1 : 0;
    maiorSequencia = Math.max(maiorSequencia, corrente);
  }

  // Hoje ainda está em andamento: se a meta não foi batida, a sequência termina ontem, mas não quebra.
  const hoje = serie[serie.length - 1];
  const hojeConcluido = hoje ? metaAtingida(hoje) : false;
  let sequenciaAtual = 0;
  for (let i = serie.length - (hojeConcluido ? 1 : 2); i >= 0 && metaAtingida(serie[i]); i--) {
    sequenciaAtual++;
  }

  return {
    idUsuario,
    tipoRecorde,
    sequenciaAtual,
    maiorSequencia,
    metaDefinida: serie.some((p) => p.meta !== null),
    hojeConcluido,
    dataAtualizacao: hojeLocal(),
  };
}

export function calcularRecordes(idUsuario: string): Recorde[] {
  const dias = diasDesdeCadastro(idUsuario);
  return [
    calcularRecorde(idUsuario, 'SEQUENCIA_HIDRATACAO', serieHidratacao(idUsuario, dias)),
    calcularRecorde(idUsuario, 'SEQUENCIA_SONO', serieSono(idUsuario, dias)),
  ];
}

// ---- Gamificação: medalhas ----

export interface ProgressoMedalha {
  atual: number;
  alvo: number;
}

interface Avaliacao {
  atingida: boolean;
  progresso?: ProgressoMedalha; // só para medalhas com meta numérica
}

export interface SituacaoMedalha {
  medalha: Medalha;
  dataConquista: string | null; // null = ainda bloqueada
  progresso?: ProgressoMedalha;
}

function porQuantidade(atual: number, alvo: number): Avaliacao {
  return { atingida: atual >= alvo, progresso: { atual: Math.min(atual, alvo), alvo } };
}

// Houve algum mês com consumo menor que o do mês imediatamente anterior, para o mesmo recurso?
function houveEconomia(idUsuario: string): boolean {
  const consumos = banco.consumos.filter((c) => c.idUsuario === idUsuario);
  return consumos.some((atual) => {
    const mesAnterior = atual.mesReferencia === 1 ? 12 : atual.mesReferencia - 1;
    const anoAnterior = atual.mesReferencia === 1 ? atual.anoReferencia - 1 : atual.anoReferencia;
    const anterior = consumos.find(
      (c) => c.tipoRecurso === atual.tipoRecurso && c.mesReferencia === mesAnterior && c.anoReferencia === anoAnterior,
    );
    return anterior !== undefined && atual.quantidade < anterior.quantidade;
  });
}

// Avalia todo o catálogo de uma vez, reaproveitando as séries do histórico.
function avaliarMedalhas(idUsuario: string): Record<IdMedalha, Avaliacao> {
  const dias = diasDesdeCadastro(idUsuario);
  const agua = serieHidratacao(idUsuario, dias);
  const sono = serieSono(idUsuario, dias);
  const recordeAgua = calcularRecorde(idUsuario, 'SEQUENCIA_HIDRATACAO', agua);
  const recordeSono = calcularRecorde(idUsuario, 'SEQUENCIA_SONO', sono);

  const ingestoes = banco.ingestoes.filter((i) => i.idUsuario === idUsuario);
  const totalIngeridoMl = ingestoes.reduce((total, i) => total + i.quantidadeMl, 0);
  const noites = banco.registrosSono.filter((r) => r.idUsuario === idUsuario).length;
  const contas = banco.consumos.filter((c) => c.idUsuario === idUsuario).length;

  return {
    PRIMEIRO_GOLE: { atingida: ingestoes.length > 0 },
    HIDRATADO: { atingida: agua.some(metaAtingida) },
    SEMANA_HIDRATADA: porQuantidade(recordeAgua.maiorSequencia, 7),
    MES_HIDRATADO: porQuantidade(recordeAgua.maiorSequencia, 30),
    // Progresso em litros, para caber na tela.
    CINQUENTA_LITROS: porQuantidade(Math.floor(totalIngeridoMl / 1000), 50),
    PRIMEIRA_NOITE: { atingida: noites > 0 },
    BEM_DESCANSADO: porQuantidade(recordeSono.maiorSequencia, 7),
    EQUILIBRIO: { atingida: agua.some((ponto, i) => metaAtingida(ponto) && metaAtingida(sono[i])) },
    CONTA_EM_DIA: { atingida: contas > 0 },
    ECONOMIA: { atingida: houveEconomia(idUsuario) },
  };
}

// Libera as medalhas cujo critério foi atingido e retorna só as novas, para a tela comemorar.
export function verificarMedalhas(idUsuario: string): Medalha[] {
  const avaliacoes = avaliarMedalhas(idUsuario);
  const jaConquistadas = new Set(
    banco.usuarioMedalhas.filter((um) => um.idUsuario === idUsuario).map((um) => um.idMedalha),
  );
  const novas = CATALOGO_MEDALHAS.filter(
    (m) => !jaConquistadas.has(m.idMedalha) && avaliacoes[m.idMedalha].atingida,
  );

  if (novas.length > 0) {
    const agora = new Date().toISOString();
    banco.usuarioMedalhas = [
      ...banco.usuarioMedalhas,
      ...novas.map((m) => ({ idUsuario, idMedalha: m.idMedalha, dataConquista: agora })),
    ];
    persistir();
  }
  return novas;
}

export function listarMedalhas(idUsuario: string): SituacaoMedalha[] {
  const avaliacoes = avaliarMedalhas(idUsuario);
  return CATALOGO_MEDALHAS.map((medalha) => {
    const conquista = banco.usuarioMedalhas.find(
      (um) => um.idUsuario === idUsuario && um.idMedalha === medalha.idMedalha,
    );
    return {
      medalha,
      dataConquista: conquista?.dataConquista ?? null,
      progresso: conquista ? undefined : avaliacoes[medalha.idMedalha].progresso,
    };
  });
}
