import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cores } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';

interface Props {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
  scrollable?: boolean;
  voltar?: boolean; // telas abertas por cima das abas mostram a seta de voltar
}

function voltarParaTelaAnterior() {
  if (router.canGoBack()) router.back();
  else router.replace('/inicio');
}

export default function ModuloLayout({ titulo, descricao, children, scrollable = true, voltar = false }: Props) {
  const styles = useEstilos(criarEstilosLayout);
  const { cores } = useTema();

  const cabecalho = (
    <>
      {voltar ? (
        <Pressable
          onPress={voltarParaTelaAnterior}
          style={({ pressed }) => [styles.voltarBotao, pressed && styles.pressionado]}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={cores.primaria} />
        </Pressable>
      ) : null}
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.descricao}>{descricao}</Text>
      </View>
    </>
  );

  if (!scrollable) {
    return (
      <View style={[styles.container, styles.containerFlexivel]}>
        {cabecalho}
        {children}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {cabecalho}
      {children}
    </ScrollView>
  );
}

// Sombra suave dos cartões: elevation no Android, shadow* no iOS.
export function sombraCartao(cores: Cores) {
  return Platform.select({
    android: { elevation: 1 },
    default: { shadowColor: cores.sombra, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  });
}

function criarModuloStyles(c: Cores) {
  return StyleSheet.create({
    secao: {
      backgroundColor: c.superficie,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borda,
      borderRadius: 14,
      padding: 18,
      marginBottom: 16,
      ...sombraCartao(c),
    },
    secaoTitulo: { color: c.texto, fontSize: 17, fontWeight: '700', marginBottom: 10 },
    texto: { color: c.textoSecundario, fontSize: 14, lineHeight: 20 },
    rotulo: { color: c.texto, fontSize: 13, fontWeight: '600', marginBottom: 6 },
    input: {
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.bordaForte,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: c.texto,
      marginBottom: 12,
    },
    botao: { backgroundColor: c.primaria, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    botaoTexto: { color: c.textoSobrePrimaria, fontSize: 15, fontWeight: '700' },
    feedback: { color: c.sucesso, fontSize: 13, marginTop: 10 },
    erro: { color: c.erro, fontSize: 13, marginBottom: 10 },
    linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    separador: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.borda, marginTop: 12, paddingTop: 12 },
    opcao: {
      flex: 1,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.bordaForte,
      borderRadius: 10,
      padding: 11,
      marginBottom: 14,
    },
    opcaoAtiva: { backgroundColor: c.primaria, borderColor: c.primaria },
    opcaoTexto: { color: c.texto, fontWeight: '600' },
    opcaoTextoAtiva: { color: c.textoSobrePrimaria },
    valor: { color: c.texto, fontSize: 15, fontWeight: '700' },
    numero: { color: c.texto, fontSize: 28, fontWeight: '700', marginBottom: 4 },
    barraFundo: { height: 12, backgroundColor: c.superficieSuave, borderRadius: 6, overflow: 'hidden', marginTop: 12 },
    barra: { height: '100%', backgroundColor: c.primaria },
    alertaTexto: { flex: 1 },
    medalha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    medalhaDescricao: { flex: 1 },
    estado: { color: c.textoSuave, fontSize: 12, fontWeight: '600' },
  });
}

// Estilos compartilhados pelas telas dos módulos, já com as cores do tema atual.
export function useModuloStyles() {
  return useEstilos(criarModuloStyles);
}

function criarEstilosLayout(c: Cores) {
  return StyleSheet.create({
    container: { flexGrow: 1, padding: 20, paddingTop: 24, paddingBottom: 36, backgroundColor: c.fundo },
    containerFlexivel: { flex: 1 },
    voltarBotao: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primariaSuave,
      marginBottom: 16,
    },
    pressionado: { opacity: 0.6 },
    cabecalho: { marginBottom: 20 },
    titulo: { color: c.texto, fontSize: 28, fontWeight: '800', letterSpacing: -0.3 },
    descricao: { color: c.textoSecundario, fontSize: 15, lineHeight: 21, marginTop: 6 },
  });
}
