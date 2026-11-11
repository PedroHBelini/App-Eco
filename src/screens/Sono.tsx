import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import AvisoMedalha from '../components/AvisoMedalha';
import CampoDataHora from '../components/CampoDataHora';
import CampoTexto from '../components/CampoTexto';
import ModuloLayout, { useModuloStyles } from '../components/ModuloLayout';
import {
  buscarMetaSonoAtiva,
  calcularDuracaoSonoMinutos,
  definirMetaSono,
  listarRegistrosSono,
  registrarSono,
  validarMetaSono,
  atualizarGamificacao,
} from '../data/repository';
import { Medalha, Usuario } from '../models/types';
import {
  deDataISO,
  deHorario,
  formatarDiaMes,
  formatarDiaRelativo,
  formatarHoras,
  paraDataISO,
  paraHorario,
} from '../utils/formatacao';

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
  const [dataNoite, setDataNoite] = useState(() => paraDataISO(new Date()));
  const [feedback, setFeedback] = useState('');
  const [erro, setErro] = useState('');
  const [registros, setRegistros] = useState(() => listarRegistrosSono(usuario.idUsuario));

  const [meta, setMeta] = useState(() => buscarMetaSonoAtiva(usuario.idUsuario));
  const [metaHoras, setMetaHoras] = useState(meta ? String(meta.valorMeta).replace('.', ',') : '');
  const [erroMeta, setErroMeta] = useState('');
  const [feedbackMeta, setFeedbackMeta] = useState('');

  // Separados para o aviso aparecer junto do botão que causou a conquista.
  const [medalhasDoRegistro, setMedalhasDoRegistro] = useState<Medalha[]>([]);
  const [medalhasDaMeta, setMedalhasDaMeta] = useState<Medalha[]>([]);

  const ultimoRegistro = registros[0];

  function salvarRegistro() {
    if (!dormir || !acordar) {
      setErro('Escolha o horário em que dormiu e o horário em que acordou.');
      setFeedback('');
      return;
    }
    if (calcularDuracaoSonoMinutos(dormir, acordar) === null) {
      setErro('O período entre dormir e acordar deve ter até 18 horas.');
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
    setMedalhasDaMeta([]);
    setDormir('');
    setAcordar('');
    setDataNoite(paraDataISO(new Date()));
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
    setMedalhasDaMeta(atualizarGamificacao(usuario.idUsuario));
    setMedalhasDoRegistro([]);
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
        <Text style={styles.secaoTitulo}>Meta de sono</Text>
        {meta && ultimoRegistro ? (
          <Text style={[styles.texto, { marginBottom: 12 }]}>
            {ultimoRegistro.duracaoHoras >= meta.valorMeta
              ? `Última noite: meta de ${formatarHoras(meta.valorMeta)} atingida.`
              : `Última noite: faltaram ${formatarHoras(meta.valorMeta - ultimoRegistro.duracaoHoras)} para a meta.`}
          </Text>
        ) : null}
        <Text style={styles.rotulo}>Horas mínimas por noite</Text>
        <CampoTexto
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
        <AvisoMedalha medalhas={medalhasDaMeta} />
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
