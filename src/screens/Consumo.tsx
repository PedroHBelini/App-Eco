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
import { formatarMesAno } from '../utils/formatacao';
import { lerNumero } from '../utils/entrada';
import { vibrarAposRegistro } from '../utils/vibracao';

interface Props {
  usuario: Usuario;
}

function nomeRecurso(tipo: TipoRecurso): string {
  return tipo === 'ENERGIA' ? 'Energia' : 'Água';
}

export default function Consumo({ usuario }: Props) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  const { cores } = useTema();
  const agora = new Date();
  const [recurso, setRecurso] = useState<TipoRecurso>('ENERGIA');
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
    const valor = lerNumero(quantidade);
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
      `${nomeRecurso(recurso)} de ${String(mes).padStart(2, '0')}/${ano} ${jaExistia ? 'atualizado' : 'registrado'}.`,
    );
  }

  return (
    <ModuloLayout voltar titulo="Consumo residencial">
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Novo registro</Text>
        <View style={styles.linha}>
          {(['ENERGIA', 'AGUA_RESIDENCIAL'] as const).map((tipo) => (
            <TouchableOpacity key={tipo} onPress={() => setRecurso(tipo)} style={[styles.opcao, recurso === tipo && styles.opcaoAtiva]}>
              <Text style={[styles.opcaoTexto, recurso === tipo && styles.opcaoTextoAtiva]}>{nomeRecurso(tipo)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.rotulo}>Mês de referência</Text>
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
        <Text style={styles.rotulo}>Consumo ({unidadeDoRecurso(recurso)})</Text>
        <CampoTexto value={quantidade} onChangeText={setQuantidade} keyboardType="decimal-pad" placeholder="Ex.: 125,5" />
        {erro ? <Text style={styles.erro} accessibilityRole="alert">{erro}</Text> : null}
        <TouchableOpacity onPress={salvarRegistro} style={styles.botao}>
          <Text style={styles.botaoTexto}>Registrar consumo</Text>
        </TouchableOpacity>
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        <AvisoMedalha medalhas={novasMedalhas} />
      </View>
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Histórico</Text>
        {registros.length === 0 ? <EstadoVazio icone="flash-outline" texto="Seus registros mensais aparecerão aqui." /> : registros.map((item, index) => (
          <View key={item.idConsumo} style={[styles.linha, index > 0 && styles.separador]}>
            <Text style={styles.texto}>
              {String(item.mesReferencia).padStart(2, '0')}/{item.anoReferencia} · {nomeRecurso(item.tipoRecurso)}
            </Text>
            <Text style={styles.valor}>{item.quantidade} {item.unidade}</Text>
          </View>
        ))}
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
  });
}
