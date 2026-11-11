export type TipoMeta = 'HIDRATACAO' | 'SONO';

export interface Usuario {
  idUsuario: string;
  nome: string;
  nickname: string;
  email: string;
  notificacoesHabilitadas: boolean;
  dataCadastro: string;
}

export interface Meta {
  idMeta: string;
  idUsuario: string;
  tipo: TipoMeta;
  valorMeta: number;
  unidade: string;
  dataInicio: string;
  ativa: boolean;
}

export interface RegistroIngestaoAgua {
  idIngestao: string;
  idUsuario: string;
  quantidadeMl: number;
  dataHora: string;
}

export type TipoRecurso = 'ENERGIA' | 'AGUA_RESIDENCIAL';

export type TipoAlerta = 'HIDRATACAO' | 'SONO' | 'CONSUMO';

export interface RegistroSono {
  idSono: string;
  idUsuario: string;
  dataReferencia: string; // AAAA-MM-DD, dia em que o usuário acordou
  horarioDormir: string; // HH:MM
  horarioAcordar: string; // HH:MM
  duracaoHoras: number;
}

export interface ConsumoRecurso {
  idConsumo: string;
  idUsuario: string;
  tipoRecurso: TipoRecurso;
  mesReferencia: number; // 1-12
  anoReferencia: number;
  quantidade: number;
  unidade: string;
}

export interface ConfiguracaoAlerta {
  idConfiguracao: string;
  idUsuario: string;
  tipoAlerta: TipoAlerta;
  horario: string; // HH:MM
  frequencia: string;
  habilitado: boolean;
}

export type TipoRecorde = 'SEQUENCIA_HIDRATACAO' | 'SEQUENCIA_SONO';

// Calculado a partir do histórico (não é gravado), para nunca divergir dos registros.
export interface Recorde {
  idUsuario: string;
  tipoRecorde: TipoRecorde;
  sequenciaAtual: number; // dias consecutivos batendo a meta até hoje
  maiorSequencia: number; // maior sequência já alcançada
  metaDefinida: boolean; // false = ainda não há meta, então não há o que contar
  hojeConcluido: boolean; // a meta de hoje já foi batida
  dataAtualizacao: string; // AAAA-MM-DD
}
