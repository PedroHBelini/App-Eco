import React, { createContext, useContext, useMemo, useState } from 'react';
import { buscarTema, definirTema } from '../data/repository';
import { Cores, ModoTema, TEMAS } from './cores';

interface TemaContextValue {
  modo: ModoTema;
  cores: Cores;
  setModo: (modo: ModoTema) => void;
}

const TemaContext = createContext<TemaContextValue | undefined>(undefined);

// Precisa ficar dentro do UsuarioProvider, que só renderiza depois de carregar o banco.
export function TemaProvider({ children }: { children: React.ReactNode }) {
  const [modo, setModoState] = useState<ModoTema>(() => buscarTema());

  const valor = useMemo(
    () => ({
      modo,
      cores: TEMAS[modo],
      setModo: (novo: ModoTema) => {
        definirTema(novo);
        setModoState(novo);
      },
    }),
    [modo],
  );

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

export function useTema() {
  const context = useContext(TemaContext);
  if (!context) {
    throw new Error('useTema deve ser usado dentro de um TemaProvider');
  }
  return context;
}

// Cria os estilos a partir das cores do tema e só recria quando o tema muda.
// Uso: const criarEstilos = (c: Cores) => StyleSheet.create({...}); depois useEstilos(criarEstilos).
export function useEstilos<T>(criar: (cores: Cores) => T): T {
  const { cores } = useTema();
  return useMemo(() => criar(cores), [criar, cores]);
}
