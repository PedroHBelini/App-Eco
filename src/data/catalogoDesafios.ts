import { ModeloDesafio, TipoMeta } from '../models/types';

export interface ModeloDeDesafio {
  modelo: ModeloDesafio;
  nome: string;
  descricao: string;
  criterio: string;
  alvo: number;
  metasNecessarias: TipoMeta[]; // sem essas metas definidas, não há como contar os dias
}

export const PONTOS_POR_DIA = 10;
export const BONUS_CONCLUSAO = 50;

// A ordem define o rodízio: uma semana para cada, e depois recomeça.
export const CATALOGO_DESAFIOS: ModeloDeDesafio[] = [
  {
    modelo: 'SEMANA_DA_AGUA',
    nome: 'Semana da água',
    descricao: 'Bata a meta de hidratação em 5 dias desta semana.',
    criterio: 'dias_na_meta_hidratacao >= 5',
    alvo: 5,
    metasNecessarias: ['HIDRATACAO'],
  },
  {
    modelo: 'SONO_EM_DIA',
    nome: 'Sono em dia',
    descricao: 'Bata a meta de sono em 4 noites desta semana.',
    criterio: 'noites_na_meta_sono >= 4',
    alvo: 4,
    metasNecessarias: ['SONO'],
  },
  {
    modelo: 'AGUA_TODO_DIA',
    nome: 'Água todo dia',
    descricao: 'Registre água em todos os 7 dias da semana.',
    criterio: 'dias_com_ingestao >= 7',
    alvo: 7,
    metasNecessarias: [],
  },
  {
    modelo: 'DUPLA_SAUDAVEL',
    nome: 'Dupla saudável',
    descricao: 'Bata as metas de hidratação e de sono no mesmo dia, 3 vezes nesta semana.',
    criterio: 'dias_com_as_duas_metas >= 3',
    alvo: 3,
    metasNecessarias: ['HIDRATACAO', 'SONO'],
  },
];
