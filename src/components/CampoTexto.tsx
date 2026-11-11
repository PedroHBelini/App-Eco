import React from 'react';
import { TextInput } from 'react-native';
import { useTema } from '../theme/TemaContext';
import { useModuloStyles } from './ModuloLayout';

// TextInput já com as cores do tema (placeholder e teclado escuro no modo escuro).
// Aceita `ref` (React 19 repassa como prop), para pular de um campo ao outro.
export default function CampoTexto({ style, ...props }: React.ComponentProps<typeof TextInput>) {
  const { cores, modo } = useTema();
  const styles = useModuloStyles();
  return (
    <TextInput
      placeholderTextColor={cores.textoSuave}
      keyboardAppearance={modo === 'escuro' ? 'dark' : 'light'}
      selectionColor={cores.primaria}
      style={[styles.input, style]}
      {...props}
    />
  );
}
