import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AvisoMedalha from '../components/AvisoMedalha';
import CampoTexto from '../components/CampoTexto';
import EstadoVazio from '../components/EstadoVazio';
import ModuloLayout, { useModuloStyles } from '../components/ModuloLayout';
import { listarConsumos, registrarConsumo, unidadeDoRecurso, validarConsumo, atualizarGamificacao } from '../data/repository';
import { Medalha, TipoRecurso, Usuario } from '../models/types';
import { Cores } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';
import { formatarMesAno, formatarNumero, nomeMes } from '../utils/formatacao';
import { lerNumero } from '../utils/entrada';
import { vibrarAposRegistro } from '../utils/vibracao';

interface Props {
  usuario: Usuario;
}

type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];

const RECURSOS: Record<TipoRecurso, { nome: string; icone: NomeIcone }> = {
  ENERGIA: { nome: 'Energia', icone: 'flash' },
  AGUA_RESIDENCIAL: { nome: 'Água', icone: 'water' },
};

// A água pode ser informada em m³ (como vem na conta) ou em litros; sempre é guardada em m³.
type UnidadeAgua = 'M3' | 'LITROS';
const LITROS_POR_M3 = 1000;

const PLACEHOLDER: Record<'ENERGIA' | UnidadeAgua, string> = {
  ENERGIA: 'Ex.: 125,5',
  M3: 'Ex.: 12,5',
  LITROS: 'Ex.: 12500',
};

// Energia com 1 casa; água com até 3, para não perder o que foi informado em litros.
function formatarQuantidade(tipo: TipoRecurso, quantidade: number): string {
  return `${formatarNumero(quantidade, tipo === 'ENERGIA' ? 1 : 3)} ${unidadeDoRecurso(tipo)}`;
}

