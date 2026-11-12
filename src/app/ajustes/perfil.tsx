import { Redirect } from 'expo-router';
import React from 'react';
import { useUsuario } from '../../context/UsuarioContext';
import Perfil from '../../screens/ajustes/Perfil';

export default function PerfilRoute() {
  const { usuario } = useUsuario();
  if (!usuario) return <Redirect href="/" />;
  return <Perfil usuario={usuario} />;
}
