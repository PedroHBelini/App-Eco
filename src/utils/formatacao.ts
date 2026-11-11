import { deDataISO, hojeISO, paraDataISO, somarDias } from './datas';

// Textos para exibir na tela. Conversões e contas com datas ficam em datas.ts.
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
  return DIAS_SEMANA[deDataISO(dataISO).getDay()];
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

// 'Hoje', 'Ontem' ou 'qui, 06/11'
export function formatarDiaRelativo(data: Date): string {
  const hoje = hojeISO();
  const ontem = somarDias(hoje, -1);
  const iso = paraDataISO(data);
  if (iso === hoje) return `Hoje, ${formatarDiaMes(iso)}`;
  if (iso === ontem) return `Ontem, ${formatarDiaMes(iso)}`;
  return `${diaDaSemana(iso)}, ${formatarDiaMes(iso)}`;
}

// Date -> 'novembro de 2026'
export function formatarMesAno(data: Date): string {
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