export default function Consumo({ usuario }: Props) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  const { cores } = useTema();
  const agora = new Date();
  const [recurso, setRecurso] = useState<TipoRecurso>('ENERGIA');
  const [unidadeAgua, setUnidadeAgua] = useState<UnidadeAgua>('M3');
  const emLitros = recurso === 'AGUA_RESIDENCIAL' && unidadeAgua === 'LITROS';
  // Mês da conta, escolhido com as setas (sem digitar). Não passa do mês atual.
  const [mesConta, setMesConta] = useState(() => new Date(agora.getFullYear(), agora.getMonth(), 1));
  const ehMesAtual = mesConta.getFullYear() === agora.getFullYear() && mesConta.getMonth() === agora.getMonth();

  function mudarMes(delta: number) {
    setMesConta((atual) => new Date(atual.getFullYear(), atual.getMonth() + delta, 1));
    setFeedback('');
  }
  const [quantidade, setQuantidade] = useState('');
  const [registros, setRegistros] = useState(() => listarConsumos(usuario.idUsuario));
  const [erro, setErro] = useState('');
  const [feedback, setFeedback] = useState('');
  const [novasMedalhas, setNovasMedalhas] = useState<Medalha[]>([]);

  function salvarRegistro() {
    const informado = lerNumero(quantidade);
    const valor = emLitros ? informado / LITROS_POR_M3 : informado;
    const ano = mesConta.getFullYear();
    const mes = mesConta.getMonth() + 1;

    const problema = validarConsumo(mes, ano, valor);
    if (problema) {
      setErro(problema);
      setFeedback('');
      return;
    }

    const jaExistia = registros.some(
      (c) => c.tipoRecurso === recurso && c.mesReferencia === mes && c.anoReferencia === ano,
    );
    registrarConsumo(usuario.idUsuario, recurso, mes, ano, valor);
    setRegistros(listarConsumos(usuario.idUsuario));
    const medalhas = atualizarGamificacao(usuario.idUsuario);
    setNovasMedalhas(medalhas);
    vibrarAposRegistro(medalhas.length > 0);
    setQuantidade('');
    setErro('');
    setFeedback(
      `${RECURSOS[recurso].nome} de ${nomeMes(mes)}/${ano} ${jaExistia ? 'atualizada' : 'registrada'}: ${formatarQuantidade(recurso, valor)}.`,
    );
  }

  return (
    <ModuloLayout voltar titulo="Consumo residencial">
      <View style={styles.secao}>
        <View style={styles.linha}>
          {(['ENERGIA', 'AGUA_RESIDENCIAL'] as const).map((tipo) => {
            const ativo = recurso === tipo;
            return (
              <TouchableOpacity
                key={tipo}
                onPress={() => {
                  setRecurso(tipo);
                  setErro('');
                }}
                style={[styles.opcao, estilos.recurso, ativo && styles.opcaoAtiva]}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
              >
                <Ionicons name={RECURSOS[tipo].icone} size={16} color={ativo ? cores.textoSobrePrimaria : cores.texto} />
                <Text style={[styles.opcaoTexto, ativo && styles.opcaoTextoAtiva]}>{RECURSOS[tipo].nome}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.rotulo}>Mês da conta</Text>
        <View style={[styles.input, estilos.seletorMes]}>
          <Pressable
            onPress={() => mudarMes(-1)}
            style={estilos.seta}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Mês anterior"
          >
            <Ionicons name="chevron-back" size={22} color={cores.primaria} />
          </Pressable>
          <Text style={estilos.mes} accessibilityLiveRegion="polite">
            {formatarMesAno(mesConta)}
          </Text>
          <Pressable
            onPress={() => mudarMes(1)}
            disabled={ehMesAtual}
            style={[estilos.seta, ehMesAtual && estilos.desabilitada]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Próximo mês"
            accessibilityState={{ disabled: ehMesAtual }}
          >
            <Ionicons name="chevron-forward" size={22} color={cores.primaria} />
          </Pressable>
        </View>
        <View style={estilos.rotuloLinha}>
          <Text style={[styles.rotulo, estilos.semMargem]}>
            Consumo{recurso === 'ENERGIA' ? ' (kWh)' : ''}
          </Text>
          {recurso === 'AGUA_RESIDENCIAL' ? (
            <View style={estilos.unidades}>
              {(['M3', 'LITROS'] as const).map((u) => {
                const ativa = unidadeAgua === u;
                return (
                  <Pressable
                    key={u}
                    onPress={() => setUnidadeAgua(u)}
                    style={[estilos.unidade, ativa && estilos.unidadeAtiva]}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={u === 'M3' ? 'Informar em metros cúbicos' : 'Informar em litros'}
                    accessibilityState={{ selected: ativa }}
                  >
                    <Text style={[estilos.unidadeTexto, ativa && estilos.unidadeTextoAtiva]}>{u === 'M3' ? 'm³' : 'litros'}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
        <CampoTexto
          value={quantidade}
          onChangeText={setQuantidade}
          keyboardType="decimal-pad"
          placeholder={PLACEHOLDER[recurso === 'ENERGIA' ? 'ENERGIA' : unidadeAgua]}
        />
        {erro ? <Text style={styles.erro} accessibilityRole="alert">{erro}</Text> : null}
        <TouchableOpacity onPress={salvarRegistro} style={styles.botao} accessibilityRole="button">
          <Text style={styles.botaoTexto}>Registrar</Text>
        </TouchableOpacity>
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        <AvisoMedalha medalhas={novasMedalhas} />
      </View>

      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Histórico</Text>
        {registros.length === 0 ? (
          <EstadoVazio icone="flash-outline" texto="Seus registros mensais aparecerão aqui." />
        ) : (
          registros.map((item, index) => (
            <View key={item.idConsumo} style={[styles.linha, estilos.historico, index > 0 && styles.separador]}>
              <View style={[estilos.historicoIcone, { backgroundColor: cores.consumoSuave }]}>
                <Ionicons name={RECURSOS[item.tipoRecurso].icone} size={14} color={cores.consumo} />
              </View>
              <Text style={[styles.texto, estilos.historicoMes]}>
                {nomeMes(item.mesReferencia)}/{item.anoReferencia}
              </Text>
              <Text style={styles.valor}>{formatarQuantidade(item.tipoRecurso, item.quantidade)}</Text>
            </View>
          ))
        )}
      </View>
    </ModuloLayout>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    seletorMes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
    seta: { padding: 4 },
    desabilitada: { opacity: 0.3 },
    mes: { color: c.texto, fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },
    recurso: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
    rotuloLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    semMargem: { marginBottom: 0 },
    unidades: { flexDirection: 'row', gap: 4 },
    unidade: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: c.bordaForte },
    unidadeAtiva: { backgroundColor: c.primaria, borderColor: c.primaria },
    unidadeTexto: { color: c.texto, fontSize: 12, fontWeight: '600' },
    unidadeTextoAtiva: { color: c.textoSobrePrimaria },
    historico: { justifyContent: 'flex-start' },
    historicoIcone: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
    historicoMes: { flex: 1 },
  });
}
