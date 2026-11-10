import React from 'react';
import { Text, View } from 'react-native';
import { buscarMetaHidratacaoAtiva, calcularTotalIngeridoHoje } from '../data/mockRepository';
import { useUsuario } from '../context/UsuarioContext';
import ModuloLayout, { moduloStyles as styles } from '../components/ModuloLayout';

export default function Relatorios() {
  const { usuario } = useUsuario();
  const meta = usuario ? buscarMetaHidratacaoAtiva(usuario.idUsuario) : undefined;
  const total = usuario ? calcularTotalIngeridoHoje(usuario.idUsuario) : 0;
  const progresso = meta && meta.valorMeta > 0 ? Math.min(total / meta.valorMeta, 1) : 0;

  return (
    <ModuloLayout titulo="Relatórios" descricao="Acompanhe seus hábitos e consumo ao longo do tempo.">
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Hidratação de hoje</Text>
        <Text style={styles.numero}>{total} ml</Text>
        <Text style={styles.texto}>Meta: {meta ? `${meta.valorMeta} ml` : 'não definida'} · {Math.round(progresso * 100)}% concluído</Text>
        <View style={styles.barraFundo}>
          <View style={[styles.barra, { width: `${Math.round(progresso * 100)}%` }]} />
        </View>
      </View>
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Visão semanal e mensal</Text>
        <Text style={styles.texto}>Ainda não há histórico suficiente para montar os gráficos. Os registros desta sessão não são mantidos após fechar o aplicativo.</Text>
      </View>
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Dados previstos</Text>
        <Text style={styles.texto}>Hidratação · Sono · Água residencial · Energia</Text>
      </View>
    </ModuloLayout>
  );
}