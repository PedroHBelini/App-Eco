import { Redirect } from 'expo-router';
import React from 'react';
import { useUsuario } from '../../context/UsuarioContext';
import Metas from '../../screens/ajustes/Metas';

export default function MetasRoute() {
  const { usuario } = useUsuario();
  if (!usuario) return <Redirect href="/" />;
  return <Metas usuario={usuario} />;
}
