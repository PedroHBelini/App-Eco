// Conversões e contas com datas. Tudo no fuso do aparelho: toISOString() usaria UTC
// e viraria o dia às 21h no Brasil.
// Formatos guardados no banco: datas como 'AAAA-MM-DD' e horários como 'HH:MM'.

export const UM_DIA_MS = 86_400_000;

// Date -> 'AAAA-MM-DD'
export function paraDataISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// 'AAAA-MM-DD' -> Date à meia-noite local
export function deDataISO(dataISO: string): Date {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

export function hojeISO(): string {
  return paraDataISO(new Date());
}

export function ehDataISO(texto: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(texto);
}

// '2026-11-11' + 1 -> '2026-11-12'. Conta em dias do calendário, sem depender de 24h exatas.
export function somarDias(dataISO: string, dias: number): string {
  const d = deDataISO(dataISO);
  return paraDataISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias));
}

// Dias de `inicio` até `fim` (negativo se `fim` vier antes).
export function diasEntre(inicio: string, fim: string): number {
  return Math.round((deDataISO(fim).getTime() - deDataISO(inicio).getTime()) / UM_DIA_MS);
}

// Segunda-feira da semana da data.
export function inicioDaSemana(dataISO: string): string {
  const recuo = (deDataISO(dataISO).getDay() + 6) % 7; // segunda = 0 ... domingo = 6
  return somarDias(dataISO, -recuo);
}

// Os 7 dias (segunda a domingo) da semana da data.
export function datasDaSemana(dataISO: string): string[] {
  const segunda = inicioDaSemana(dataISO);
  return Array.from({ length: 7 }, (_, i) => somarDias(segunda, i));
}

// Todos os dias do mês da data, do dia 1 ao último.
export function datasDoMes(dataISO: string): string[] {
  const d = deDataISO(dataISO);
  const total = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return Array.from({ length: total }, (_, i) => paraDataISO(new Date(d.getFullYear(), d.getMonth(), i + 1)));
}

// Date -> 'HH:MM'
export function paraHorario(data: Date): string {
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}

// 'HH:MM' -> Date de hoje naquele horário (null se vazio ou inválido)
export function deHorario(horario: string): Date | null {
  const partes = horario.match(/^(\d{2}):(\d{2})$/);
  if (!partes) return null;
  const d = new Date();
  d.setHours(Number(partes[1]), Number(partes[2]), 0, 0);
  return d;
}
