import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ModuloLayout, { moduloStyles as styles } from '../components/ModuloLayout';
import {
  buscarMetaSonoAtiva,
  calcularDuracaoSonoMinutos,
  definirMetaSono,
  listarRegistrosSono,
  registrarSono,
  validarMetaSono,
} from '../data/repository';
import { Usuario } from '../models/types';

interface Props {
  usuario: Usuario;
}

const REGISTROS_NO_HISTORICO = 7;

function formatarHoras(horas: number): string {
  const minutos = Math.round(horas * 60);
  const resto = minutos % 60;
  return resto === 0 ? `${Math.floor(minutos / 60)}h` : `${Math.floor(minutos / 60)}h ${resto}min`;
}

function formatarData(dataISO: string): string {
  const [, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}`;
}

export default function Sono({ usuario }: Props) {
  const [dormir, setDormir] = useState('');
  const [acordar, setAcordar] = useState('');
  const [feedback, setFeedback] = useState('');
  const [erro, setErro] = useState('');
  const [registros, setRegistros] = useState(() => listarRegistrosSono(usuario.idUsuario));

  const [meta, setMeta] = useState(() => buscarMetaSonoAtiva(usuario.idUsuario));
  const [metaHoras, setMetaHoras] = useState(meta ? String(meta.valorMeta).replace('.', ',') : '');
  const [erroMeta, setErroMeta] = useState('');
  const [feedbackMeta, setFeedbackMeta] = useState('');

  const ultimoRegistro = registros[0];

  function salvarRegistro() {
    if (calcularDuracaoSonoMinutos(dormir, acordar) === null) {
      setErro('Informe horários válidos no formato HH:MM e um período de até 18 horas.');
      setFeedback('');
      return;
    }
    const registro = registrarSono(usuario.idUsuario, dormir, acordar);
    setRegistros(listarRegistrosSono(usuario.idUsuario));
    setErro('');
    setFeedback(`Duração registrada: ${formatarHoras(registro.duracaoHoras)}`);
    setDormir('');
    setAcordar('');
  }

  function salvarMeta() {
    const entrada = metaHoras.trim();
    const horas = Number(entrada.replace(',', '.'));
    if (!/^\d+(?:[.,]\d+)?$/.test(entrada) || !validarMetaSono(horas)) {
      setErroMeta('Informe uma meta entre 0 e 18 horas, como 8 ou 7,5.');
      setFeedbackMeta('');
      return;
    }
    setMeta(definirMetaSono(usuario.idUsuario, horas));
    setErroMeta('');
    setFeedbackMeta('Meta salva.');
  }

  return (
    <ModuloLayout titulo="Sono" descricao="Registre seus horários e acompanhe a duração do descanso.">
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Registro da última noite</Text>
        <Text style={styles.rotulo}>Horário em que dormiu</Text>
        <TextInput style={styles.input} placeholder="22:30" value={dormir} onChangeText={setDormir} keyboardType="numbers-and-punctuation" />
        <Text style={styles.rotulo}>Horário em que acordou</Text>
        <TextInput style={styles.input} placeholder="06:30" value={acordar} onChangeText={setAcordar} keyboardType="numbers-and-punctuation" />
        {erro ? <Text style={styles.erro} accessibilityRole="alert">{erro}</Text> : null}
        <TouchableOpacity accessibilityRole="button" onPress={salvarRegistro} style={styles.botao}>
          <Text style={styles.botaoTexto}>Salvar registro</Text>
        </TouchableOpacity>
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      </View>

      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Meta de sono</Text>
        {meta && ultimoRegistro ? (
          <Text style={[styles.texto, { marginBottom: 12 }]}>
            {ultimoRegistro.duracaoHoras >= meta.valorMeta
              ? `Última noite: meta de ${formatarHoras(meta.valorMeta)} atingida.`
              : `Última noite: faltaram ${formatarHoras(meta.valorMeta - ultimoRegistro.duracaoHoras)} para a meta.`}
          </Text>
        ) : null}
        <Text style={styles.rotulo}>Horas mínimas por noite</Text>
        <TextInput
          style={styles.input}
          placeholder="8"
          value={metaHoras}
          onChangeText={(valor) => {
            setMetaHoras(valor);
            setFeedbackMeta('');
          }}
          keyboardType="decimal-pad"
        />
        {erroMeta ? <Text style={styles.erro} accessibilityRole="alert">{erroMeta}</Text> : null}
        <TouchableOpacity accessibilityRole="button" onPress={salvarMeta} style={styles.botao}>
          <Text style={styles.botaoTexto}>{meta ? 'Atualizar meta' : 'Definir meta'}</Text>
        </TouchableOpacity>
        {feedbackMeta ? <Text style={styles.feedback}>{feedbackMeta}</Text> : null}
      </View>

      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Últimas noites</Text>
        {registros.length === 0 ? (
          <Text style={styles.texto}>Seus registros de sono aparecerão aqui.</Text>
        ) : (
          registros.slice(0, REGISTROS_NO_HISTORICO).map((item, index) => (
            <View key={item.idSono} style={[styles.linha, index > 0 && styles.separador]}>
              <Text style={styles.texto}>
                {formatarData(item.dataReferencia)} · {item.horarioDormir}–{item.horarioAcordar}
              </Text>
              <Text style={styles.valor}>{formatarHoras(item.duracaoHoras)}</Text>
            </View>
          ))
        )}
      </View>
    </ModuloLayout>
  );
}
