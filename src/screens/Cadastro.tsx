import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CampoTexto from '../components/CampoTexto';
import { useModuloStyles } from '../components/ModuloLayout';
import { cadastrarUsuario, definirMetaHidratacao } from '../data/repository';
import { Usuario } from '../models/types';
import { Cores } from '../theme/cores';
import { useEstilos } from '../theme/TemaContext';

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

  function handleCadastrar() {
    if (!nome.trim() || !nickname.trim() || !email.trim()) {
      setErro('Preencha nome, nickname e email.');
      return;
    }
    const valorMeta = Number(metaMl);
    if (!valorMeta || valorMeta <= 0) {
      setErro('Informe uma meta de hidratação válida, em ml.');
      return;
    }

    const usuario = cadastrarUsuario(nome.trim(), nickname.trim(), email.trim());
    definirMetaHidratacao(usuario.idUsuario, valorMeta);
    setErro('');
    onCadastroConcluido(usuario);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Hábitos & Sustentabilidade</Text>
      <Text style={styles.subtitulo}>Crie sua conta e defina sua meta de hidratação</Text>

      <CampoTexto placeholder="Nome" value={nome} onChangeText={setNome} />
      <CampoTexto
        placeholder="Nickname (exibido nos rankings)"
        value={nickname}
        onChangeText={setNickname}
        autoCapitalize="none"
      />
      <CampoTexto
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <CampoTexto
        placeholder="Meta diária de hidratação (ml)"
        value={metaMl}
        onChangeText={setMetaMl}
        keyboardType="number-pad"
      />

      {erro ? <Text style={modulo.erro}>{erro}</Text> : null}

      <TouchableOpacity style={modulo.botao} onPress={handleCadastrar} accessibilityRole="button">
        <Text style={modulo.botaoTexto}>Criar conta</Text>
      </TouchableOpacity>
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: c.fundo },
    titulo: { fontSize: 28, fontWeight: '800', color: c.texto, marginBottom: 6, letterSpacing: -0.3 },
    subtitulo: { fontSize: 15, color: c.textoSecundario, marginBottom: 28 },
  });
}
