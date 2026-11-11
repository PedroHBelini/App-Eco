import { Redirect } from 'expo-router';
import React from 'react';
import { useUsuario } from '../context/UsuarioContext';
import Consumo from '../screens/Consumo';

export default function ConsumoRoute() {
  const { usuario } = useUsuario();
  if (!usuario) return <Redirect href="/" />;
  return <Consumo usuario={usuario} />;
}