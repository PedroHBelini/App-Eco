// Leitura do que o usuário digita nos campos.

// '2000' -> 2000, '7,5' ou '7.5' -> 7.5. Qualquer outra coisa (vazio, '1e3', '-2', '7,5,1') -> NaN,
// que as funções validar* do repositório rejeitam. Number('') seria 0 e Number('1e3') seria 1000.
export function lerNumero(texto: string): number {
  const limpo = texto.trim();
  return /^\d+(?:[.,]\d+)?$/.test(limpo) ? Number(limpo.replace(',', '.')) : NaN;
}
