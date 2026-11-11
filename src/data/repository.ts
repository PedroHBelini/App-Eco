import AsyncStorage from '@react-native-async-storage/async-storage';
import { Meta, RegistroIngestaoAgua, Usuario } from '../models/types';

const CHAVE_BANCO = '@appeco/banco';
const VERSAO_BANCO = 1;

interface Banco {
  versao: number;
  idUsuarioSessao: string | null;
  usuarios: Usuario[];
  metas: Meta[];
  ingestoes: RegistroIngestaoAgua[];
}

function bancoVazio(): Banco {
  return { versao: VERSAO_BANCO, idUsuarioSessao: null, usuarios: [], metas: [], ingestoes: [] };
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

export function definirMetaHidratacao(idUsuario: string, valorMetaMl: number): Meta {
  const meta: Meta = {
    idMeta: gerarId(),
    idUsuario,
    tipo: 'HIDRATACAO',
    valorMeta: valorMetaMl,
    unidade: 'ml_por_dia',
    dataInicio: hojeLocal(),
    ativa: true,
  };
  // Metas anteriores ficam inativas (e não apagadas) para os relatórios usarem a meta vigente em cada dia.
  banco.metas = [
    ...banco.metas.map((m) =>
      m.idUsuario === idUsuario && m.tipo === 'HIDRATACAO' ? { ...m, ativa: false } : m,
    ),
    meta,
  ];
  persistir();
  return meta;
}

export function buscarMetaHidratacaoAtiva(idUsuario: string): Meta | undefined {
  return banco.metas.find((m) => m.idUsuario === idUsuario && m.tipo === 'HIDRATACAO' && m.ativa);
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
