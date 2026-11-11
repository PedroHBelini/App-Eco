import React, { useRef, useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import CampoTexto from '../components/CampoTexto';
import { DISTANCIA_DO_TECLADO, useModuloStyles } from '../components/ModuloLayout';
import { cadastrarUsuario, definirMetaHidratacao, validarDadosPerfil, validarMetaHidratacao } from '../data/repository';
import { Usuario } from '../models/types';
import { Cores } from '../theme/cores';
import { useEstilos } from '../theme/TemaContext';
import { lerNumero } from '../utils/entrada';

type CampoRef = React.ComponentRef<typeof TextInput>;

interface Props {
  onCadastroConcluido: (usuario: Usuario) => void;
}

export default function Cadastro({ onCadastroConcluido }: Props) {
  const styles = useEstilos(criarEstilos);
  const modulo = useModuloStyles();
  const [nome, setNome] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [metaMl, setMetaMl] = useState('2000');
  const [erro, setErro] = useState('');
  // "Próximo" no teclado leva ao campo seguinte.
  const nicknameRef = useRef<CampoRef>(null);
  const emailRef = useRef<CampoRef>(null);
  const metaRef = useRef<CampoRef>(null);

  function handleCadastrar() {
    // Mesmas regras da edição de perfil: campos preenchidos, email válido, nickname e email únicos.
    const valorMeta = lerNumero(metaMl);
    const problema = validarDadosPerfil({ nome, nickname, email }) ?? validarMetaHidratacao(valorMeta);
    if (problema) {
      setErro(problema);
      return;
    }

    const usuario = cadastrarUsuario(nome.trim(), nickname.trim(), email.trim());
    definirMetaHidratacao(usuario.idUsuario, valorMeta);
    setErro('');
    onCadastroConcluido(usuario);
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      bottomOffset={DISTANCIA_DO_TECLADO}
    >
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        accessibilityIgnoresInvertColors
        accessible={false}
      />
      <Text style={styles.titulo}>Ciclo</Text>
      <Text style={styles.slogan}>Hábitos que cuidam de você e do planeta</Text>
      <Text style={styles.subtitulo}>Crie sua conta e defina sua meta de hidratação</Text>

      <CampoTexto
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => nicknameRef.current?.focus()}
      />
      <CampoTexto
        ref={nicknameRef}
        placeholder="Nickname (exibido nos rankings)"
        value={nickname}
        onChangeText={setNickname}
        autoCapitalize="none"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <CampoTexto
        ref={emailRef}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => metaRef.current?.focus()}
      />
      <CampoTexto
        ref={metaRef}
        placeholder="Meta diária de hidratação (ml)"
        returnKeyType="done"
        onSubmitEditing={handleCadastrar}
        value={metaMl}
        onChangeText={setMetaMl}
        keyboardType="number-pad"
      />

      {erro ? <Text style={modulo.erro}>{erro}</Text> : null}

      <TouchableOpacity style={modulo.botao} onPress={handleCadastrar} accessibilityRole="button">
        <Text style={modulo.botaoTexto}>Criar conta</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: c.fundo },
    logo: { width: 88, height: 88, alignSelf: 'center', marginBottom: 12 },
    titulo: { fontSize: 32, fontWeight: '800', color: c.texto, textAlign: 'center', letterSpacing: -0.5 },
    slogan: { fontSize: 15, color: c.primaria, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
    subtitulo: { fontSize: 15, color: c.textoSecundario, marginBottom: 16 },
  });
}
