import { Redirect } from 'expo-router';
import React from 'react';
import { useUsuario } from '../context/UsuarioContext';
import Sono from '../screens/Sono';

export default function SonoRoute() {
  const { usuario } = useUsuario();
  if (!usuario) return <Redirect href="/" />;
  return <Sono />;
}