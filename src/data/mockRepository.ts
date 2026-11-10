import { Meta, RegistroIngestaoAgua, Usuario } from '../models/types';

let usuarios: Usuario[] = [];
let metas: Meta[] = [];
let ingestoes: RegistroIngestaoAgua[] = [];

function gerarId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function cadastrarUsuario(nome: string, nickname: string, email: string): Usuario {
  const usuario: Usuario = {
    idUsuario: gerarId(),
    nome,
    nickname,
    email,
    notificacoesHabilitadas: true,
    dataCadastro: new Date().toISOString(),
  };
  usuarios.push(usuario);
  return usuario;
}

export function definirMetaHidratacao(idUsuario: string, valorMetaMl: number): Meta {
  metas = metas.filter((m) => !(m.idUsuario === idUsuario && m.tipo === 'HIDRATACAO'));
  const meta: Meta = {
    idMeta: gerarId(),
    idUsuario,
    tipo: 'HIDRATACAO',
    valorMeta: valorMetaMl,
    unidade: 'ml_por_dia',
    dataInicio: hojeISO(),
    ativa: true,
  };
  metas.push(meta);
  return meta;
}

export function buscarMetaHidratacaoAtiva(idUsuario: string): Meta | undefined {
  return metas.find((m) => m.idUsuario === idUsuario && m.tipo === 'HIDRATACAO' && m.ativa);
}

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
  ingestoes.push(registro);
  return registro;
}

export function listarIngestoesDoDia(idUsuario: string): RegistroIngestaoAgua[] {
  const hoje = hojeISO();
  return ingestoes.filter((i) => i.idUsuario === idUsuario && i.dataHora.slice(0, 10) === hoje);
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
