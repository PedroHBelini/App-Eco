import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ModuloLayout, { moduloStyles as styles } from '../components/ModuloLayout';

type Recurso = 'ENERGIA' | 'AGUA_RESIDENCIAL';
interface Registro { tipo: Recurso; periodo: string; quantidade: number; unidade: string }

export default function Consumo() {
  const agora = new Date();
  const [recurso, setRecurso] = useState<Recurso>('ENERGIA');
  const [periodo, setPeriodo] = useState(`${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`);
  const [quantidade, setQuantidade] = useState('');
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [erro, setErro] = useState('');

  function salvarRegistro() {
    const valor = Number(quantidade.replace(',', '.'));
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo) || !Number.isFinite(valor) || valor <= 0) {
      setErro('Informe um mês válido (AAAA-MM) e um consumo maior que zero.');
      return;
    }
    const unidade = recurso === 'ENERGIA' ? 'kWh' : 'm³';
    setRegistros((atuais) => [{ tipo: recurso, periodo, quantidade: valor, unidade }, ...atuais]);
    setQuantidade('');
    setErro('');
  }

  return (
    <ModuloLayout titulo="Consumo residencial" descricao="Informe os valores da sua conta mensal de água e energia.">
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Novo registro</Text>
        <View style={styles.linha}>
          {(['ENERGIA', 'AGUA_RESIDENCIAL'] as const).map((tipo) => (
            <TouchableOpacity key={tipo} onPress={() => setRecurso(tipo)} style={[styles.opcao, recurso === tipo && styles.opcaoAtiva]}>
              <Text style={[styles.opcaoTexto, recurso === tipo && styles.opcaoTextoAtiva]}>{tipo === 'ENERGIA' ? 'Energia' : 'Água'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.rotulo}>Mês de referência</Text>
        <TextInput style={styles.input} value={periodo} onChangeText={setPeriodo} placeholder="AAAA-MM" />
        <Text style={styles.rotulo}>Consumo ({recurso === 'ENERGIA' ? 'kWh' : 'm³'})</Text>
        <TextInput style={styles.input} value={quantidade} onChangeText={setQuantidade} keyboardType="decimal-pad" placeholder="Ex.: 125,5" />
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}
        <TouchableOpacity onPress={salvarRegistro} style={styles.botao}>
          <Text style={styles.botaoTexto}>Registrar consumo</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Histórico nesta sessão</Text>
        {registros.length === 0 ? <Text style={styles.texto}>Seus registros mensais aparecerão aqui.</Text> : registros.map((item, index) => (
          <View key={`${item.periodo}-${item.tipo}-${index}`} style={[styles.linha, index > 0 && styles.separador]}>
            <Text style={styles.texto}>{item.periodo} · {item.tipo === 'ENERGIA' ? 'Energia' : 'Água'}</Text>
            <Text style={styles.valor}>{item.quantidade} {item.unidade}</Text>
          </View>
        ))}
      </View>
    </ModuloLayout>
  );
}