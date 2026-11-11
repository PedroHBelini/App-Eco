import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import CampoTexto from '../components/CampoTexto';
import ModuloLayout, { useModuloStyles } from '../components/ModuloLayout';
import { useUsuario } from '../context/UsuarioContext';
import { useAtualizarAoFocar } from '../hooks/useAtualizarAoFocar';
import {
  atualizarGamificacao,
  atualizarPerfil,
  buscarMetaHidratacaoAtiva,
  buscarMetaSonoAtiva,
  definirAlertaHabilitado,
  definirMetaHidratacao,
  definirMetaSono,
  excluirUsuario,
  listarConfiguracoesAlerta,
  validarDadosPerfil,
  validarMetaSono,
} from '../data/repository';
import { TipoAlerta, Usuario } from '../models/types';
import { Cores } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';
import { formatarHoras, formatarNumero } from '../utils/formatacao';

interface Props {
  usuario: Usuario;
}

type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];

const TEXTOS_ALERTA: Record<TipoAlerta, { titulo: string; descricao: string; icone: NomeIcone }> = {
  HIDRATACAO: { titulo: 'Hidratação', descricao: 'Lembretes para beber água', icone: 'water-outline' },
  SONO: { titulo: 'Sono', descricao: 'Lembretes para sua rotina de descanso', icone: 'moon-outline' },
  CONSUMO: { titulo: 'Consumo', descricao: 'Avisos para atualizar os dados da conta', icone: 'flash-outline' },
};

function LinhaComIcone({ icone, titulo, descricao, children }: {
  icone: NomeIcone;
  titulo: string;
  descricao: string;
  children?: React.ReactNode;
}) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  const { cores } = useTema();
  return (
    <View style={styles.linha}>
      <View style={estilos.icone}>
        <Ionicons name={icone} size={20} color={cores.primaria} />
      </View>
      <View style={styles.alertaTexto}>
        <Text style={styles.valor}>{titulo}</Text>
        <Text style={styles.texto}>{descricao}</Text>
      </View>
      {children}
    </View>
  );
}

function SecaoPerfil({ usuario }: Props) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  const { cores } = useTema();
  const { setUsuario } = useUsuario();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(usuario.nome);
  const [nickname, setNickname] = useState(usuario.nickname);
  const [email, setEmail] = useState(usuario.email);
  const [erro, setErro] = useState('');

  function abrirEdicao() {
    setNome(usuario.nome);
    setNickname(usuario.nickname);
    setEmail(usuario.email);
    setErro('');
    setEditando(true);
  }

  function salvar() {
    const dados = { nome, nickname, email };
    const problema = validarDadosPerfil(dados, usuario.idUsuario);
    if (problema) {
      setErro(problema);
      return;
    }
    setUsuario(atualizarPerfil(usuario.idUsuario, dados));
    setEditando(false);
  }

  return (
    <View style={styles.secao}>
      <View style={estilos.perfil}>
        <View style={estilos.avatar}>
          <Text style={estilos.avatarTexto}>{usuario.nickname.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.alertaTexto}>
          <Text style={styles.secaoTitulo}>{usuario.nome}</Text>
          <Text style={styles.texto}>@{usuario.nickname}</Text>
          <Text style={styles.texto}>{usuario.email}</Text>
        </View>
        {!editando ? (
          <Pressable
            onPress={abrirEdicao}
            style={estilos.botaoIcone}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
          >
            <Ionicons name="create-outline" size={20} color={cores.primaria} />
          </Pressable>
        ) : null}
      </View>

      {editando ? (
        <View style={estilos.formulario}>
          <Text style={styles.rotulo}>Nome</Text>
          <CampoTexto value={nome} onChangeText={setNome} placeholder="Nome" />
          <Text style={styles.rotulo}>Nickname (exibido nos rankings)</Text>
          <CampoTexto value={nickname} onChangeText={setNickname} placeholder="Nickname" autoCapitalize="none" />
          <Text style={styles.rotulo}>Email</Text>
          <CampoTexto
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {erro ? <Text style={styles.erro} accessibilityRole="alert">{erro}</Text> : null}
          <View style={estilos.botoes}>
            <TouchableOpacity style={[estilos.botaoSecundario]} onPress={() => setEditando(false)} accessibilityRole="button">
              <Text style={estilos.botaoSecundarioTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.botao, estilos.botaoFlex]} onPress={salvar} accessibilityRole="button">
              <Text style={styles.botaoTexto}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={[styles.estado, estilos.privacidade]}>Nos rankings aparece apenas o seu nickname.</Text>
      )}
    </View>
  );
}

