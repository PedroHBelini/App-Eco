import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { buscarUsuarioDaSessao, carregarBanco, definirUsuarioDaSessao } from '../data/repository';
import { Usuario } from '../models/types';

interface UsuarioContextValue {
  usuario: Usuario | null;
  setUsuario: (usuario: Usuario | null) => void;
}

const UsuarioContext = createContext<UsuarioContextValue | undefined>(undefined);

export function UsuarioProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuarioState] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    carregarBanco().then(() => {
      if (!ativo) return;
      setUsuarioState(buscarUsuarioDaSessao());
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, []);

  function setUsuario(novoUsuario: Usuario | null) {
    definirUsuarioDaSessao(novoUsuario?.idUsuario ?? null);
    setUsuarioState(novoUsuario);
  }

  // Segura as rotas até o banco carregar; senão elas veriam usuario = null e voltariam ao cadastro.
  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4faff' }}>
        <ActivityIndicator color="#173f4f" />
      </View>
    );
  }

  return (
    <UsuarioContext.Provider value={{ usuario, setUsuario }}>{children}</UsuarioContext.Provider>
  );
}

export function useUsuario() {
  const context = useContext(UsuarioContext);
  if (!context) {
    throw new Error('useUsuario deve ser usado dentro de um UsuarioProvider');
  }
  return context;
}
