import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';
import { TipoAlerta } from '../models/types';
import { planejarLembretes } from './lembretes';

// Ponte com o expo-notifications: permissão, canal do Android e agendamento local (sem servidor).

const CANAL = 'lembretes';

export type EstadoPermissao = 'concedida' | 'pendente' | 'negada';

let configuracao: Promise<void> | null = null;

// Idempotente. No Android 13+ o pedido de permissão só aparece depois que existe um canal.
export function configurarNotificacoes(): Promise<void> {
  configuracao ??= (async () => {
    Notifications.setNotificationHandler({
      // Com o app aberto o lembrete também aparece (no Android, sem som não há banner).
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CANAL, {
        name: 'Lembretes',
        description: 'Lembretes de hidratação, sono e consumo',
        importance: AndroidImportance.HIGH,
      });
    }
  })().catch((erro) => {
    console.warn('Não foi possível configurar as notificações.', erro);
  });
  return configuracao;
}

function paraEstado(resposta: Notifications.NotificationPermissionsStatus): EstadoPermissao {
  const provisoria = resposta.ios?.status === IosAuthorizationStatus.PROVISIONAL;
  if (resposta.granted || provisoria) return 'concedida';
  return resposta.status === 'undetermined' ? 'pendente' : 'negada';
}

export async function consultarPermissao(): Promise<EstadoPermissao> {
  try {
    return paraEstado(await Notifications.getPermissionsAsync());
  } catch {
    return 'negada';
  }
}

// Mostra o pedido do sistema. Se o usuário já recusou de vez, volta 'negada' sem mostrar nada.
export async function pedirPermissao(): Promise<EstadoPermissao> {
  await configurarNotificacoes();
  try {
    return paraEstado(await Notifications.requestPermissionsAsync());
  } catch {
    return 'negada';
  }
}

let fila: Promise<void> = Promise.resolve();

// Deixa agendado exatamente o que planejarLembretes() pede: cancela o que sobrou e agenda o que falta.
// Enfileirado para duas sincronizações nunca se misturarem.
export function sincronizarLembretes(): Promise<void> {
  fila = fila
    .then(async () => {
      await configurarNotificacoes();
      const agendados = await Notifications.getAllScheduledNotificationsAsync();
      const permitido = (await consultarPermissao()) === 'concedida';
      const planejados = permitido ? planejarLembretes() : [];
      const idsPlanejados = new Set(planejados.map((l) => l.id));
      const idsAgendados = new Set(agendados.map((n) => n.identifier));

      for (const notificacao of agendados) {
        if (!idsPlanejados.has(notificacao.identifier)) {
          await Notifications.cancelScheduledNotificationAsync(notificacao.identifier);
        }
      }
      for (const l of planejados) {
        if (idsAgendados.has(l.id)) continue;
        await Notifications.scheduleNotificationAsync({
          identifier: l.id,
          content: { title: l.titulo, body: l.corpo, data: { tipo: l.tipo } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: l.data, channelId: CANAL },
        });
      }
    })
    .catch((erro) => {
      console.warn('Não foi possível agendar os lembretes.', erro);
    });
  return fila;
}

// Tipo do lembrete tocado pelo usuário, para abrir a tela certa.
export function tipoDoLembrete(resposta: Notifications.NotificationResponse): TipoAlerta | null {
  if (resposta.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return null;
  const tipo = resposta.notification.request.content.data?.tipo;
  return tipo === 'HIDRATACAO' || tipo === 'SONO' || tipo === 'CONSUMO' ? tipo : null;
}
