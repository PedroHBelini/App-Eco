import React, { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import ModuloLayout, { useModuloStyles } from '../components/ModuloLayout';
import { definirAlertaHabilitado, listarConfiguracoesAlerta } from '../data/repository';
import { TipoAlerta, Usuario } from '../models/types';
import { useTema } from '../theme/TemaContext';

interface Props {
  usuario: Usuario;
}

const TEXTOS: Record<TipoAlerta, { titulo: string; descricao: string }> = {
  HIDRATACAO: { titulo: 'Hidratação', descricao: 'Lembretes para beber água' },
  SONO: { titulo: 'Sono', descricao: 'Lembretes para sua rotina de descanso' },
  CONSUMO: { titulo: 'Consumo', descricao: 'Avisos para atualizar os dados da conta' },
};

export default function Alertas({ usuario }: Props) {
  const styles = useModuloStyles();
  const { cores, modo, setModo } = useTema();
  const [configuracoes, setConfiguracoes] = useState(() => listarConfiguracoesAlerta(usuario.idUsuario));
  const coresSwitch = { false: cores.bordaForte, true: cores.primaria };

  function alternar(tipo: TipoAlerta, habilitado: boolean) {
    definirAlertaHabilitado(usuario.idUsuario, tipo, habilitado);
    setConfiguracoes(listarConfiguracoesAlerta(usuario.idUsuario));
  }

  return (
    <ModuloLayout titulo="Alertas" descricao="Escolha quais lembretes você quer manter ativos.">
      <View style={styles.secao}>
        {configuracoes.map((config, index) => (
          <View key={config.tipoAlerta} style={[styles.linha, index > 0 && styles.separador]}>
            <View style={styles.alertaTexto}>
              <Text style={styles.valor}>{TEXTOS[config.tipoAlerta].titulo}</Text>
              <Text style={styles.texto}>{TEXTOS[config.tipoAlerta].descricao}</Text>
            </View>
            <Switch
              value={config.habilitado}
              onValueChange={(valor) => alternar(config.tipoAlerta, valor)}
              trackColor={coresSwitch}
              accessibilityLabel={`Ativar alertas de ${TEXTOS[config.tipoAlerta].titulo.toLowerCase()}`}
            />
          </View>
        ))}
      </View>
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Horários e notificações</Text>
        <Text style={styles.texto}>
          Suas preferências ficam salvas. A escolha de horários e o envio das notificações serão integrados em uma
          próxima etapa.
        </Text>
      </View>
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Aparência</Text>
        <View style={styles.linha}>
          <View style={styles.alertaTexto}>
            <Text style={styles.valor}>Tema escuro</Text>
            <Text style={styles.texto}>Cores escuras, mais confortáveis à noite.</Text>
          </View>
          <Switch
            value={modo === 'escuro'}
            onValueChange={(escuro) => setModo(escuro ? 'escuro' : 'claro')}
            trackColor={coresSwitch}
            accessibilityLabel="Ativar tema escuro"
          />
        </View>
      </View>
    </ModuloLayout>
  );
}
