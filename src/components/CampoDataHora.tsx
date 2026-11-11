import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Cores } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';
import { useModuloStyles } from './ModuloLayout';

interface Props {
  modo: 'time' | 'date';
  valor: Date | null;
  valorInicial: Date; // o que o seletor mostra ao abrir quando ainda não há valor
  onChange: (valor: Date) => void;
  formatar: (valor: Date) => string;
  placeholder: string;
  rotuloAcessivel: string;
  maximumDate?: Date;
}

// Campo que abre o seletor nativo: diálogo no Android, roda (spinner) logo abaixo do campo no iOS.
export default function CampoDataHora({
  modo,
  valor,
  valorInicial,
  onChange,
  formatar,
  placeholder,
  rotuloAcessivel,
  maximumDate,
}: Props) {
  const modulo = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  const { cores, modo: tema } = useTema();
  const [abertoNoIOS, setAbertoNoIOS] = useState(false);

  function abrir() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: valor ?? valorInicial,
        mode: modo,
        is24Hour: true,
        maximumDate,
        onValueChange: (_evento, selecionado) => onChange(selecionado),
      });
      return;
    }
    // No iOS a roda já mostra um valor; sem isso, quem não girar a roda ficaria com o campo vazio.
    if (!abertoNoIOS && !valor) onChange(valorInicial);
    setAbertoNoIOS((aberto) => !aberto);
  }

  return (
    <>
      <Pressable
        onPress={abrir}
        style={({ pressed }) => [modulo.input, estilos.campo, pressed && estilos.pressionado]}
        accessibilityRole="button"
        accessibilityLabel={`${rotuloAcessivel}: ${valor ? formatar(valor) : 'não definido'}`}
      >
        <Text style={valor ? estilos.valor : estilos.placeholder}>{valor ? formatar(valor) : placeholder}</Text>
        <Ionicons name={modo === 'time' ? 'time-outline' : 'calendar-outline'} size={20} color={cores.primaria} />
      </Pressable>

      {Platform.OS === 'ios' && abertoNoIOS ? (
        <View style={estilos.caixaIOS}>
          <DateTimePicker
            value={valor ?? valorInicial}
            mode={modo}
            display="spinner"
            maximumDate={maximumDate}
            themeVariant={tema === 'escuro' ? 'dark' : 'light'}
            textColor={cores.texto}
            onValueChange={(_evento, selecionado) => onChange(selecionado)}
          />
          <Pressable onPress={() => setAbertoNoIOS(false)} style={estilos.concluir} accessibilityRole="button">
            <Text style={estilos.concluirTexto}>Concluir</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    campo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pressionado: { opacity: 0.7 },
    valor: { color: c.texto, fontSize: 15 },
    placeholder: { color: c.textoSuave, fontSize: 15 },
    caixaIOS: { backgroundColor: c.superficieSuave, borderRadius: 10, marginTop: -4, marginBottom: 12 },
    concluir: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 10 },
    concluirTexto: { color: c.primaria, fontSize: 15, fontWeight: '700' },
  });
}
