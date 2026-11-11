import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform, Pressable, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CampoDataHora from '../components/CampoDataHora';
import CampoTexto from '../components/CampoTexto';
import ModuloLayout, { useModuloStyles } from '../components/ModuloLayout';
import { useUsuario } from '../context/UsuarioContext';
import { useAtualizarAoFocar } from '../hooks/useAtualizarAoFocar';
import {
  atualizarGamificacao,
  atualizarPerfil,
  buscarMetaHidratacaoAtiva,
  buscarMetaSonoAtiva,
  AlteracaoAlerta,
  definirAlerta,
  FREQUENCIAS_ALERTA,
  definirMetaHidratacao,
  definirMetaSono,
  excluirUsuario,
  listarConfiguracoesAlerta,
  validarDadosPerfil,
  validarMetaHidratacao,
  validarMetaSono,
} from '../data/repository';
import { ConfiguracaoAlerta, FrequenciaAlerta, TipoAlerta, Usuario } from '../models/types';
import { DIA_LEMBRETE_CONSUMO, horariosHidratacao } from '../services/lembretes';
import { consultarPermissao, EstadoPermissao, pedirPermissao, sincronizarLembretes } from '../services/notificacoes';
import { Cores } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';
import { formatarHoras, formatarNumero } from '../utils/formatacao';
import { deHorario, paraHorario } from '../utils/datas';
import { confirmar } from '../utils/confirmar';
import { lerNumero } from '../utils/entrada';

interface Props {
  usuario: Usuario;
}

type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];
type CampoRef = React.ComponentRef<typeof TextInput>;

const TEXTOS_ALERTA: Record<TipoAlerta, { titulo: string; descricao: string; icone: NomeIcone }> = {
  HIDRATACAO: { titulo: 'Hidratação', descricao: 'Lembretes para beber água', icone: 'water-outline' },
  SONO: { titulo: 'Sono', descricao: 'Lembretes para sua rotina de descanso', icone: 'moon-outline' },
  CONSUMO: { titulo: 'Consumo', descricao: 'Avisos para atualizar os dados da conta', icone: 'flash-outline' },
};

const ROTULO_FREQUENCIA: Record<FrequenciaAlerta, string> = {
  A_CADA_1_HORA: 'A cada 1h',
  A_CADA_2_HORAS: 'A cada 2h',
  A_CADA_3_HORAS: 'A cada 3h',
  DIARIA: 'Diário',
  MENSAL: 'Mensal',
};

function resumoAlerta(config: ConfiguracaoAlerta): string {
  switch (config.tipoAlerta) {
    case 'HIDRATACAO': {
      const horarios = horariosHidratacao(config);
      const quantos = horarios.length === 1 ? '1 lembrete' : `${horarios.length} lembretes`;
      return `${quantos} por dia, das ${horarios[0]} às ${horarios[horarios.length - 1]}. Param no dia em que você bate a meta.`;
    }
    case 'SONO':
      return `Todo dia às ${config.horario}.`;
    case 'CONSUMO':
      return `Todo dia ${DIA_LEMBRETE_CONSUMO}, às ${config.horario}, se a conta do mês ainda não foi registrada.`;
  }
}

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
  const nicknameRef = useRef<CampoRef>(null);
  const emailRef = useRef<CampoRef>(null);

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
          <CampoTexto
            value={nome}
            onChangeText={setNome}
            placeholder="Nome"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => nicknameRef.current?.focus()}
          />
          <Text style={styles.rotulo}>Nickname (exibido nos rankings)</Text>
          <CampoTexto
            ref={nicknameRef}
            value={nickname}
            onChangeText={setNickname}
            placeholder="Nickname"
            autoCapitalize="none"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
          <Text style={styles.rotulo}>Email</Text>
          <CampoTexto
            ref={emailRef}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="done"
            onSubmitEditing={salvar}
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

