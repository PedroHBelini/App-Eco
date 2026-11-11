import { Medalha } from '../models/types';

// A ordem aqui é a ordem de exibição na tela de Conquistas.
export const CATALOGO_MEDALHAS: Medalha[] = [
  {
    idMedalha: 'PRIMEIRO_GOLE',
    nome: 'Primeiro gole',
    descricao: 'Registre sua primeira ingestão de água.',
    criterio: 'ingestoes >= 1',
  },
  {
    idMedalha: 'HIDRATADO',
    nome: 'Hidratado',
    descricao: 'Bata a meta de hidratação em um dia.',
    criterio: 'dias_na_meta_hidratacao >= 1',
  },
  {
    idMedalha: 'SEMANA_HIDRATADA',
    nome: 'Semana hidratada',
    descricao: 'Bata a meta de hidratação 7 dias seguidos.',
    criterio: 'maior_sequencia_hidratacao >= 7',
  },
  {
    idMedalha: 'MES_HIDRATADO',
    nome: 'Mês hidratado',
    descricao: 'Bata a meta de hidratação 30 dias seguidos.',
    criterio: 'maior_sequencia_hidratacao >= 30',
  },
  {
    idMedalha: 'CINQUENTA_LITROS',
    nome: '50 litros',
    descricao: 'Beba 50 litros de água no total.',
    criterio: 'total_ingerido_ml >= 50000',
  },
  {
    idMedalha: 'PRIMEIRA_NOITE',
    nome: 'Primeira noite',
    descricao: 'Registre sua primeira noite de sono.',
    criterio: 'registros_sono >= 1',
  },
  {
    idMedalha: 'BEM_DESCANSADO',
    nome: 'Bem descansado',
    descricao: 'Bata a meta de sono 7 noites seguidas.',
    criterio: 'maior_sequencia_sono >= 7',
  },
  {
    idMedalha: 'EQUILIBRIO',
    nome: 'Equilíbrio',
    descricao: 'Bata as metas de hidratação e de sono no mesmo dia.',
    criterio: 'dias_com_as_duas_metas >= 1',
  },
  {
    idMedalha: 'CONTA_EM_DIA',
    nome: 'Conta em dia',
    descricao: 'Registre sua primeira conta de energia ou de água.',
    criterio: 'registros_consumo >= 1',
  },
  {
    idMedalha: 'ECONOMIA',
    nome: 'Economia',
    descricao: 'Consuma menos energia ou água do que no mês anterior.',
    criterio: 'consumo_mes < consumo_mes_anterior',
  },
];
