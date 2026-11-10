import { Redirect } from 'expo-router';
import React from 'react';
import { useUsuario } from '../context/UsuarioContext';
import Alertas from '../screens/Alertas';

export default function AlertasRoute() {
  const { usuario } = useUsuario();
  if (!usuario) return <Redirect href="/" />;
  return <Alertas />;
}