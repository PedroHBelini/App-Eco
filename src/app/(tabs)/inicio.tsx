import { Redirect } from 'expo-router';
import React from 'react';
import { useUsuario } from '../../context/UsuarioContext';
import Inicio from '../../screens/Inicio';

export default function InicioRoute() {
  const { usuario } = useUsuario();
  if (!usuario) return <Redirect href="/" />;
  return <Inicio usuario={usuario} />;
}
