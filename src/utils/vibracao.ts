import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Retorno tátil dos registros. Na web não vibra (a vibração do navegador é inconsistente e pede permissão).
// Falhas são ignoradas: vibrar é um detalhe e nunca deve atrapalhar o registro.
function tentar(acao: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  acao().catch(() => {});
}

// Toque leve: registro salvo.
export function vibrarRegistro() {
  tentar(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

// Toque de comemoração: meta do dia batida ou medalha nova.
export function vibrarConquista() {
  tentar(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

// Escolhe o toque certo depois de um registro.
export function vibrarAposRegistro(comemorar: boolean) {
  if (comemorar) vibrarConquista();
  else vibrarRegistro();
}
