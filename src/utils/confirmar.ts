import { Alert } from 'react-native';

// Pede confirmação antes de uma ação destrutiva. Na web, confirmar.web.ts usa o diálogo do navegador
// (lá o Alert do React Native não faz nada).
export function confirmar(titulo: string, mensagem: string, textoConfirmar: string, aoConfirmar: () => void): void {
  Alert.alert(titulo, mensagem, [
    { text: 'Cancelar', style: 'cancel' },
    { text: textoConfirmar, style: 'destructive', onPress: aoConfirmar },
  ]);
}
