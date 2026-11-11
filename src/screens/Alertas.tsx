import React, { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import ModuloLayout, { moduloStyles as styles } from '../components/ModuloLayout';
import { definirAlertaHabilitado, listarConfiguracoesAlerta } from '../data/repository';
import { TipoAlerta, Usuario } from '../models/types';

interface Props {
  usuario: Usuario;
}

const TEXTOS: Record<TipoAlerta, { titulo: string; descricao: string }> = {
  HIDRATACAO: { titulo: 'Hidratação', descricao: 'Lembretes para beber água' },
  SONO: { titulo: 'Sono', descricao: 'Lembretes para sua rotina de descanso' },
  CONSUMO: { titulo: 'Consumo', descricao: 'Avisos para atualizar os dados da conta' },
};

export default function Alertas({ usuario }: Props) {
  const [configuracoes, setConfiguracoes] = useState(() => listarConfiguracoesAlerta(usuario.idUsuario));

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
              <Text style={styles.secaoTitulo}>{TEXTOS[config.tipoAlerta].titulo}</Text>
              <Text style={styles.texto}>{TEXTOS[config.tipoAlerta].descricao}</Text>
            </View>
            <Switch
              value={config.habilitado}
              onValueChange={(valor) => alternar(config.tipoAlerta, valor)}
              accessibilityLabel={`Ativar alertas de ${TEXTOS[config.tipoAlerta].titulo.toLowerCase()}`}
            />
          </View>
        ))}
      </View>
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Horários e notificações</Text>
        <Text style={styles.texto}>Suas preferências ficam salvas. A escolha de horários e o envio das notificações serão integrados em uma próxima etapa.</Text>
      </View>
    </ModuloLayout>
  );
}
