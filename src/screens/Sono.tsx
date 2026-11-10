import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ModuloLayout, { moduloStyles as styles } from '../components/ModuloLayout';

function calcularDuracao(dormir: string, acordar: string): string | null {
  const formato = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const inicio = dormir.match(formato);
  const fim = acordar.match(formato);
  if (!inicio || !fim) return null;

  const minutosInicio = Number(inicio[1]) * 60 + Number(inicio[2]);
  let minutosFim = Number(fim[1]) * 60 + Number(fim[2]);
  if (minutosFim <= minutosInicio) minutosFim += 24 * 60;
  const duracao = minutosFim - minutosInicio;
  if (duracao > 18 * 60) return null;
  return `${Math.floor(duracao / 60)}h ${duracao % 60}min`;
}

export default function Sono() {
  const [dormir, setDormir] = useState('');
  const [acordar, setAcordar] = useState('');
  const [registro, setRegistro] = useState('');
  const [erro, setErro] = useState('');

  function salvarRegistro() {
    const duracao = calcularDuracao(dormir, acordar);
    if (!duracao) {
      setErro('Informe horários válidos no formato HH:MM e um período de até 18 horas.');
      setRegistro('');
      return;
    }
    setErro('');
    setRegistro(`Duração registrada: ${duracao}`);
  }

  return (
    <ModuloLayout titulo="Sono" descricao="Registre seus horários e acompanhe a duração do descanso.">
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Registro da última noite</Text>
        <Text style={styles.rotulo}>Horário em que dormiu</Text>
        <TextInput style={styles.input} placeholder="22:30" value={dormir} onChangeText={setDormir} keyboardType="numbers-and-punctuation" />
        <Text style={styles.rotulo}>Horário em que acordou</Text>
        <TextInput style={styles.input} placeholder="06:30" value={acordar} onChangeText={setAcordar} keyboardType="numbers-and-punctuation" />
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}
        <TouchableOpacity accessibilityRole="button" onPress={salvarRegistro} style={styles.botao}>
          <Text style={styles.botaoTexto}>Salvar registro</Text>
        </TouchableOpacity>
        {registro ? <Text style={styles.feedback}>{registro}</Text> : null}
      </View>
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Meta de sono</Text>
        <Text style={styles.texto}>Definir e acompanhar uma meta de horas por noite será conectado ao perfil e ao histórico em uma próxima etapa.</Text>
      </View>
    </ModuloLayout>
  );
}