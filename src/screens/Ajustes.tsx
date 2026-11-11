import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import ModuloLayout, { useModuloStyles } from '../components/ModuloLayout';
import { definirAlertaHabilitado, listarConfiguracoesAlerta } from '../data/repository';
import { TipoAlerta, Usuario } from '../models/types';
import { Cores } from '../theme/cores';
import { useEstilos, useTema } from '../theme/TemaContext';

interface Props {
  usuario: Usuario;
}

type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];

const TEXTOS_ALERTA: Record<TipoAlerta, { titulo: string; descricao: string; icone: NomeIcone }> = {
  HIDRATACAO: { titulo: 'Hidratação', descricao: 'Lembretes para beber água', icone: 'water-outline' },
  SONO: { titulo: 'Sono', descricao: 'Lembretes para sua rotina de descanso', icone: 'moon-outline' },
  CONSUMO: { titulo: 'Consumo', descricao: 'Avisos para atualizar os dados da conta', icone: 'flash-outline' },
};

function LinhaComIcone({ icone, titulo, descricao, children }: {
  icone: NomeIcone;
  titulo: string;
  descricao: string;
  children?: React.ReactNode;
}) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  const { cores } = useTema();
  return (
    <View style={styles.linha}>
      <View style={estilos.icone}>
        <Ionicons name={icone} size={20} color={cores.primaria} />
      </View>
      <View style={styles.alertaTexto}>
        <Text style={styles.valor}>{titulo}</Text>
        <Text style={styles.texto}>{descricao}</Text>
      </View>
      {children}
    </View>
  );
}

export default function Ajustes({ usuario }: Props) {
  const styles = useModuloStyles();
  const estilos = useEstilos(criarEstilos);
  const { cores, modo, setModo } = useTema();
  const [configuracoes, setConfiguracoes] = useState(() => listarConfiguracoesAlerta(usuario.idUsuario));
  const coresSwitch = { false: cores.bordaForte, true: cores.primaria };

  function alternar(tipo: TipoAlerta, habilitado: boolean) {
    definirAlertaHabilitado(usuario.idUsuario, tipo, habilitado);
    setConfiguracoes(listarConfiguracoesAlerta(usuario.idUsuario));
  }

  return (
    <ModuloLayout titulo="Ajustes" descricao="Seu perfil, lembretes e aparência do app.">
      <View style={styles.secao}>
        <View style={estilos.perfil}>
          <View style={estilos.avatar}>
            <Text style={estilos.avatarTexto}>{usuario.nickname.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.alertaTexto}>
            <Text style={styles.secaoTitulo}>{usuario.nome}</Text>
            <Text style={styles.texto}>@{usuario.nickname}</Text>
            <Text style={styles.texto}>{usuario.email}</Text>
          </View>
        </View>
        <Text style={[styles.estado, estilos.privacidade]}>
          Nos rankings aparece apenas o seu nickname.
        </Text>
      </View>

      <Text style={estilos.tituloGrupo}>Alertas</Text>
      <View style={styles.secao}>
        {configuracoes.map((config, index) => {
          const textos = TEXTOS_ALERTA[config.tipoAlerta];
          return (
            <View key={config.tipoAlerta} style={index > 0 && styles.separador}>
              <LinhaComIcone icone={textos.icone} titulo={textos.titulo} descricao={textos.descricao}>
                <Switch
                  value={config.habilitado}
                  onValueChange={(valor) => alternar(config.tipoAlerta, valor)}
                  trackColor={coresSwitch}
                  accessibilityLabel={`Ativar alertas de ${textos.titulo.toLowerCase()}`}
                />
              </LinhaComIcone>
            </View>
          );
        })}
        <Text style={[styles.estado, estilos.nota]}>
          Suas preferências ficam salvas. Horários e notificações serão integrados em uma próxima etapa.
        </Text>
      </View>

      <Text style={estilos.tituloGrupo}>Aparência</Text>
      <View style={styles.secao}>
        <LinhaComIcone icone="moon" titulo="Tema escuro" descricao="Cores escuras, mais confortáveis à noite.">
          <Switch
            value={modo === 'escuro'}
            onValueChange={(escuro) => setModo(escuro ? 'escuro' : 'claro')}
            trackColor={coresSwitch}
            accessibilityLabel="Ativar tema escuro"
          />
        </LinhaComIcone>
      </View>
    </ModuloLayout>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    perfil: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.primaria,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarTexto: { color: c.textoSobrePrimaria, fontSize: 24, fontWeight: '800' },
    privacidade: { marginTop: 12 },
    tituloGrupo: {
      color: c.textoSuave,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 8,
      marginLeft: 4,
    },
    icone: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.primariaSuave,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nota: { marginTop: 14, fontWeight: '500' },
  });
}
