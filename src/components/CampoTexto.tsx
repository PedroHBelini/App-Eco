import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useTema } from '../theme/TemaContext';
import { useModuloStyles } from './ModuloLayout';

// TextInput já com as cores do tema (placeholder e teclado escuro no modo escuro).
export default function CampoTexto({ style, ...props }: TextInputProps) {
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