function SecaoAlertas({ usuario }: Props) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  const { cores } = useTema();
  const [configuracoes, setConfiguracoes] = useState(() => listarConfiguracoesAlerta(usuario.idUsuario));
  const [permissao, setPermissao] = useState<EstadoPermissao | null>(null);
  const coresSwitch = { false: cores.bordaForte, true: cores.primaria };

  // Relê a permissão ao abrir e ao voltar das configurações do aparelho.
  useEffect(() => {
    const verificar = () => {
      consultarPermissao().then(setPermissao);
    };
    verificar();
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') verificar();
    });
    return () => assinatura.remove();
  }, []);

  // Os lembretes se reagendam sozinhos quando a configuração muda (useLembretes).
  function alterar(tipo: TipoAlerta, alteracao: AlteracaoAlerta) {
    definirAlerta(usuario.idUsuario, tipo, alteracao);
    setConfiguracoes(listarConfiguracoesAlerta(usuario.idUsuario));
  }

  async function alternar(tipo: TipoAlerta, habilitado: boolean) {
    alterar(tipo, { habilitado });
    if (habilitado && permissao !== 'concedida') {
      const novaPermissao = await pedirPermissao();
      setPermissao(novaPermissao);
      if (novaPermissao === 'concedida') sincronizarLembretes();
    }
  }

  const bloqueado = permissao === 'negada' && configuracoes.some((c) => c.habilitado);

  return (
    <View style={styles.secao}>
      {bloqueado ? (
        <View style={estilos.avisoBloqueio}>
          <Text style={estilos.avisoTexto}>
            As notificações do app estão bloqueadas no aparelho, então os lembretes não vão aparecer.
          </Text>
          <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button" style={estilos.avisoBotao}>
            <Text style={estilos.avisoBotaoTexto}>Abrir configurações</Text>
          </Pressable>
        </View>
      ) : null}

      {configuracoes.map((config, index) => {
        const textos = TEXTOS_ALERTA[config.tipoAlerta];
        const frequencias = FREQUENCIAS_ALERTA[config.tipoAlerta];
        const horario = deHorario(config.horario) ?? new Date();
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

            {config.habilitado ? (
              <View style={estilos.detalheAlerta}>
                <Text style={styles.rotulo}>
                  {config.tipoAlerta === 'HIDRATACAO' ? 'Primeiro lembrete do dia' : 'Horário'}
                </Text>
                <CampoDataHora
                  modo="time"
                  valor={horario}
                  valorInicial={horario}
                  onChange={(d) => alterar(config.tipoAlerta, { horario: paraHorario(d) })}
                  formatar={paraHorario}
                  placeholder="Escolha o horário"
                  rotuloAcessivel={`Horário dos lembretes de ${textos.titulo.toLowerCase()}`}
                />
                {frequencias.length > 1 ? (
                  <View style={[styles.linha, estilos.frequencias]}>
                    {frequencias.map((f) => {
                      const ativa = config.frequencia === f;
                      return (
                        <TouchableOpacity
                          key={f}
                          onPress={() => alterar(config.tipoAlerta, { frequencia: f })}
                          style={[styles.opcao, ativa && styles.opcaoAtiva]}
                          accessibilityRole="button"
                          accessibilityState={{ selected: ativa }}
                        >
                          <Text style={[styles.opcaoTexto, ativa && styles.opcaoTextoAtiva]}>{ROTULO_FREQUENCIA[f]}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
                <Text style={styles.texto}>{resumoAlerta(config)}</Text>
              </View>
            ) : null}
          </View>
        );
      })}
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
  const coresSwitch = { false: cores.bordaForte, true: cores.primaria };

  function confirmarExclusao() {
    confirmar(
      'Excluir perfil?',
      `Todos os dados de @${usuario.nickname} serão apagados deste aparelho: registros de água, sono e consumo, metas, medalhas e desafios. Não é possível desfazer.`,
      'Excluir',
      () => {
        excluirUsuario(usuario.idUsuario);
        setUsuario(null);
        router.replace('/');
      },
    );
  }

  return (
    <ModuloLayout titulo="Ajustes" descricao="Seu perfil, metas, lembretes e aparência do app.">
      <SecaoPerfil usuario={usuario} />

      <Text style={estilos.tituloGrupo}>Metas</Text>
      <SecaoMetas key={versao} usuario={usuario} />

      <Text style={estilos.tituloGrupo}>Alertas</Text>
      {Platform.OS === 'web' ? (
        <View style={styles.secao}>
          <LinhaComIcone
            icone="phone-portrait-outline"
            titulo="Disponível no app do celular"
            descricao="Os lembretes de hidratação, sono e consumo usam as notificações do celular e não funcionam no navegador."
          />
        </View>
      ) : (
        <SecaoAlertas usuario={usuario} />
      )}

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
    detalheAlerta: { marginTop: 14, marginLeft: 48 },
    frequencias: { gap: 8, marginBottom: -4 },
    avisoBloqueio: {
      backgroundColor: c.superficieSuave,
      borderWidth: 1,
      borderColor: c.erro,
      borderRadius: 10,
      padding: 12,
      marginBottom: 14,
      gap: 8,
    },
    avisoTexto: { color: c.erro, fontSize: 14, fontWeight: '500' },
    avisoBotao: { alignSelf: 'flex-start' },
    avisoBotaoTexto: { color: c.erro, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
    pressionado: { opacity: 0.6 },
  });
}
