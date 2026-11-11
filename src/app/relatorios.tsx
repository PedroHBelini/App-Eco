import { Redirect } from 'expo-router';
import React from 'react';
import { useUsuario } from '../context/UsuarioContext';
import Relatorios from '../screens/Relatorios';

export default function RelatoriosRoute() {
  const { usuario } = useUsuario();
  if (!usuario) return <Redirect href="/" />;
  return <Relatorios usuario={usuario} />;
}