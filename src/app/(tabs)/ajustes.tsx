import { Redirect } from 'expo-router';
import React from 'react';
import { useUsuario } from '../../context/UsuarioContext';
import Ajustes from '../../screens/Ajustes';

export default function AjustesRoute() {
  const { usuario } = useUsuario();
  if (!usuario) return <Redirect href="/" />;
  return <Ajustes usuario={usuario} />;
}
