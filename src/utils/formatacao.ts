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
