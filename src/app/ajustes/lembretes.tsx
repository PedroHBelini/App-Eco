import { Redirect } from 'expo-router';
import React from 'react';
import { useUsuario } from '../../context/UsuarioContext';
import Lembretes from '../../screens/ajustes/Lembretes';

export default function LembretesRoute() {
  const { usuario } = useUsuario();
  if (!usuario) return <Redirect href="/" />;
  return <Lembretes usuario={usuario} />;
}
