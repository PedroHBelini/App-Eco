import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import AvisoMedalha from '../components/AvisoMedalha';
import CampoDataHora from '../components/CampoDataHora';
import ModuloLayout, { useModuloStyles } from '../components/ModuloLayout';
import {
  buscarMetaSonoAtiva,
  listarRegistrosSono,
  registrarSono,
  validarSono,
  atualizarGamificacao,
} from '../data/repository';
import { Medalha, Usuario } from '../models/types';
import { useTema } from '../theme/TemaContext';
import { deDataISO, deHorario, hojeISO, paraDataISO, paraHorario } from '../utils/datas';
import { formatarDiaMes, formatarDiaRelativo, formatarHoras } from '../utils/formatacao';

interface Props {
  usuario: Usuario;
}

const REGISTROS_NO_HISTORICO = 7;

// Valores que o seletor mostra ao abrir pela primeira vez.
function horarioInicial(horas: number, minutos: number) {
  const d = new Date();
  d.setHours(horas, minutos, 0, 0);
  return d;
}

export default function Sono({ usuario }: Props) {
  const styles = useModuloStyles();
  const [dormir, setDormir] = useState('');
  const [acordar, setAcordar] = useState('');
  // Dia em que acordou; por padrão hoje, mas dá para lançar uma noite anterior.
  const [dataNoite, setDataNoite] = useState(hojeISO);
  const [feedback, setFeedback] = useState('');
  const [erro, setErro] = useState('');
  const [registros, setRegistros] = useState(() => listarRegistrosSono(usuario.idUsuario));

  const [medalhasDoRegistro, setMedalhasDoRegistro] = useState<Medalha[]>([]);
  // A meta é definida em Ajustes; aqui só é lida para comparar com a última noite.
  const meta = buscarMetaSonoAtiva(usuario.idUsuario);
  const { cores } = useTema();

  const ultimoRegistro = registros[0];

  function salvarRegistro() {
    const problema = validarSono(dormir, acordar, dataNoite);
    if (problema) {
      setErro(problema);
      setFeedback('');
      return;
    }
    const jaExistia = registros.some((r) => r.dataReferencia === dataNoite);
    const registro = registrarSono(usuario.idUsuario, dormir, acordar, dataNoite);
    setRegistros(listarRegistrosSono(usuario.idUsuario));
    setErro('');
    setFeedback(
      `${jaExistia ? 'Noite atualizada' : 'Noite registrada'} (${formatarDiaRelativo(deDataISO(dataNoite))}): ${formatarHoras(registro.duracaoHoras)}`,
    );
    setMedalhasDoRegistro(atualizarGamificacao(usuario.idUsuario));
    setDormir('');
    setAcordar('');
    setDataNoite(hojeISO());
  }

  return (
    <ModuloLayout voltar titulo="Sono" descricao="Registre seus horários e acompanhe a duração do descanso.">
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Registrar uma noite</Text>
        <Text style={styles.rotulo}>Dia em que acordou</Text>
        <CampoDataHora
          modo="date"
          valor={deDataISO(dataNoite)}
          valorInicial={new Date()}
          maximumDate={new Date()}
          onChange={(d) => setDataNoite(paraDataISO(d))}
          formatar={formatarDiaRelativo}
          placeholder="Escolher dia"
          rotuloAcessivel="Dia em que acordou"
        />
        <Text style={styles.rotulo}>Horário em que dormiu</Text>
        <CampoDataHora
          modo="time"
          valor={deHorario(dormir)}
          valorInicial={horarioInicial(23, 0)}
          onChange={(d) => setDormir(paraHorario(d))}
          formatar={paraHorario}
          placeholder="Escolher horário"
          rotuloAcessivel="Horário em que dormiu"
        />
        <Text style={styles.rotulo}>Horário em que acordou</Text>
        <CampoDataHora
          modo="time"
          valor={deHorario(acordar)}
          valorInicial={horarioInicial(7, 0)}
          onChange={(d) => setAcordar(paraHorario(d))}
          formatar={paraHorario}
          placeholder="Escolher horário"
          rotuloAcessivel="Horário em que acordou"
        />
        {erro ? <Text style={styles.erro} accessibilityRole="alert">{erro}</Text> : null}
        <TouchableOpacity accessibilityRole="button" onPress={salvarRegistro} style={styles.botao}>
          <Text style={styles.botaoTexto}>Salvar registro</Text>
        </TouchableOpacity>
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        <AvisoMedalha medalhas={medalhasDoRegistro} />
      </View>

      <View style={styles.secao}>
        <View style={styles.linha}>
          <Text style={styles.secaoTitulo}>Meta de sono</Text>
          <Text style={styles.valor}>{meta ? `${formatarHoras(meta.valorMeta)} por noite` : 'não definida'}</Text>
        </View>
        {meta && ultimoRegistro ? (
          <Text style={styles.texto}>
            {ultimoRegistro.duracaoHoras >= meta.valorMeta
              ? `Última noite (${formatarDiaMes(ultimoRegistro.dataReferencia)}): meta atingida.`
              : `Última noite (${formatarDiaMes(ultimoRegistro.dataReferencia)}): faltaram ${formatarHoras(meta.valorMeta - ultimoRegistro.duracaoHoras)} para a meta.`}
          </Text>
        ) : null}
        {!meta ? (
          <Text style={styles.texto}>Defina uma meta para acompanhar suas noites e participar dos desafios de sono.</Text>
        ) : null}
        <Pressable
          onPress={() => router.navigate('/ajustes')}
          style={({ pressed }) => [styles.linha, { justifyContent: 'flex-start', gap: 4, marginTop: 12 }, pressed && { opacity: 0.6 }]}
          accessibilityRole="link"
          accessibilityLabel={meta ? 'Alterar a meta de sono em Ajustes' : 'Definir a meta de sono em Ajustes'}
          hitSlop={8}
        >
          <Text style={[styles.valor, { color: cores.primaria }]}>{meta ? 'Alterar em Ajustes' : 'Definir em Ajustes'}</Text>
          <Ionicons name="chevron-forward" size={16} color={cores.primaria} />
        </Pressable>
      </View>

      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Últimas noites</Text>
        {registros.length === 0 ? (
          <Text style={styles.texto}>Seus registros de sono aparecerão aqui.</Text>
        ) : (
          registros.slice(0, REGISTROS_NO_HISTORICO).map((item, index) => (
            <View key={item.idSono} style={[styles.linha, index > 0 && styles.separador]}>
              <Text style={styles.texto}>
                {formatarDiaMes(item.dataReferencia)} · {item.horarioDormir}–{item.horarioAcordar}
              </Text>
              <Text style={styles.valor}>{formatarHoras(item.duracaoHoras)}</Text>
            </View>
          ))
        )}
      </View>
    </ModuloLayout>
  );
}
