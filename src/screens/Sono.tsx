import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AvisoMedalha from '../components/AvisoMedalha';
import CampoDataHora from '../components/CampoDataHora';
import EstadoVazio from '../components/EstadoVazio';
import ModuloLayout, { useModuloStyles } from '../components/ModuloLayout';
import {
  buscarMetaSonoAtiva,
  listarRegistrosSono,
  registrarSono,
  validarSono,
  atualizarGamificacao,
} from '../data/repository';
import { Medalha, Usuario } from '../models/types';
import { Cores } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';
import { deDataISO, deHorario, hojeISO, paraDataISO, paraHorario } from '../utils/datas';
import { diaDaSemana, formatarDiaMes, formatarDiaRelativo, formatarHoras } from '../utils/formatacao';
import { vibrarAposRegistro } from '../utils/vibracao';

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
  const estilos = useEstilos(criarEstilos);
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
    const medalhas = atualizarGamificacao(usuario.idUsuario);
    setMedalhasDoRegistro(medalhas);
    vibrarAposRegistro(medalhas.length > 0 || (meta !== undefined && registro.duracaoHoras >= meta.valorMeta));
    setDormir('');
    setAcordar('');
    setDataNoite(hojeISO());
  }

  return (
    <ModuloLayout voltar titulo="Sono">
      <View style={styles.secao}>
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
        <View style={estilos.horarios}>
          <View style={estilos.horario}>
            <Text style={styles.rotulo}>Dormiu</Text>
            <CampoDataHora
              modo="time"
              valor={deHorario(dormir)}
              valorInicial={horarioInicial(23, 0)}
              onChange={(d) => setDormir(paraHorario(d))}
              formatar={paraHorario}
              placeholder="--:--"
              rotuloAcessivel="Horário em que dormiu"
            />
          </View>
          <View style={estilos.horario}>
            <Text style={styles.rotulo}>Acordou</Text>
            <CampoDataHora
              modo="time"
              valor={deHorario(acordar)}
              valorInicial={horarioInicial(7, 0)}
              onChange={(d) => setAcordar(paraHorario(d))}
              formatar={paraHorario}
              placeholder="--:--"
              rotuloAcessivel="Horário em que acordou"
            />
          </View>
        </View>
        {erro ? <Text style={styles.erro} accessibilityRole="alert">{erro}</Text> : null}
        <TouchableOpacity accessibilityRole="button" onPress={salvarRegistro} style={styles.botao}>
          <Text style={styles.botaoTexto}>Registrar</Text>
        </TouchableOpacity>
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        <AvisoMedalha medalhas={medalhasDoRegistro} />
      </View>

      <View style={styles.secao}>
        <View style={[styles.linha, estilos.cabecalho]}>
          <Text style={[styles.secaoTitulo, estilos.semMargem]}>Últimas noites</Text>
          {/* A meta é definida em Ajustes; tocar aqui leva direto para lá. */}
          <Pressable
            onPress={() => router.push('/ajustes/metas')}
            style={({ pressed }) => [estilos.meta, pressed && estilos.pressionado]}
            accessibilityRole="link"
            accessibilityLabel={meta ? `Meta de ${formatarHoras(meta.valorMeta)} por noite. Alterar.` : 'Definir meta de sono'}
            hitSlop={8}
          >
            <Ionicons name="flag-outline" size={14} color={cores.primaria} />
            <Text style={estilos.metaTexto}>{meta ? `meta ${formatarHoras(meta.valorMeta)}` : 'definir meta'}</Text>
          </Pressable>
        </View>
        {registros.length === 0 ? (
          <EstadoVazio icone="moon-outline" texto="Seus registros de sono aparecerão aqui." />
        ) : (
          registros.slice(0, REGISTROS_NO_HISTORICO).map((item, index) => {
            const naMeta = meta !== undefined && item.duracaoHoras >= meta.valorMeta;
            return (
              <View
                key={item.idSono}
                style={[styles.linha, index > 0 && styles.separador]}
                accessible
                accessibilityLabel={`${formatarDiaMes(item.dataReferencia)}: ${formatarHoras(item.duracaoHoras)}, das ${item.horarioDormir} às ${item.horarioAcordar}${naMeta ? ', meta atingida' : ''}.`}
              >
                <View style={estilos.noite}>
                  <Text style={styles.valor}>
                    {diaDaSemana(item.dataReferencia)}, {formatarDiaMes(item.dataReferencia)}
                  </Text>
                  <Text style={styles.estado}>
                    {item.horarioDormir} – {item.horarioAcordar}
                  </Text>
                </View>
                <Text style={[styles.valor, naMeta && { color: cores.sono }]}>{formatarHoras(item.duracaoHoras)}</Text>
                {meta ? (
                  <Ionicons
                    name={naMeta ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={naMeta ? cores.sono : cores.borda}
                  />
                ) : null}
              </View>
            );
          })
        )}
      </View>
    </ModuloLayout>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    horarios: { flexDirection: 'row', gap: 12 },
    horario: { flex: 1 },
    cabecalho: { marginBottom: 10 },
    semMargem: { marginBottom: 0 },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.primariaSuave,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    metaTexto: { color: c.primaria, fontSize: 12, fontWeight: '700' },
    pressionado: { opacity: 0.6 },
    noite: { flex: 1 },
  });
}
