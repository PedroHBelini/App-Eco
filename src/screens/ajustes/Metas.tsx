import React, { useRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import CampoTexto from '../../components/CampoTexto';
import ModuloLayout, { useModuloStyles } from '../../components/ModuloLayout';
import {
  atualizarGamificacao,
  buscarMetaHidratacaoAtiva,
  buscarMetaSonoAtiva,
  definirMetaHidratacao,
  definirMetaSono,
  validarMetaHidratacao,
  validarMetaSono,
} from '../../data/repository';
import { Usuario } from '../../models/types';
import { lerNumero } from '../../utils/entrada';

type CampoRef = React.ComponentRef<typeof TextInput>;

export default function Metas({ usuario }: { usuario: Usuario }) {
  const styles = useModuloStyles();
  const [metaAgua, setMetaAgua] = useState(() => buscarMetaHidratacaoAtiva(usuario.idUsuario));
  const [metaSono, setMetaSono] = useState(() => buscarMetaSonoAtiva(usuario.idUsuario));
  const [valorAgua, setValorAgua] = useState(metaAgua ? String(metaAgua.valorMeta) : '');
  const [valorSono, setValorSono] = useState(metaSono ? String(metaSono.valorMeta).replace('.', ',') : '');
  const [erro, setErro] = useState('');
  const [feedback, setFeedback] = useState('');
  const sonoRef = useRef<CampoRef>(null);

  function salvar() {
    const ml = lerNumero(valorAgua);
    // A meta de sono é opcional: campo vazio = continuar sem meta.
    const textoSono = valorSono.trim();
    const horas = lerNumero(textoSono);
    const problema = validarMetaHidratacao(ml) ?? (textoSono ? validarMetaSono(horas) : null);
    if (problema) {
      setErro(problema);
      setFeedback('');
      return;
    }

    // Só grava o que mudou: cada meta nova encerra a anterior no histórico.
    if (ml !== metaAgua?.valorMeta) setMetaAgua(definirMetaHidratacao(usuario.idUsuario, ml));
    if (textoSono && horas !== metaSono?.valorMeta) setMetaSono(definirMetaSono(usuario.idUsuario, horas));
    atualizarGamificacao(usuario.idUsuario);
    setErro('');
    setFeedback('Metas salvas. Valem a partir de hoje.');
  }

  return (
    <ModuloLayout voltar titulo="Metas">
      <View style={styles.secao}>
        <Text style={styles.rotulo}>Hidratação diária (ml)</Text>
        <CampoTexto
          value={valorAgua}
          onChangeText={(v) => {
            setValorAgua(v);
            setFeedback('');
          }}
          placeholder="Ex.: 2000"
          keyboardType="number-pad"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => sonoRef.current?.focus()}
        />
        <Text style={styles.rotulo}>Sono por noite (horas)</Text>
        <CampoTexto
          value={valorSono}
          onChangeText={(v) => {
            setValorSono(v);
            setFeedback('');
          }}
          ref={sonoRef}
          placeholder="Ex.: 8"
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={salvar}
        />
        {erro ? <Text style={styles.erro} accessibilityRole="alert">{erro}</Text> : null}
        <TouchableOpacity style={styles.botao} onPress={salvar} accessibilityRole="button">
          <Text style={styles.botaoTexto}>Salvar metas</Text>
        </TouchableOpacity>
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      </View>
    </ModuloLayout>
  );
}
