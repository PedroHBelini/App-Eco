import { Ionicons } from '@react-native-vector-icons/ionicons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IdMedalha } from '../models/types';
import { Cores } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';

type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];

// Record garante que toda medalha nova do catálogo ganhe um ícone (senão o TypeScript acusa).
const ICONES: Record<IdMedalha, NomeIcone> = {
  PRIMEIRO_GOLE: 'water',
  HIDRATADO: 'beaker',
  SEMANA_HIDRATADA: 'calendar',
  MES_HIDRATADO: 'calendar-number',
  CINQUENTA_LITROS: 'ribbon',
  PRIMEIRA_NOITE: 'moon',
  BEM_DESCANSADO: 'bed',
  EQUILIBRIO: 'heart',
  CONTA_EM_DIA: 'receipt',
  ECONOMIA: 'leaf',
  DESAFIANTE: 'flag',
};

interface Props {
  idMedalha: IdMedalha;
  conquistada: boolean;
  tamanho?: number;
}

// Conquistada: selo dourado. Bloqueada: selo cinza com um cadeado no canto.
export default function SeloMedalha({ idMedalha, conquistada, tamanho = 46 }: Props) {
  const estilos = useEstilos(criarEstilos);
  const { cores } = useTema();

  return (
    <View
      style={[
        estilos.selo,
        { width: tamanho, height: tamanho, borderRadius: tamanho / 2 },
        conquistada ? estilos.conquistada : estilos.bloqueada,
      ]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Ionicons
        name={ICONES[idMedalha]}
        size={Math.round(tamanho * 0.48)}
        color={conquistada ? cores.ouroTexto : cores.textoSuave}
      />
      {!conquistada ? (
        <View style={estilos.cadeado}>
          <Ionicons name="lock-closed" size={10} color={cores.textoSuave} />
        </View>
      ) : null}
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    selo: { alignItems: 'center', justifyContent: 'center' },
    conquistada: { backgroundColor: c.ouro },
    bloqueada: { backgroundColor: c.superficieSuave, borderWidth: 1, borderColor: c.borda },
    cadeado: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borda,
    },
  });
}
