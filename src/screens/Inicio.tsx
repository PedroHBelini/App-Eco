import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Href, router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { sombraCartao, useModuloStyles } from '../components/ModuloLayout';
import {
  avaliarDesafioDaSemana,
  buscarMetaHidratacaoAtiva,
  buscarMetaSonoAtiva,
  calcularProgresso,
  calcularTotalIngeridoHoje,
  listarConsumos,
  listarRegistrosSono,
  unidadeDoRecurso,
} from '../data/repository';
import { useAtualizarAoFocar } from '../hooks/useAtualizarAoFocar';
import { Usuario } from '../models/types';
import { Cores } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';
import { dataDeHojePorExtenso, formatarHoras, formatarNumero, nomeMes } from '../utils/formatacao';

interface Props {
  usuario: Usuario;
}

type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];

function hojeISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function BarraProgresso({ fracao }: { fracao: number }) {
  const estilos = useEstilos(criarEstilos);
  return (
    <View style={estilos.barraFundo}>
      <View style={[estilos.barra, { width: `${Math.round(Math.min(fracao, 1) * 100)}%` }]} />
    </View>
  );
}

function CartaoModulo({ href, icone, titulo, rotuloAcessivel, children }: {
  href: Href;
  icone: NomeIcone;
  titulo: string;
  rotuloAcessivel: string;
  children: React.ReactNode;
}) {
  const estilos = useEstilos(criarEstilos);
  const { cores } = useTema();
  return (
    // Sem <Link asChild>: ele mescla o estilo com o do filho e descarta estilos em forma de função.
    <Pressable
      onPress={() => router.push(href)}
      style={({ pressed }) => [estilos.cartao, pressed && estilos.pressionado]}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel}
    >
      <View style={estilos.cartaoCabecalho}>
        <View style={estilos.icone}>
          <Ionicons name={icone} size={20} color={cores.primaria} />
        </View>
        <Text style={estilos.cartaoTitulo}>{titulo}</Text>
        <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
      </View>
      {children}
    </Pressable>
  );
}

export default function Inicio({ usuario }: Props) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  // Relê os dados ao voltar de Hidratação/Sono/Consumo.
  useAtualizarAoFocar();

  const id = usuario.idUsuario;
  const metaAgua = buscarMetaHidratacaoAtiva(id);
  const totalAgua = calcularTotalIngeridoHoje(id);
  const progressoAgua = calcularProgresso(id);

  const metaSono = buscarMetaSonoAtiva(id);
  const ultimaNoite = listarRegistrosSono(id)[0];
  const noiteDeHoje = ultimaNoite?.dataReferencia === hojeISO() ? ultimaNoite : undefined;

  const ultimaConta = listarConsumos(id)[0];
  const desafio = avaliarDesafioDaSemana(id);

  return (
    <ScrollView contentContainerStyle={estilos.container}>
      <Text style={estilos.data}>{dataDeHojePorExtenso()}</Text>
      <Text style={estilos.saudacao}>Olá, {usuario.nickname}</Text>

      <Text style={estilos.tituloGrupo}>Hoje</Text>

      <CartaoModulo
        href="/hidratacao"
        icone="water"
        titulo="Hidratação"
        rotuloAcessivel={`Hidratação: ${totalAgua} ml de ${metaAgua?.valorMeta ?? 0} ml hoje. Abrir.`}
      >
        <Text style={estilos.destaque}>
          {formatarNumero(totalAgua)} ml
          <Text style={styles.texto}> de {formatarNumero(metaAgua?.valorMeta ?? 0)} ml</Text>
        </Text>
        <BarraProgresso fracao={progressoAgua} />
      </CartaoModulo>

      <CartaoModulo
        href="/sono"
        icone="moon"
        titulo="Sono"
        rotuloAcessivel={`Sono: ${noiteDeHoje ? formatarHoras(noiteDeHoje.duracaoHoras) : 'noite não registrada'}. Abrir.`}
      >
        {noiteDeHoje ? (
          <>
            <Text style={estilos.destaque}>
              {formatarHoras(noiteDeHoje.duracaoHoras)}
              {metaSono ? <Text style={styles.texto}> de {formatarHoras(metaSono.valorMeta)}</Text> : null}
            </Text>
            {metaSono ? <BarraProgresso fracao={noiteDeHoje.duracaoHoras / metaSono.valorMeta} /> : null}
          </>
        ) : (
          <Text style={styles.texto}>Registre como foi a sua noite.</Text>
        )}
      </CartaoModulo>

      <CartaoModulo
        href="/consumo"
        icone="flash"
        titulo="Consumo residencial"
        rotuloAcessivel="Consumo residencial. Abrir."
      >
        {ultimaConta ? (
          <Text style={styles.texto}>
            Última conta: {ultimaConta.tipoRecurso === 'ENERGIA' ? 'energia' : 'água'} de{' '}
            {nomeMes(ultimaConta.mesReferencia)}/{ultimaConta.anoReferencia} ·{' '}
            <Text style={styles.valor}>
              {formatarNumero(ultimaConta.quantidade, 1)} {unidadeDoRecurso(ultimaConta.tipoRecurso)}
            </Text>
          </Text>
        ) : (
          <Text style={styles.texto}>Registre os valores da sua conta de energia e de água.</Text>
        )}
      </CartaoModulo>

      <Text style={estilos.tituloGrupo}>Desafio da semana</Text>

      <CartaoModulo
        href="/gamificacao"
        icone="trophy"
        titulo={desafio.desafio.nome}
        rotuloAcessivel={`Desafio da semana: ${desafio.desafio.nome}, ${desafio.atual} de ${desafio.desafio.alvo} dias. Abrir conquistas.`}
      >
        <Text style={styles.texto}>{desafio.desafio.descricao}</Text>
        <View style={estilos.placar}>
          <Text style={styles.valor}>
            {desafio.atual} de {desafio.desafio.alvo} dias
          </Text>
          <Text style={styles.valor}>{desafio.pontuacao} pontos</Text>
        </View>
        <BarraProgresso fracao={desafio.atual / desafio.desafio.alvo} />
      </CartaoModulo>
    </ScrollView>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: { flexGrow: 1, padding: 20, paddingTop: 24, paddingBottom: 32, backgroundColor: c.fundo },
    data: { color: c.textoSuave, fontSize: 14, fontWeight: '600' },
    saudacao: { color: c.texto, fontSize: 28, fontWeight: '800', letterSpacing: -0.3, marginTop: 2, marginBottom: 16 },
    tituloGrupo: {
      color: c.textoSuave,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: 8,
      marginBottom: 10,
      marginLeft: 4,
    },
    cartao: {
      backgroundColor: c.superficie,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borda,
      borderRadius: 14,
      padding: 18,
      marginBottom: 18,
      gap: 12,
      ...sombraCartao(c),
    },
    pressionado: { opacity: 0.7 },
    cartaoCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    icone: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.primariaSuave,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cartaoTitulo: { flex: 1, color: c.texto, fontSize: 16, fontWeight: '700' },
    destaque: { color: c.texto, fontSize: 22, fontWeight: '800' },
    placar: { flexDirection: 'row', justifyContent: 'space-between' },
    barraFundo: { height: 8, backgroundColor: c.superficieSuave, borderRadius: 4, overflow: 'hidden' },
    barra: { height: '100%', backgroundColor: c.primaria, borderRadius: 4 },
  });
}