function SecaoMetas({ usuario }: Props) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  const [metaAgua, setMetaAgua] = useState(() => buscarMetaHidratacaoAtiva(usuario.idUsuario));
  const [metaSono, setMetaSono] = useState(() => buscarMetaSonoAtiva(usuario.idUsuario));
  const [valorAgua, setValorAgua] = useState(metaAgua ? String(metaAgua.valorMeta) : '');
  const [valorSono, setValorSono] = useState(metaSono ? String(metaSono.valorMeta).replace('.', ',') : '');
  const [erro, setErro] = useState('');
  const [feedback, setFeedback] = useState('');

  function salvar() {
    const textoAgua = valorAgua.trim();
    const textoSono = valorSono.trim();
    const ml = Number(textoAgua);
    if (!/^\d+$/.test(textoAgua) || ml <= 0) {
      setErro('Informe a meta de hidratação em ml, como 2000.');
      setFeedback('');
      return;
    }
    const horas = Number(textoSono.replace(',', '.'));
    if (textoSono && (!/^\d+(?:[.,]\d+)?$/.test(textoSono) || !validarMetaSono(horas))) {
      setErro('Informe a meta de sono entre 0 e 18 horas, como 8 ou 7,5.');
      setFeedback('');
      return;
    }

    // Só grava o que mudou: cada meta nova encerra a anterior no histórico.
    if (ml !== metaAgua?.valorMeta) setMetaAgua(definirMetaHidratacao(usuario.idUsuario, ml));
    if (textoSono && horas !== metaSono?.valorMeta) setMetaSono(definirMetaSono(usuario.idUsuario, horas));
    atualizarGamificacao(usuario.idUsuario);
    setErro('');
    setFeedback('Metas salvas. Valem a partir de hoje; os dias anteriores mantêm a meta da época.');
  }

  return (
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
      />
      <Text style={styles.rotulo}>Sono por noite (horas)</Text>
      <CampoTexto
        value={valorSono}
        onChangeText={(v) => {
          setValorSono(v);
          setFeedback('');
        }}
        placeholder="Ex.: 8"
        keyboardType="decimal-pad"
      />
      <Text style={[styles.estado, estilos.nota]}>
        Atual: {metaAgua ? `${formatarNumero(metaAgua.valorMeta)} ml` : 'sem meta'} de água ·{' '}
        {metaSono ? formatarHoras(metaSono.valorMeta) : 'sem meta'} de sono
      </Text>
      {erro ? <Text style={styles.erro} accessibilityRole="alert">{erro}</Text> : null}
      <TouchableOpacity style={styles.botao} onPress={salvar} accessibilityRole="button">
        <Text style={styles.botaoTexto}>Salvar metas</Text>
      </TouchableOpacity>
      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
    </View>
  );
}

