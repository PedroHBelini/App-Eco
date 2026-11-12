// Versão web de confirmar.ts: o Alert do React Native é vazio no navegador.
export function confirmar(titulo: string, mensagem: string, _textoConfirmar: string, aoConfirmar: () => void): void {
  if (window.confirm(`${titulo}\n\n${mensagem}`)) aoConfirmar();
}
