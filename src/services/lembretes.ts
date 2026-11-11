import {
  buscarMetaHidratacaoAtiva,
  buscarUsuarioDaSessao,
  calcularProgresso,
  listarConfiguracoesAlerta,
  listarConsumos,
} from '../data/repository';
import { ConfiguracaoAlerta, FrequenciaAlerta, TipoAlerta } from '../models/types';
import { deDataISO, hojeISO, somarDias } from '../utils/datas';

// Decide QUAIS lembretes devem existir (sem nada de Expo, para ficar fácil de entender e testar).
// O agendamento de fato fica em notificacoes.ts.
//
// Em vez de lembretes repetitivos, cada ocorrência é agendada como um lembrete único nos próximos dias,
// e a lista é refeita sempre que os dados mudam ou o app volta para a tela. Assim dá para pular
// ocorrências que não fazem mais sentido — o "inteligente" do RF-04:
//   - hidratação: os lembretes que faltam no dia somem quando a meta do dia é batida;
//   - consumo: não avisa se a conta do mês já foi registrada.

export interface Lembrete {
  id: string; // estável (tipo + dia + horário), para comparar com o que já está agendado
  tipo: TipoAlerta;
  data: Date;
  titulo: string;
  corpo: string;
}

export const DIAS_AGENDADOS = 7;
export const FIM_LEMBRETES_HIDRATACAO = '21:00'; // último lembrete de água do dia, no máximo
export const DIA_LEMBRETE_CONSUMO = 10; // dia do mês do aviso da conta

const HORAS_DA_FREQUENCIA: Partial<Record<FrequenciaAlerta, number>> = {
  A_CADA_1_HORA: 1,
  A_CADA_2_HORAS: 2,
  A_CADA_3_HORAS: 3,
};

function emMinutos(horario: string): number {
  const [h, m] = horario.split(':').map(Number);
  return h * 60 + m;
}

function paraHHMM(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

function noDia(dataISO: string, minutos: number): Date {
  const d = deDataISO(dataISO);
  d.setHours(Math.floor(minutos / 60), minutos % 60, 0, 0);
  return d;
}

function lembrete(tipo: TipoAlerta, dataISO: string, minutos: number, titulo: string, corpo: string): Lembrete {
  return { id: `${tipo}-${dataISO}-${paraHHMM(minutos).replace(':', '')}`, tipo, data: noDia(dataISO, minutos), titulo, corpo };
}

// Horários de água em um dia: do primeiro horário até o fim, de N em N horas.
export function horariosHidratacao(config: Pick<ConfiguracaoAlerta, 'horario' | 'frequencia'>): string[] {
  const passo = (HORAS_DA_FREQUENCIA[config.frequencia] ?? 2) * 60;
  const inicio = emMinutos(config.horario);
  const fim = Math.max(emMinutos(FIM_LEMBRETES_HIDRATACAO), inicio);
  const horarios: string[] = [];
  for (let m = inicio; m <= fim; m += passo) horarios.push(paraHHMM(m));
  return horarios;
}

function lembretesHidratacao(idUsuario: string, config: ConfiguracaoAlerta, hoje: string): Lembrete[] {
  const temMeta = buscarMetaHidratacaoAtiva(idUsuario) !== undefined;
  const metaBatidaHoje = temMeta && calcularProgresso(idUsuario) >= 1;
  const lista: Lembrete[] = [];
  for (let d = 0; d < DIAS_AGENDADOS; d++) {
    const dia = somarDias(hoje, d);
    if (d === 0 && metaBatidaHoje) continue;
    for (const horario of horariosHidratacao(config)) {
      lista.push(lembrete('HIDRATACAO', dia, emMinutos(horario), 'Hora de beber água! 💧', 'Registre um copo e chegue mais perto da meta de hoje.'));
    }
  }
  return lista;
}

function lembretesSono(config: ConfiguracaoAlerta, hoje: string): Lembrete[] {
  return Array.from({ length: DIAS_AGENDADOS }, (_, d) =>
    lembrete('SONO', somarDias(hoje, d), emMinutos(config.horario), 'Prepare-se para dormir! 🌙', 'Desacelere e deixe as telas de lado para uma boa noite de sono.'),
  );
}

// A conta que chega no mês M costuma ser do mês M-1; quem registra pelo mês atual também conta.
function contaDoMesRegistrada(idUsuario: string, ano: number, mes: number): boolean {
  const anterior = mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
  const meses = [{ ano, mes }, anterior];
  const consumos = listarConsumos(idUsuario);
  return (['ENERGIA', 'AGUA_RESIDENCIAL'] as const).every((tipo) =>
    consumos.some(
      (c) => c.tipoRecurso === tipo && meses.some((m) => m.ano === c.anoReferencia && m.mes === c.mesReferencia),
    ),
  );
}

function lembretesConsumo(idUsuario: string, config: ConfiguracaoAlerta, agora: Date): Lembrete[] {
  // Este mês e o próximo; o que já passou é descartado depois.
  return [0, 1].flatMap((avanco) => {
    const ref = new Date(agora.getFullYear(), agora.getMonth() + avanco, 1);
    const ano = ref.getFullYear();
    const mes = ref.getMonth() + 1;
    if (contaDoMesRegistrada(idUsuario, ano, mes)) return [];
    const dia = `${ano}-${String(mes).padStart(2, '0')}-${String(DIA_LEMBRETE_CONSUMO).padStart(2, '0')}`;
    return [lembrete('CONSUMO', dia, emMinutos(config.horario), 'Chegou a conta do mês? ⚡', 'Registre o consumo de energia e água para acompanhar sua economia.')];
  });
}

// Lembretes do usuário da sessão a partir de agora. Sem sessão (perfil excluído), nenhum.
export function planejarLembretes(agora: Date = new Date()): Lembrete[] {
  const usuario = buscarUsuarioDaSessao();
  if (!usuario || !usuario.notificacoesHabilitadas) return [];
  const id = usuario.idUsuario;
  const hoje = hojeISO();

  const lista = listarConfiguracoesAlerta(id)
    .filter((config) => config.habilitado)
    .flatMap((config) => {
      switch (config.tipoAlerta) {
        case 'HIDRATACAO':
          return lembretesHidratacao(id, config, hoje);
        case 'SONO':
          return lembretesSono(config, hoje);
        case 'CONSUMO':
          return lembretesConsumo(id, config, agora);
      }
    });
  return lista.filter((l) => l.data.getTime() > agora.getTime());
}
