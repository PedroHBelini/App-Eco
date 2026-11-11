import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

// As abas ficam montadas ao trocar de tela, então os dados precisam ser relidos quando a tela volta ao foco.
// Retorna um contador que muda a cada foco (use como dependência de useMemo) e roda `aoFocar` antes.
export function useAtualizarAoFocar(aoFocar?: () => void): number {
  const [versao, setVersao] = useState(0);
  const aoFocarRef = useRef(aoFocar);

  useEffect(() => {
    aoFocarRef.current = aoFocar;
  });

  useFocusEffect(
    useCallback(() => {
      aoFocarRef.current?.();
      setVersao((v) => v + 1);
    }, []),
  );

  return versao;
}
