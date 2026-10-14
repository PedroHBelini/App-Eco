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
