import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { BrandedHeader, Card } from '../../components';
import { MoreStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MoreStackParamList, 'More'>;

const MoreScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <BrandedHeader title="More" />

      <View style={styles.content}>
        <Card style={styles.card} variant="outlined" onPress={() => navigation.navigate('Locations')}>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={20} color={colors.text.primary} />
            <Text style={styles.rowText}>Locations</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
          </View>
        </Card>

        <Card style={styles.card} variant="outlined">
          <View style={styles.row}>
            <Ionicons name="settings-outline" size={20} color={colors.text.primary} />
            <Text style={styles.rowText}>Settings (Coming Soon)</Text>
          </View>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  rowText: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    flex: 1,
    marginLeft: spacing.sm,
  },
});

export default MoreScreen;
