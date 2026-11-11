const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function formatarNumero(valor: number, casasDecimais = 0): string {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: casasDecimais });
}

export function formatarHoras(horas: number): string {
  const minutos = Math.round(horas * 60);
  const resto = minutos % 60;
  return resto === 0 ? `${Math.floor(minutos / 60)}h` : `${Math.floor(minutos / 60)}h ${resto}min`;
}

// 'AAAA-MM-DD' -> 'DD/MM'
export function formatarDiaMes(dataISO: string): string {
  const [, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}`;
}

// 'AAAA-MM-DD' -> 'seg'
export function diaDaSemana(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  return DIAS_SEMANA[new Date(ano, mes - 1, dia).getDay()];
}

// 11 -> 'nov'
export function nomeMes(mes: number): string {
  return MESES[mes - 1];
}

// Data de hoje por extenso: 'terça-feira, 11 de novembro'
export function dataDeHojePorExtenso(): string {
  const texto = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ---- Conversões entre Date e os textos guardados no banco ----

// Date -> 'HH:MM'
export function paraHorario(data: Date): string {
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}

// 'HH:MM' -> Date de hoje naquele horário (null se vazio)
export function deHorario(horario: string): Date | null {
  const partes = horario.match(/^(\d{2}):(\d{2})$/);
  if (!partes) return null;
  const d = new Date();
  d.setHours(Number(partes[1]), Number(partes[2]), 0, 0);
  return d;
}

// Date -> 'AAAA-MM-DD' (data local)
export function paraDataISO(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

// 'AAAA-MM-DD' -> Date local
export function deDataISO(dataISO: string): Date {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

// 'Hoje', 'Ontem' ou 'qui, 06/11'
export function formatarDiaRelativo(data: Date): string {
  const hoje = paraDataISO(new Date());
  const ontem = paraDataISO(new Date(Date.now() - 86_400_000));
  const iso = paraDataISO(data);
  if (iso === hoje) return `Hoje, ${formatarDiaMes(iso)}`;
  if (iso === ontem) return `Ontem, ${formatarDiaMes(iso)}`;
  return `${diaDaSemana(iso)}, ${formatarDiaMes(iso)}`;
}

// Date -> 'novembro de 2026'
export function formatarMesAno(data: Date): string {
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
