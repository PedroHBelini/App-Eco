import React, { useEffect, useState } from 'react';
import { AppState, Linking, Platform, Pressable, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import CampoDataHora from '../../components/CampoDataHora';
import LinhaComIcone, { NomeIcone } from '../../components/LinhaComIcone';
import ModuloLayout, { useModuloStyles } from '../../components/ModuloLayout';
import { AlteracaoAlerta, definirAlerta, FREQUENCIAS_ALERTA, listarConfiguracoesAlerta } from '../../data/repository';
import { ConfiguracaoAlerta, FrequenciaAlerta, TipoAlerta, Usuario } from '../../models/types';
import { DIA_LEMBRETE_CONSUMO, horariosHidratacao } from '../../services/lembretes';
import { consultarPermissao, EstadoPermissao, pedirPermissao, sincronizarLembretes } from '../../services/notificacoes';
import { Cores, Modulo } from '../../theme/cores';
import { useEstilos, useTema } from '../../theme/TemaContext';
import { deHorario, paraHorario } from '../../utils/datas';

const TEXTOS_ALERTA: Record<TipoAlerta, { titulo: string; descricao: string; icone: NomeIcone; modulo: Modulo }> = {
  HIDRATACAO: { titulo: 'Hidratação', descricao: 'Lembretes para beber água', icone: 'water-outline', modulo: 'agua' },
  SONO: { titulo: 'Sono', descricao: 'Lembretes para sua rotina de descanso', icone: 'moon-outline', modulo: 'sono' },
  CONSUMO: { titulo: 'Consumo', descricao: 'Avisos para atualizar os dados da conta', icone: 'flash-outline', modulo: 'consumo' },
};

const ROTULO_FREQUENCIA: Record<FrequenciaAlerta, string> = {
  A_CADA_1_HORA: 'A cada 1h',
  A_CADA_2_HORAS: 'A cada 2h',
  A_CADA_3_HORAS: 'A cada 3h',
  DIARIA: 'Diário',
  MENSAL: 'Mensal',
};

function resumoAlerta(config: ConfiguracaoAlerta): string {
  switch (config.tipoAlerta) {
    case 'HIDRATACAO': {
      const horarios = horariosHidratacao(config);
      const quantos = horarios.length === 1 ? '1 lembrete' : `${horarios.length} lembretes`;
      return `${quantos} por dia, das ${horarios[0]} às ${horarios[horarios.length - 1]}. Param no dia em que você bate a meta.`;
    }
    case 'SONO':
      return `Todo dia às ${config.horario}.`;
    case 'CONSUMO':
      return `Todo dia ${DIA_LEMBRETE_CONSUMO}, às ${config.horario}, se a conta do mês ainda não foi registrada.`;
  }
}

function ListaAlertas({ usuario }: { usuario: Usuario }) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  const { cores } = useTema();
  const [configuracoes, setConfiguracoes] = useState(() => listarConfiguracoesAlerta(usuario.idUsuario));
  const [permissao, setPermissao] = useState<EstadoPermissao | null>(null);
  const coresSwitch = { false: cores.bordaForte, true: cores.primaria };

  // Relê a permissão ao abrir e ao voltar das configurações do aparelho.
  useEffect(() => {
    const verificar = () => {
      consultarPermissao().then(setPermissao);
    };
    verificar();
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') verificar();
    });
    return () => assinatura.remove();
  }, []);

  // Os lembretes se reagendam sozinhos quando a configuração muda (useLembretes).
  function alterar(tipo: TipoAlerta, alteracao: AlteracaoAlerta) {
    definirAlerta(usuario.idUsuario, tipo, alteracao);
    setConfiguracoes(listarConfiguracoesAlerta(usuario.idUsuario));
  }

  async function alternar(tipo: TipoAlerta, habilitado: boolean) {
    alterar(tipo, { habilitado });
    if (habilitado && permissao !== 'concedida') {
      const novaPermissao = await pedirPermissao();
      setPermissao(novaPermissao);
      if (novaPermissao === 'concedida') sincronizarLembretes();
    }
  }

  const bloqueado = permissao === 'negada' && configuracoes.some((c) => c.habilitado);

  return (
    <View style={styles.secao}>
      {bloqueado ? (
        <View style={estilos.avisoBloqueio}>
          <Text style={estilos.avisoTexto}>
            As notificações do app estão bloqueadas no aparelho, então os lembretes não vão aparecer.
          </Text>
          <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button" style={estilos.avisoBotao}>
            <Text style={estilos.avisoBotaoTexto}>Abrir configurações</Text>
          </Pressable>
        </View>
      ) : null}

      {configuracoes.map((config, index) => {
        const textos = TEXTOS_ALERTA[config.tipoAlerta];
        const frequencias = FREQUENCIAS_ALERTA[config.tipoAlerta];
        const horario = deHorario(config.horario) ?? new Date();
        return (
          <View key={config.tipoAlerta} style={index > 0 && styles.separador}>
            <LinhaComIcone icone={textos.icone} titulo={textos.titulo} descricao={textos.descricao} modulo={textos.modulo}>
              <Switch
                value={config.habilitado}
                onValueChange={(valor) => alternar(config.tipoAlerta, valor)}
                trackColor={coresSwitch}
                accessibilityLabel={`Ativar alertas de ${textos.titulo.toLowerCase()}`}
              />
            </LinhaComIcone>

            {config.habilitado ? (
              <View style={estilos.detalheAlerta}>
                <Text style={styles.rotulo}>
                  {config.tipoAlerta === 'HIDRATACAO' ? 'Primeiro lembrete do dia' : 'Horário'}
                </Text>
                <CampoDataHora
                  modo="time"
                  valor={horario}
                  valorInicial={horario}
                  onChange={(d) => alterar(config.tipoAlerta, { horario: paraHorario(d) })}
                  formatar={paraHorario}
                  placeholder="Escolher horário"
                  rotuloAcessivel={`Horário dos lembretes de ${textos.titulo.toLowerCase()}`}
                />
                {frequencias.length > 1 ? (
                  <View style={[styles.linha, estilos.frequencias]}>
                    {frequencias.map((f) => {
                      const ativa = config.frequencia === f;
                      return (
                        <TouchableOpacity
                          key={f}
                          onPress={() => alterar(config.tipoAlerta, { frequencia: f })}
                          style={[styles.opcao, ativa && styles.opcaoAtiva]}
                          accessibilityRole="button"
                          accessibilityState={{ selected: ativa }}
                        >
                          <Text style={[styles.opcaoTexto, ativa && styles.opcaoTextoAtiva]}>{ROTULO_FREQUENCIA[f]}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
                <Text style={styles.texto}>{resumoAlerta(config)}</Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export default function Lembretes({ usuario }: { usuario: Usuario }) {
  const styles = useModuloStyles();
  return (
    <ModuloLayout voltar titulo="Lembretes">
      {Platform.OS === 'web' ? (
        <View style={styles.secao}>
          <LinhaComIcone
            icone="phone-portrait-outline"
            titulo="Disponível no app do celular"
            descricao="Os lembretes de hidratação, sono e consumo usam as notificações do celular e não funcionam no navegador."
          />
        </View>
      ) : (
        <ListaAlertas usuario={usuario} />
      )}
    </ModuloLayout>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    detalheAlerta: { marginTop: 14, marginLeft: 48 },
    frequencias: { gap: 8, marginBottom: -4 },
    avisoBloqueio: {
      backgroundColor: c.superficieSuave,
      borderWidth: 1,
      borderColor: c.erro,
      borderRadius: 10,
      padding: 12,
      marginBottom: 14,
      gap: 8,
    },
    avisoTexto: { color: c.erro, fontSize: 14, fontWeight: '500' },
    avisoBotao: { alignSelf: 'flex-start' },
    avisoBotaoTexto: { color: c.erro, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  });
}
