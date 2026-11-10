import { router } from 'expo-router';
import React from 'react';
import Cadastro from '../screens/Cadastro';
import { useUsuario } from '../context/UsuarioContext';

export default function CadastroRoute() {
  const { setUsuario } = useUsuario();

  return (
    <Cadastro
      onCadastroConcluido={(usuario) => {
        setUsuario(usuario);
        router.replace('/menu');
      }}
    />
  );
}
