import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Href, router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AvisoMedalha from '../components/AvisoMedalha';
import { sombraCartao, useModuloStyles } from '../components/ModuloLayout';
import {
  atualizarGamificacao,
  avaliarDesafioDaSemana,
  buscarAtalhoHidratacao,
  buscarMetaHidratacaoAtiva,
  buscarMetaSonoAtiva,
  calcularProgresso,
  calcularTotalIngeridoHoje,
  listarConsumos,
  listarRegistrosSono,
  registrarIngestao,
  removerIngestao,
  unidadeDoRecurso,
} from '../data/repository';
import { useAtualizarAoFocar } from '../hooks/useAtualizarAoFocar';
import { Medalha, Usuario } from '../models/types';
import { Cores, coresDoModulo, FONTE_MARCA, Modulo } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';
import { hojeISO } from '../utils/datas';
import { vibrarAposRegistro } from '../utils/vibracao';
import { dataDeHojePorExtenso, formatarHoras, formatarNumero, nomeMes } from '../utils/formatacao';

interface Props {
  usuario: Usuario;
}

type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];

function BarraProgresso({ fracao, cor }: { fracao: number; cor?: string }) {
  const estilos = useEstilos(criarEstilos);
  return (
    <View style={estilos.barraFundo}>
      <View style={[estilos.barra, { width: `${Math.round(Math.min(fracao, 1) * 100)}%` }, cor ? { backgroundColor: cor } : null]} />
    </View>
  );
}

