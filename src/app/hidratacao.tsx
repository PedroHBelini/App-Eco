import { Redirect } from 'expo-router';
import React from 'react';
import Hidratacao from '../screens/Hidratacao';
import { useUsuario } from '../context/UsuarioContext';

export default function HidratacaoRoute() {
  const { usuario } = useUsuario();

  if (!usuario) {
    return <Redirect href="/" />;
  }

  return <Hidratacao usuario={usuario} />;
}
