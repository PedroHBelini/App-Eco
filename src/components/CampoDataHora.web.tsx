import React from 'react';
import { View } from 'react-native';
import { useTema } from '../theme/TemaContext';
import { deDataISO, deHorario, paraDataISO, paraHorario } from '../utils/datas';
import { useModuloStyles } from './ModuloLayout';

// Versão web do CampoDataHora: o seletor nativo (datetimepicker) não existe no navegador,
// então usa os campos do próprio navegador (<input type="time"> e <input type="date">).
// Mesmas props da versão nativa, para as telas não precisarem saber em qual plataforma estão.
interface Props {
  modo: 'time' | 'date';
  valor: Date | null;
  valorInicial: Date;
  onChange: (valor: Date) => void;
  formatar: (valor: Date) => string;
  placeholder: string;
  rotuloAcessivel: string;
  maximumDate?: Date;
}

export default function CampoDataHora({ modo, valor, onChange, rotuloAcessivel, maximumDate }: Props) {
  const modulo = useModuloStyles();
  const { cores, modo: tema } = useTema();
  const paraTexto = modo === 'time' ? paraHorario : paraDataISO;
  const maximo = maximumDate && modo === 'date' ? paraDataISO(maximumDate) : undefined;

  function aoMudar(texto: string) {
    if (!texto) return; // campo apagado: mantém o valor anterior
    if (maximo && texto > maximo) return; // digitado à mão além do limite
    const data = modo === 'time' ? deHorario(texto) : deDataISO(texto);
    if (data) onChange(data);
  }

  return (
    <View style={modulo.input}>
      <input
        type={modo}
        value={valor ? paraTexto(valor) : ''}
        max={maximo}
        aria-label={rotuloAcessivel}
        onChange={(evento) => aoMudar(evento.currentTarget.value)}
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          padding: 0,
          width: '100%',
          fontSize: 15,
          fontFamily: 'inherit',
          color: cores.texto,
          // Deixa o ícone e o calendário do navegador no tema certo.
          colorScheme: tema === 'escuro' ? 'dark' : 'light',
        }}
      />
    </View>
  );
}
