import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ConfiguracaoAlerta,
  ConsumoRecurso,
  Meta,
  RegistroIngestaoAgua,
  RegistroSono,
  TipoAlerta,
  TipoMeta,
  TipoRecurso,
  Usuario,
} from '../models/types';

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
