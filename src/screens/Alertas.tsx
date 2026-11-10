import React, { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import ModuloLayout, { moduloStyles as styles } from '../components/ModuloLayout';

const alertas = [
  { id: 'hidratacao', titulo: 'Hidratação', descricao: 'Lembretes para beber água' },
  { id: 'sono', titulo: 'Sono', descricao: 'Lembretes para sua rotina de descanso' },
  { id: 'consumo', titulo: 'Consumo', descricao: 'Avisos para atualizar os dados da conta' },
] as const;

export default function Alertas() {
  const [habilitados, setHabilitados] = useState<Record<string, boolean>>({ hidratacao: true, sono: false, consumo: false });

  return (
    <ModuloLayout titulo="Alertas" descricao="Escolha quais lembretes você quer manter ativos.">
      <View style={styles.secao}>
        {alertas.map((alerta, index) => (
          <View key={alerta.id} style={[styles.linha, index > 0 && styles.separador]}>
            <View style={styles.alertaTexto}>
              <Text style={styles.secaoTitulo}>{alerta.titulo}</Text>
              <Text style={styles.texto}>{alerta.descricao}</Text>
            </View>
            <Switch
              value={habilitados[alerta.id]}
              onValueChange={(valor) => setHabilitados((atuais) => ({ ...atuais, [alerta.id]: valor }))}
              accessibilityLabel={`Ativar alertas de ${alerta.titulo.toLowerCase()}`}
            />
          </View>
        ))}
      </View>
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Horários e notificações</Text>
        <Text style={styles.texto}>As opções acima alteram apenas esta tela. Agendamento de horários e notificações push ainda precisam ser integrados.</Text>
      </View>
    </ModuloLayout>
  );
}