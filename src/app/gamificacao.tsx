import { Redirect } from 'expo-router';
import React from 'react';
import { useUsuario } from '../context/UsuarioContext';
import Gamificacao from '../screens/Gamificacao';

export default function GamificacaoRoute() {
  const { usuario } = useUsuario();
  if (!usuario) return <Redirect href="/" />;
  return <Gamificacao />;
}