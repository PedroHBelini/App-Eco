import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ModuloLayout, { moduloStyles as styles } from '../components/ModuloLayout';
import { listarConsumos, registrarConsumo, unidadeDoRecurso, validarConsumo } from '../data/repository';
import { TipoRecurso, Usuario } from '../models/types';

interface Props {
  usuario: Usuario;
}

function nomeRecurso(tipo: TipoRecurso): string {
  return tipo === 'ENERGIA' ? 'Energia' : 'Água';
}

export default function Consumo({ usuario }: Props) {
  const agora = new Date();
  const [recurso, setRecurso] = useState<TipoRecurso>('ENERGIA');
  const [periodo, setPeriodo] = useState(`${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`);
  const [quantidade, setQuantidade] = useState('');
  const [registros, setRegistros] = useState(() => listarConsumos(usuario.idUsuario));
  const [erro, setErro] = useState('');
  const [feedback, setFeedback] = useState('');

  function salvarRegistro() {
    const matchPeriodo = periodo.trim().match(/^(\d{4})-(\d{2})$/);
    const entrada = quantidade.trim();
    const valor = Number(entrada.replace(',', '.'));
    const ano = matchPeriodo ? Number(matchPeriodo[1]) : NaN;
    const mes = matchPeriodo ? Number(matchPeriodo[2]) : NaN;

    if (!matchPeriodo || !/^\d+(?:[.,]\d+)?$/.test(entrada) || !validarConsumo(mes, ano, valor)) {
      setErro('Informe um mês válido (AAAA-MM) e um consumo maior que zero.');
      setFeedback('');
      return;
    }

    const jaExistia = registros.some(
      (c) => c.tipoRecurso === recurso && c.mesReferencia === mes && c.anoReferencia === ano,
    );
    registrarConsumo(usuario.idUsuario, recurso, mes, ano, valor);
    setRegistros(listarConsumos(usuario.idUsuario));
    setQuantidade('');
    setErro('');
    setFeedback(
      `${nomeRecurso(recurso)} de ${String(mes).padStart(2, '0')}/${ano} ${jaExistia ? 'atualizado' : 'registrado'}.`,
    );
  }

  return (
    <ModuloLayout titulo="Consumo residencial" descricao="Informe os valores da sua conta mensal de água e energia.">
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
        <TextInput style={styles.input} value={periodo} onChangeText={setPeriodo} placeholder="AAAA-MM" />
        <Text style={styles.rotulo}>Consumo ({unidadeDoRecurso(recurso)})</Text>
        <TextInput style={styles.input} value={quantidade} onChangeText={setQuantidade} keyboardType="decimal-pad" placeholder="Ex.: 125,5" />
        {erro ? <Text style={styles.erro} accessibilityRole="alert">{erro}</Text> : null}
        <TouchableOpacity onPress={salvarRegistro} style={styles.botao}>
          <Text style={styles.botaoTexto}>Registrar consumo</Text>
        </TouchableOpacity>
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      </View>
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Histórico</Text>
        {registros.length === 0 ? <Text style={styles.texto}>Seus registros mensais aparecerão aqui.</Text> : registros.map((item, index) => (
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
