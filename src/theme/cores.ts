export type ModoTema = 'claro' | 'escuro';

// Fonte única das cores do app. Nenhuma tela deve usar cor fixa: sempre um token daqui.
export interface Cores {
  fundo: string; // fundo das telas
  superficie: string; // cartões e seções
  superficieSuave: string; // blocos dentro de cartões (indicadores, trilhas)
  borda: string;
  bordaForte: string; // campos de texto
  texto: string;
  textoSecundario: string;
  textoSuave: string;
  primaria: string; // botões, destaques, barras de dados
  textoSobrePrimaria: string;
  primariaSuave: string; // fundo de botões secundários e chips
  sucesso: string;
  erro: string;
  aviso: string;
  ouro: string; // medalhas conquistadas
  ouroTexto: string; // texto sobre o ouro
  ouroSuave: string; // fundo do aviso de nova medalha
  sombra: string;
}

const claro: Cores = {
  fundo: '#f4f7f8',
  superficie: '#ffffff',
  superficieSuave: '#eef4f5',
  borda: '#e2e9eb',
  bordaForte: '#cddbdf',
  texto: '#13313c',
  textoSecundario: '#4a6572',
  textoSuave: '#71868f',
  primaria: '#0e7c86',
  textoSobrePrimaria: '#ffffff',
  primariaSuave: '#dff1f2',
  sucesso: '#1f7a4d',
  erro: '#b33b32',
  aviso: '#8a5a00',
  ouro: '#f4d06f',
  ouroTexto: '#5e4708',
  ouroSuave: '#fdf4d8',
  sombra: '#0b2a33',
};

const escuro: Cores = {
  fundo: '#0e181c',
  superficie: '#162328',
  superficieSuave: '#1e2f35',
  borda: '#26383e',
  bordaForte: '#354a51',
  texto: '#e5eef0',
  textoSecundario: '#a8bcc3',
  textoSuave: '#7d939b',
  primaria: '#3db5bf',
  textoSobrePrimaria: '#04262a',
  primariaSuave: '#173b40',
  sucesso: '#5cc98f',
  erro: '#f08a80',
  aviso: '#e8b65a',
  ouro: '#d9b34a',
  ouroTexto: '#2e2304',
  ouroSuave: '#332b14',
  sombra: '#000000',
};

export const TEMAS: Record<ModoTema, Cores> = { claro, escuro };
