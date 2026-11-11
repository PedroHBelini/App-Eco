import * as Notifications from 'expo-notifications';
import { Href, router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { aoAlterarDados, buscarUsuarioDaSessao, listarConfiguracoesAlerta } from '../data/repository';
import { TipoAlerta } from '../models/types';
import { configurarNotificacoes, consultarPermissao, pedirPermissao, sincronizarLembretes, tipoDoLembrete } from '../services/notificacoes';

const TELA_DO_LEMBRETE: Record<TipoAlerta, Href> = {
  HIDRATACAO: '/hidratacao',
  SONO: '/sono',
  CONSUMO: '/consumo',
};

// Espera os dados pararem de mudar antes de reagendar (um registro pode gerar várias gravações).
const ESPERA_MS = 1000;

// Usado no layout das abas, que só existe com um usuário logado.
export function useLembretes() {
  // Mantém os lembretes agendados de acordo com os dados.
  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const reagendar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(sincronizarLembretes, ESPERA_MS);
    };

    (async () => {
      await configurarNotificacoes();
      // Primeiro uso com algum alerta ligado: pede a permissão uma vez. Depois, só pelos Ajustes.
      const usuario = buscarUsuarioDaSessao();
      const algumLigado = usuario && listarConfiguracoesAlerta(usuario.idUsuario).some((c) => c.habilitado);
      if (algumLigado && (await consultarPermissao()) === 'pendente') await pedirPermissao();
      sincronizarLembretes();
    })();

    const pararDeOuvir = aoAlterarDados(reagendar);
    // Ao voltar para o app: os 7 dias agendados andam junto com o calendário, e a permissão pode ter mudado.
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') reagendar();
    });

    return () => {
      clearTimeout(temporizador);
      pararDeOuvir();
      assinatura.remove();
      // Saiu das abas = perfil excluído: sem sessão, a sincronização cancela todos os lembretes.
      sincronizarLembretes();
    };
  }, []);

  // Tocar no lembrete abre a tela de registro correspondente (também com o app fechado).
  const resposta = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!resposta) return;
    const tipo = tipoDoLembrete(resposta);
    if (tipo) router.push(TELA_DO_LEMBRETE[tipo]);
    Notifications.clearLastNotificationResponseAsync().catch(() => {});
  }, [resposta]);
}
