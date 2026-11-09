import { Redirect } from 'expo-router';
import React from 'react';
import Menu from '../screens/Menu';
import { useUsuario } from '../context/UsuarioContext';

export default function MenuRoute() {
  const { usuario } = useUsuario();

  if (!usuario) {
    return <Redirect href="/" />;
  }

  return <Menu usuario={usuario} />;
}
