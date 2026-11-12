// Versão web de notificacoes.ts: sem notificações locais no navegador. Mesmas exportações,
// para quem importa não precisar saber em qual plataforma está.
import { TipoAlerta } from '../models/types';

export type EstadoPermissao = 'concedida' | 'pendente' | 'negada';

export async function configurarNotificacoes(): Promise<void> {}

export async function consultarPermissao(): Promise<EstadoPermissao> {
  return 'negada';
}

export async function pedirPermissao(): Promise<EstadoPermissao> {
  return 'negada';
}

export async function sincronizarLembretes(): Promise<void> {}

export function tipoDoLembrete(): TipoAlerta | null {
  return null;
}