function CartaoModulo({ href, icone, titulo, modulo, rotuloAcessivel, children }: {
  href: Href;
  icone: NomeIcone;
  titulo: string;
  modulo?: Modulo; // sem módulo (ex.: desafio), usa a cor primária
  rotuloAcessivel: string;
  children: React.ReactNode;
}) {
  const estilos = useEstilos(criarEstilos);
  const { cores } = useTema();
  const cor = modulo ? coresDoModulo(cores, modulo) : { forte: cores.primaria, suave: cores.primariaSuave };
  return (
    // Sem <Link asChild>: ele mescla o estilo com o do filho e descarta estilos em forma de função.
    <Pressable
      onPress={() => router.push(href)}
      style={({ pressed }) => [estilos.cartao, pressed && estilos.pressionado]}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel}
    >
      <View style={estilos.cartaoCabecalho}>
        <View style={[estilos.icone, { backgroundColor: cor.suave }]}>
          <Ionicons name={icone} size={20} color={cor.forte} />
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
  const { cores } = useTema();
  const [novasMedalhas, setNovasMedalhas] = useState<Medalha[]>([]);
  const [, forcarAtualizacao] = useState(0);
  // Último registro feito pelo botão rápido, para poder desfazer um toque acidental.
  const [ultimoRegistro, setUltimoRegistro] = useState<{ id: string; ml: number } | null>(null);
  // Relê os dados ao voltar de Hidratação/Sono/Consumo e limpa o aviso de medalha antigo.
  useAtualizarAoFocar(() => {
    setNovasMedalhas([]);
    setUltimoRegistro(null);
  });

  const id = usuario.idUsuario;
  const metaAgua = buscarMetaHidratacaoAtiva(id);
  const totalAgua = calcularTotalIngeridoHoje(id);
  const progressoAgua = calcularProgresso(id);
  const atalhoAgua = buscarAtalhoHidratacao(id);

  function adicionarMeuCopo() {
    const progressoAntes = calcularProgresso(id);
    const registro = registrarIngestao(id, atalhoAgua);
    setUltimoRegistro({ id: registro.idIngestao, ml: registro.quantidadeMl });
    const medalhas = atualizarGamificacao(id);
    setNovasMedalhas(medalhas);
    vibrarAposRegistro(medalhas.length > 0 || (progressoAntes < 1 && calcularProgresso(id) >= 1));
    forcarAtualizacao((n) => n + 1);
  }

  function desfazerUltimo() {
    if (!ultimoRegistro) return;
    removerIngestao(id, ultimoRegistro.id);
    atualizarGamificacao(id);
    setUltimoRegistro(null);
    setNovasMedalhas([]);
    forcarAtualizacao((n) => n + 1);
  }

  const metaSono = buscarMetaSonoAtiva(id);
  const ultimaNoite = listarRegistrosSono(id)[0];
  const noiteDeHoje = ultimaNoite?.dataReferencia === hojeISO() ? ultimaNoite : undefined;

  const ultimaConta = listarConsumos(id)[0];
  const desafio = avaliarDesafioDaSemana(id);

  return (
    <ScrollView contentContainerStyle={estilos.container}>
      <View style={estilos.marca} accessibilityRole="header" accessibilityLabel="Ciclo">
        <Image source={require('../../assets/logo.png')} style={estilos.marcaLogo} />
        <Text style={estilos.marcaNome}>Ciclo</Text>
      </View>
      <Text style={estilos.data}>{dataDeHojePorExtenso()}</Text>
      <Text style={estilos.saudacao}>Olá, {usuario.nickname}</Text>

      <Text style={estilos.tituloGrupo}>Hoje</Text>

      <CartaoModulo
        href="/hidratacao"
        icone="water"
        titulo="Hidratação"
        modulo="agua"
        rotuloAcessivel={`Hidratação: ${totalAgua} ml de ${metaAgua?.valorMeta ?? 0} ml hoje. Abrir.`}
      >
        <Text style={estilos.destaque}>
          {formatarNumero(totalAgua)} ml
          <Text style={styles.texto}> de {formatarNumero(metaAgua?.valorMeta ?? 0)} ml</Text>
        </Text>
        <BarraProgresso fracao={progressoAgua} cor={cores.agua} />
        {/* Toque no botão registra; no resto do cartão, abre a tela de Hidratação. */}
        <Pressable
          onPress={adicionarMeuCopo}
          style={({ pressed }) => [estilos.botaoRapido, pressed && estilos.pressionado]}
          accessibilityRole="button"
          accessibilityLabel={`Adicionar meu copo, ${atalhoAgua} ml`}
          hitSlop={4}
        >
          <Ionicons name="add" size={18} color={cores.textoSobrePrimaria} />
          <Text style={estilos.botaoRapidoTexto}>{atalhoAgua} ml · Meu copo</Text>
        </Pressable>
        {ultimoRegistro ? (
          <View style={estilos.desfazerLinha}>
            <Text style={styles.texto}>{ultimoRegistro.ml} ml registrados.</Text>
            <Pressable
              onPress={desfazerUltimo}
              style={({ pressed }) => [estilos.desfazer, pressed && estilos.pressionado]}
              accessibilityRole="button"
              accessibilityLabel={`Desfazer o registro de ${ultimoRegistro.ml} ml`}
              hitSlop={8}
            >
              <Ionicons name="arrow-undo" size={16} color={cores.primaria} />
              <Text style={estilos.desfazerTexto}>Desfazer</Text>
            </Pressable>
          </View>
        ) : null}
      </CartaoModulo>
      {novasMedalhas.length > 0 ? (
        <View style={estilos.aviso}>
          <AvisoMedalha medalhas={novasMedalhas} />
        </View>
      ) : null}

      <CartaoModulo
        href="/sono"
        icone="moon"
        titulo="Sono"
        modulo="sono"
        rotuloAcessivel={`Sono: ${noiteDeHoje ? formatarHoras(noiteDeHoje.duracaoHoras) : 'noite não registrada'}. Abrir.`}
      >
        {noiteDeHoje ? (
          <>
            <Text style={estilos.destaque}>
              {formatarHoras(noiteDeHoje.duracaoHoras)}
              {metaSono ? <Text style={styles.texto}> de {formatarHoras(metaSono.valorMeta)}</Text> : null}
            </Text>
            {metaSono ? <BarraProgresso fracao={noiteDeHoje.duracaoHoras / metaSono.valorMeta} cor={cores.sono} /> : null}
          </>
        ) : (
          <Text style={styles.texto}>Registre como foi a sua noite.</Text>
        )}
      </CartaoModulo>

      <CartaoModulo
        href="/consumo"
        icone="flash"
        titulo="Consumo residencial"
        modulo="consumo"
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
    marca: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
    marcaLogo: { width: 28, height: 28 },
    marcaNome: { fontFamily: FONTE_MARCA, fontSize: 20, color: c.texto },
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
      alignItems: 'center',
      justifyContent: 'center',
    },
    cartaoTitulo: { flex: 1, color: c.texto, fontSize: 16, fontWeight: '700' },
    destaque: { color: c.texto, fontSize: 22, fontWeight: '800' },
    placar: { flexDirection: 'row', justifyContent: 'space-between' },
    botaoRapido: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: c.primaria,
      borderRadius: 10,
      paddingVertical: 11,
      marginTop: 2,
    },
    botaoRapidoTexto: { color: c.textoSobrePrimaria, fontSize: 15, fontWeight: '700' },
    aviso: { marginTop: -10, marginBottom: 18 },
    desfazerLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    desfazer: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 6 },
    desfazerTexto: { color: c.primaria, fontSize: 14, fontWeight: '700' },
    barraFundo: { height: 8, backgroundColor: c.superficieSuave, borderRadius: 4, overflow: 'hidden' },
    barra: { height: '100%', backgroundColor: c.primaria, borderRadius: 4 },
  });
}
