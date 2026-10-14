import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { cadastrarUsuario, definirMetaHidratacao } from '../data/mockRepository';
import { Usuario } from '../models/types';

interface Props {
  onCadastroConcluido: (usuario: Usuario) => void;
}

export default function CadastroScreen({ onCadastroConcluido }: Props) {
  const [nome, setNome] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [metaMl, setMetaMl] = useState('');
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

      <TextInput style={styles.input} placeholder="Nome" value={nome} onChangeText={setNome} />
      <TextInput
        style={styles.input}
        placeholder="Nickname (exibido nos rankings)"
        value={nickname}
        onChangeText={setNickname}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Meta diária de hidratação (Ex: 2000 ml)"
        value={metaMl}
        onChangeText={setMetaMl}
        keyboardType="numeric"
      />

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <TouchableOpacity style={styles.botao} onPress={handleCadastrar}>
        <Text style={styles.botaoTexto}>Criar conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f4faff' },
  titulo: { fontSize: 24, fontWeight: '700', color: '#173f4f', marginBottom: 4 },
  subtitulo: { fontSize: 14, color: '#4a6572', marginBottom: 24 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cfe3e8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  erro: { color: '#c0392b', marginBottom: 12 },
  botao: { backgroundColor: '#173f4f', borderRadius: 8, padding: 14, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
