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
  // Cor de cada módulo (ícones, barras de progresso e gráficos), tiradas da logo do Ciclo.
  agua: string;
  aguaSuave: string;
  sono: string;
  sonoSuave: string;
  consumo: string;
  consumoSuave: string;
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
  agua: '#2186c4',
  aguaSuave: '#e1f0fa',
  sono: '#5a5fc8',
  sonoSuave: '#e9e9fa',
  consumo: '#2e8a52',
  consumoSuave: '#e0f2e6',
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
  agua: '#5cb6ea',
  aguaSuave: '#163246',
  sono: '#9c9ff2',
  sonoSuave: '#25274a',
  consumo: '#63c98b',
  consumoSuave: '#173a26',
  sombra: '#000000',
};

export const TEMAS: Record<ModoTema, Cores> = { claro, escuro };

export type Modulo = 'agua' | 'sono' | 'consumo';

// Par de cores de um módulo: `forte` para ícones e barras, `suave` para o fundo do ícone.
export function coresDoModulo(c: Cores, modulo: Modulo): { forte: string; suave: string } {
  switch (modulo) {
    case 'agua':
      return { forte: c.agua, suave: c.aguaSuave };
    case 'sono':
      return { forte: c.sono, suave: c.sonoSuave };
    case 'consumo':
      return { forte: c.consumo, suave: c.consumoSuave };
  }
}

// Fonte da marca (título "Ciclo"). Carregada em src/app/_layout.tsx; o resto do app usa a fonte do sistema.
// Com fonte própria não se usa fontWeight: o peso já vem no arquivo (700 = negrito).
export const FONTE_MARCA = 'Comfortaa_700Bold';
