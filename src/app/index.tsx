import { Redirect, router } from 'expo-router';
import React from 'react';
import Cadastro from '../screens/Cadastro';
import { useUsuario } from '../context/UsuarioContext';

export default function CadastroRoute() {
  const { usuario, setUsuario } = useUsuario();

  // Usuário já salvo no aparelho: pula o cadastro.
  if (usuario) {
    return <Redirect href="/inicio" />;
  }

  return (
    <Cadastro
      onCadastroConcluido={(novoUsuario) => {
        setUsuario(novoUsuario);
        router.replace('/inicio');
      }}
    />
  );
}
