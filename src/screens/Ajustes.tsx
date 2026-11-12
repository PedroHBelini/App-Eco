import { Ionicons } from '@react-native-vector-icons/ionicons';
import Constants from 'expo-constants';
import { Href, router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import LinhaComIcone, { NomeIcone } from '../components/LinhaComIcone';
import ModuloLayout, { useModuloStyles } from '../components/ModuloLayout';
import { useAtualizarAoFocar } from '../hooks/useAtualizarAoFocar';
import { buscarMetaHidratacaoAtiva, buscarMetaSonoAtiva, listarConfiguracoesAlerta } from '../data/repository';
import { Usuario } from '../models/types';
import { Cores } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';
import { formatarHoras, formatarNumero } from '../utils/formatacao';

interface Props {
  usuario: Usuario;
}

// Versão do app.json (embutida no build).
const VERSAO = Constants.expoConfig?.version ?? '1.0.0';

// Item de menu que abre uma subtela: ícone, título, resumo do que está configurado e seta.
function ItemMenu({ href, icone, titulo, resumo, separador }: {
  href: Href;
  icone: NomeIcone;
  titulo: string;
  resumo: string;
  separador?: boolean;
}) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  const { cores } = useTema();
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={({ pressed }) => [separador && styles.separador, pressed && estilos.pressionado]}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}: ${resumo}. Abrir.`}
    >
      <LinhaComIcone icone={icone} titulo={titulo} descricao={resumo}>
        <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
      </LinhaComIcone>
    </Pressable>
  );
}

function resumoLembretes(idUsuario: string): string {
  if (Platform.OS === 'web') return 'Disponível no app do celular';
  const ativos = listarConfiguracoesAlerta(idUsuario).filter((c) => c.habilitado).length;
  if (ativos === 0) return 'Desativados';
  return ativos === 1 ? '1 ativo' : `${ativos} ativos`;
}

export default function Ajustes({ usuario }: Props) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  const { cores, modo, setModo } = useTema();
  // Relê os resumos ao voltar de uma subtela.
  useAtualizarAoFocar();
  const coresSwitch = { false: cores.bordaForte, true: cores.primaria };

  const metaAgua = buscarMetaHidratacaoAtiva(usuario.idUsuario);
  const metaSono = buscarMetaSonoAtiva(usuario.idUsuario);
  const resumoMetas = [
    metaAgua ? `${formatarNumero(metaAgua.valorMeta)} ml de água` : 'Sem meta de água',
    metaSono ? `${formatarHoras(metaSono.valorMeta)} de sono` : 'sem meta de sono',
  ].join(' · ');

  return (
    <ModuloLayout titulo="Ajustes">
      <Pressable
        onPress={() => router.push('/ajustes/perfil')}
        style={({ pressed }) => [styles.secao, estilos.perfil, pressed && estilos.pressionado]}
        accessibilityRole="button"
        accessibilityLabel={`Perfil de ${usuario.nome}. Editar.`}
      >
        <View style={estilos.avatar}>
          <Text style={estilos.avatarTexto}>{usuario.nickname.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.alertaTexto}>
          <Text style={styles.valor}>{usuario.nome}</Text>
          <Text style={styles.texto}>@{usuario.nickname}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
      </Pressable>

      <Text style={estilos.tituloGrupo}>Preferências</Text>
      <View style={styles.secao}>
        <ItemMenu href="/ajustes/metas" icone="flag-outline" titulo="Metas" resumo={resumoMetas} />
        <ItemMenu
          href="/ajustes/lembretes"
          icone="notifications-outline"
          titulo="Lembretes"
          resumo={resumoLembretes(usuario.idUsuario)}
          separador
        />
        <View style={styles.separador}>
          <LinhaComIcone icone="contrast-outline" titulo="Tema escuro">
            <Switch
              value={modo === 'escuro'}
              onValueChange={(escuro) => setModo(escuro ? 'escuro' : 'claro')}
              trackColor={coresSwitch}
              accessibilityLabel="Ativar tema escuro"
            />
          </LinhaComIcone>
        </View>
      </View>

      <Text style={estilos.rodape}>Ciclo · versão {VERSAO}</Text>
    </ModuloLayout>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    perfil: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: c.primaria,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarTexto: { color: c.textoSobrePrimaria, fontSize: 22, fontWeight: '800' },
    tituloGrupo: {
      color: c.textoSuave,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 8,
      marginLeft: 4,
    },
    pressionado: { opacity: 0.6 },
    rodape: { color: c.textoSuave, fontSize: 12, textAlign: 'center', marginTop: 8 },
  });
}