export default function Ajustes({ usuario }: Props) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  const { cores, modo, setModo } = useTema();
  const { setUsuario } = useUsuario();
  // A cada foco a seção de metas é recriada com os valores atuais do banco.
  const versao = useAtualizarAoFocar();
  const [configuracoes, setConfiguracoes] = useState(() => listarConfiguracoesAlerta(usuario.idUsuario));
  const coresSwitch = { false: cores.bordaForte, true: cores.primaria };

  function alternar(tipo: TipoAlerta, habilitado: boolean) {
    definirAlertaHabilitado(usuario.idUsuario, tipo, habilitado);
    setConfiguracoes(listarConfiguracoesAlerta(usuario.idUsuario));
  }

  function confirmarExclusao() {
    Alert.alert(
      'Excluir perfil?',
      `Todos os dados de @${usuario.nickname} serão apagados deste aparelho: registros de água, sono e consumo, metas, medalhas e desafios. Não é possível desfazer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            excluirUsuario(usuario.idUsuario);
            setUsuario(null);
            router.replace('/');
          },
        },
      ],
    );
  }

  return (
    <ModuloLayout titulo="Ajustes" descricao="Seu perfil, metas, lembretes e aparência do app.">
      <SecaoPerfil usuario={usuario} />

      <Text style={estilos.tituloGrupo}>Metas</Text>
      <SecaoMetas key={versao} usuario={usuario} />

      <Text style={estilos.tituloGrupo}>Alertas</Text>
      <View style={styles.secao}>
        {configuracoes.map((config, index) => {
          const textos = TEXTOS_ALERTA[config.tipoAlerta];
          return (
            <View key={config.tipoAlerta} style={index > 0 && styles.separador}>
              <LinhaComIcone icone={textos.icone} titulo={textos.titulo} descricao={textos.descricao}>
                <Switch
                  value={config.habilitado}
                  onValueChange={(valor) => alternar(config.tipoAlerta, valor)}
                  trackColor={coresSwitch}
                  accessibilityLabel={`Ativar alertas de ${textos.titulo.toLowerCase()}`}
                />
              </LinhaComIcone>
            </View>
          );
        })}
        <Text style={[styles.estado, estilos.nota]}>
          Suas preferências ficam salvas. Horários e notificações serão integrados em uma próxima etapa.
        </Text>
      </View>

      <Text style={estilos.tituloGrupo}>Aparência</Text>
      <View style={styles.secao}>
        <LinhaComIcone icone="moon" titulo="Tema escuro" descricao="Cores escuras, mais confortáveis à noite.">
          <Switch
            value={modo === 'escuro'}
            onValueChange={(escuro) => setModo(escuro ? 'escuro' : 'claro')}
            trackColor={coresSwitch}
            accessibilityLabel="Ativar tema escuro"
          />
        </LinhaComIcone>
      </View>

      <Text style={estilos.tituloGrupo}>Conta</Text>
      <View style={styles.secao}>
        <Pressable
          onPress={confirmarExclusao}
          style={({ pressed }) => [estilos.excluir, pressed && estilos.pressionado]}
          accessibilityRole="button"
          accessibilityLabel="Excluir perfil e todos os dados"
        >
          <Ionicons name="trash-outline" size={20} color={cores.erro} />
          <Text style={estilos.excluirTexto}>Excluir perfil</Text>
        </Pressable>
        <Text style={[styles.estado, estilos.nota]}>
          Apaga o perfil e todos os seus dados deste aparelho e volta para a tela de cadastro.
        </Text>
      </View>
    </ModuloLayout>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    perfil: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.primaria,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarTexto: { color: c.textoSobrePrimaria, fontSize: 24, fontWeight: '800' },
    botaoIcone: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.primariaSuave,
      alignItems: 'center',
      justifyContent: 'center',
    },
    privacidade: { marginTop: 12 },
    formulario: { marginTop: 16 },
    botoes: { flexDirection: 'row', gap: 10 },
    botaoFlex: { flex: 1 },
    botaoSecundario: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.bordaForte,
    },
    botaoSecundarioTexto: { color: c.texto, fontSize: 15, fontWeight: '700' },
    tituloGrupo: {
      color: c.textoSuave,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 8,
      marginLeft: 4,
    },
    icone: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.primariaSuave,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nota: { marginTop: 12, fontWeight: '500' },
    excluir: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.erro,
      paddingVertical: 13,
    },
    excluirTexto: { color: c.erro, fontSize: 15, fontWeight: '700' },
    pressionado: { opacity: 0.6 },
  });
}
