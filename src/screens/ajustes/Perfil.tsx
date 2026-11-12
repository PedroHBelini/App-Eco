import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CampoTexto from '../../components/CampoTexto';
import ModuloLayout, { useModuloStyles } from '../../components/ModuloLayout';
import { useUsuario } from '../../context/UsuarioContext';
import { atualizarPerfil, excluirUsuario, validarDadosPerfil } from '../../data/repository';
import { Usuario } from '../../models/types';
import { Cores } from '../../theme/cores';
import { useEstilos, useTema } from '../../theme/TemaContext';
import { confirmar } from '../../utils/confirmar';

type CampoRef = React.ComponentRef<typeof TextInput>;

export default function Perfil({ usuario }: { usuario: Usuario }) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  const { cores } = useTema();
  const { setUsuario } = useUsuario();
  const [nome, setNome] = useState(usuario.nome);
  const [nickname, setNickname] = useState(usuario.nickname);
  const [email, setEmail] = useState(usuario.email);
  const [erro, setErro] = useState('');
  const nicknameRef = useRef<CampoRef>(null);
  const emailRef = useRef<CampoRef>(null);

  function salvar() {
    const dados = { nome, nickname, email };
    const problema = validarDadosPerfil(dados, usuario.idUsuario);
    if (problema) {
      setErro(problema);
      return;
    }
    setUsuario(atualizarPerfil(usuario.idUsuario, dados));
    router.back();
  }

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
    <ModuloLayout voltar titulo="Perfil">
      <View style={styles.secao}>
        <Text style={styles.rotulo}>Nome</Text>
        <CampoTexto
          value={nome}
          onChangeText={setNome}
          placeholder="Nome"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => nicknameRef.current?.focus()}
        />
        <Text style={styles.rotulo}>Apelido (exibido nos rankings)</Text>
        <CampoTexto
          ref={nicknameRef}
          value={nickname}
          onChangeText={setNickname}
          placeholder="Apelido"
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
        <TouchableOpacity style={styles.botao} onPress={salvar} accessibilityRole="button">
          <Text style={styles.botaoTexto}>Salvar</Text>
        </TouchableOpacity>
        <Text style={[styles.estado, estilos.nota]}>Nos rankings aparece apenas o seu apelido.</Text>
      </View>

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
