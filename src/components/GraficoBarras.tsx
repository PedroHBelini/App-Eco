import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Cores } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';

export interface BarraGrafico {
  chave: string;
  valor: number | null; // null = sem dado (não desenha barra)
  rotuloEixo?: string; // texto sob a barra; omitir para não poluir o eixo
  descricao: string; // mostrado ao tocar na barra
  futura?: boolean; // dia que ainda não chegou: aparece pontilhado
}

interface Props {
  barras: BarraGrafico[];
  formatarValor: (valor: number) => string;
  meta?: number | null; // linha de referência
  rotuloMeta?: string;
  rotuloAcessivel: string;
  cor?: string; // cor das barras; padrão: primária
  indiceInicial?: number; // barra destacada ao abrir; padrão: a última
}

const ALTURA = 150;
const LARGURA_EIXO_Y = 44;
const LARGURA_MAX_BARRA = 24;
const ESPACO_ENTRE_BARRAS = 2;

// Arredonda o topo da escala para um número "limpo" (1, 2, 2,5 ou 5 × 10^n).
function topoDaEscala(valor: number): number {
  if (valor <= 0) return 1;
  const potencia = 10 ** Math.floor(Math.log10(valor));
  for (const fator of [1, 2, 2.5, 5, 10]) {
    if (fator * potencia >= valor) return fator * potencia;
  }
  return 10 * potencia;
}

export default function GraficoBarras({ barras, formatarValor, meta, rotuloMeta = 'meta', rotuloAcessivel, cor, indiceInicial }: Props) {
  const styles = useEstilos(criarEstilos);
  const { cores } = useTema();
  const corBarra = cor ?? cores.primaria;
  const [largura, setLargura] = useState(0);
  // Por padrão destaca o ponto mais recente.
  const [selecionada, setSelecionada] = useState(indiceInicial ?? barras.length - 1);

  const maiorValor = Math.max(0, ...barras.map((b) => b.valor ?? 0), meta ?? 0);
  const topo = topoDaEscala(maiorValor * 1.05);
  const larguraPlot = Math.max(largura - LARGURA_EIXO_Y, 0);
  const larguraSlot = barras.length > 0 ? larguraPlot / barras.length : 0;
  const larguraBarra = Math.max(Math.min(LARGURA_MAX_BARRA, larguraSlot - ESPACO_ENTRE_BARRAS), 2);
  const indiceAtivo = Math.min(selecionada, barras.length - 1);
  const ativa = barras[indiceAtivo];

  function alturaDe(valor: number) {
    return (valor / topo) * ALTURA;
  }

  return (
    <View accessible accessibilityLabel={rotuloAcessivel}>
      <Text style={styles.detalhe} accessibilityLiveRegion="polite">
        {ativa ? ativa.descricao : ' '}
      </Text>

      <View onLayout={(e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)}>
        <View style={{ height: ALTURA, marginTop: 14 }}>
          {/* Grade e eixo Y: 0, metade e topo */}
          {[0, 0.5, 1].map((fracao) => (
            <View key={fracao} style={[styles.linhaGrade, { bottom: fracao * ALTURA }]}>
              <Text style={styles.rotuloEixoY}>{formatarValor(topo * fracao)}</Text>
            </View>
          ))}

          {/* Barras: cada slot inteiro é a área de toque, maior que a barra */}
          <View style={[styles.areaBarras, { left: LARGURA_EIXO_Y }]}>
            {barras.map((barra, indice) => {
              const esmaecida = indice !== indiceAtivo;
              return (
                <Pressable
                  key={barra.chave}
                  onPress={() => setSelecionada(indice)}
                  style={[styles.slot, { width: larguraSlot }]}
                  accessibilityRole="button"
                  accessibilityLabel={barra.descricao}
                >
                  {barra.valor !== null && barra.valor > 0 ? (
                    <View
                      style={[
                        styles.barra,
                        {
                          width: larguraBarra,
                          height: Math.max(alturaDe(barra.valor), 2),
                          backgroundColor: corBarra,
                          opacity: esmaecida ? 0.45 : 1,
                        },
                      ]}
                    />
                  ) : barra.futura ? (
                    <View style={[styles.futura, { width: larguraBarra }]} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {meta ? (
            <View pointerEvents="none" style={[styles.linhaMeta, { bottom: alturaDe(meta), left: LARGURA_EIXO_Y }]}>
              <Text style={styles.rotuloMeta}>{rotuloMeta}</Text>
            </View>
          ) : null}
        </View>

        {/* Eixo X */}
        <View style={[styles.eixoX, { marginLeft: LARGURA_EIXO_Y }]}>
          {barras.map((barra) => (
            <View key={barra.chave} style={{ width: larguraSlot, alignItems: 'center' }}>
              {barra.rotuloEixo ? (
                <Text numberOfLines={1} style={styles.rotuloEixoX}>
                  {barra.rotuloEixo}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    detalhe: { color: c.texto, fontSize: 14, fontWeight: '600', marginBottom: 10 },
    linhaGrade: {
      position: 'absolute',
      left: 0,
      right: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borda,
    },
    rotuloEixoY: { position: 'absolute', left: 0, top: -14, fontSize: 11, color: c.textoSuave },
    areaBarras: { position: 'absolute', right: 0, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-end' },
    slot: { height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
    barra: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    futura: {
      height: 10,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.bordaForte,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },
    linhaMeta: { position: 'absolute', right: 0, borderTopWidth: 2, borderTopColor: c.texto, opacity: 0.7 },
    rotuloMeta: { position: 'absolute', right: 0, top: -17, fontSize: 11, fontWeight: '600', color: c.texto },
    eixoX: { flexDirection: 'row', marginTop: 6, overflow: 'visible' },
    rotuloEixoX: { fontSize: 11, color: c.textoSuave, width: 44, textAlign: 'center' },
  });
}
