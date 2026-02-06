import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { BrandedHeader, Card, Button } from '../../components';
import { useUser } from '../../store/UserContext';
import { useNetwork } from '../../store/NetworkContext';
import { useToast } from '../../store/ToastContext';
import { storage, STORAGE_KEYS, appStorage } from '../../utils/storage';
import { AccountStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AccountStackParamList, 'Admin'>;

interface AppStats {
  apiCalls: number;
  cacheHits: number;
  errors: number;
  lastSync: string | null;
}

const AdminScreen: React.FC<Props> = ({ navigation }) => {
  const { user, refreshUser } = useUser();
  const { isOffline, setOfflineOverride } = useNetwork();
  const { showToast } = useToast();
  
  const [forceOffline, setForceOffline] = useState(false);
  const [useMockData, setUseMockData] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [stats, setStats] = useState<AppStats>({
    apiCalls: 0,
    cacheHits: 0,
    errors: 0,
    lastSync: null,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await storage.get<{
        forceOffline?: boolean;
        useMockData?: boolean;
        debugMode?: boolean;
      }>(STORAGE_KEYS.USER_PREFERENCES);
      
      if (settings) {
        setForceOffline(settings.forceOffline ?? false);
        setUseMockData(settings.useMockData ?? true);
        setDebugMode(settings.debugMode ?? false);
      }
    } catch (error) {
      console.error('Failed to load admin settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await storage.set(STORAGE_KEYS.USER_PREFERENCES, {
        forceOffline,
        useMockData,
        debugMode,
      });
      showToast('Settings saved', 'success');
    } catch (error) {
      showToast('Failed to save settings', 'error');
    }
  };

  const handleAddPoints = () => {
    const points = parseInt(pointsToAdd);
    if (isNaN(points) || points <= 0) {
      showToast('Please enter a valid number', 'error');
      return;
    }

    Alert.alert(
      'Add Points',
      `Add ${points} points to ${user?.firstName}'s account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: () => {
            // In a real app, this would call the API
            showToast(`Added ${points} points (mock)`, 'success');
            setPointsToAdd('');
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data including saved cart. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.remove(STORAGE_KEYS.CART);
              await storage.remove(STORAGE_KEYS.SELECTED_LOCATION);
              showToast('Cache cleared', 'success');
            } catch (error) {
              showToast('Failed to clear cache', 'error');
            }
          },
        },
      ]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'This will sign you out and clear all local data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await appStorage.clearAuthToken();
              await storage.clear();
              showToast('App reset complete', 'success');
              // Navigation will handle redirect to login
            } catch (error) {
              showToast('Failed to reset app', 'error');
            }
          },
        },
      ]
    );
  };

  const toggleForceOffline = (value: boolean) => {
    setForceOffline(value);
    setOfflineOverride(value ? true : null);
    showToast(value ? 'Offline mode enabled' : 'Offline mode disabled', 'info');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BrandedHeader title="Admin Tools" showBack />
      {/* Warning Banner */}
      <View style={styles.warningBanner}>
        <Ionicons name="warning" size={20} color={colors.warning} />
        <Text style={styles.warningText}>
          Admin Tools - Development Only
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Info */}
        <Card style={styles.userCard}>
          <Text style={styles.cardTitle}>Current User</Text>
          {user ? (
            <>
              <View style={styles.userRow}>
                <Text style={styles.userLabel}>ID:</Text>
                <Text style={styles.userValue}>{user.id}</Text>
              </View>
              <View style={styles.userRow}>
                <Text style={styles.userLabel}>Email:</Text>
                <Text style={styles.userValue}>{user.email}</Text>
              </View>
              <View style={styles.userRow}>
                <Text style={styles.userLabel}>Points:</Text>
                <Text style={styles.userValue}>
                  {user.loyaltyStatus?.currentPoints ?? 0}
                </Text>
              </View>
              <View style={styles.userRow}>
                <Text style={styles.userLabel}>Tier:</Text>
                <Text style={styles.userValue}>
                  {user.loyaltyStatus?.tier?.toUpperCase() ?? 'BRONZE'}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.noUser}>No user logged in</Text>
          )}
        </Card>

        {/* Points Management */}
        {user && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Points Management</Text>
            <View style={styles.pointsRow}>
              <TextInput
                style={styles.pointsInput}
                value={pointsToAdd}
                onChangeText={setPointsToAdd}
                placeholder="Points to add"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="number-pad"
              />
              <Button
                title="Add"
                onPress={handleAddPoints}
                style={styles.addButton}
              />
            </View>
          </Card>
        )}

        {/* Debug Settings */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Debug Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Force Offline Mode</Text>
              <Text style={styles.settingDescription}>
                Simulate offline behavior
              </Text>
            </View>
            <Switch
              value={forceOffline}
              onValueChange={toggleForceOffline}
              trackColor={{ false: colors.lightGray, true: colors.warning }}
              thumbColor={forceOffline ? colors.white : colors.mediumGray}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Use Mock Data</Text>
              <Text style={styles.settingDescription}>
                Bypass API calls with mock responses
              </Text>
            </View>
            <Switch
              value={useMockData}
              onValueChange={setUseMockData}
              trackColor={{ false: colors.lightGray, true: colors.primary.light }}
              thumbColor={useMockData ? colors.primary.main : colors.mediumGray}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Debug Logging</Text>
              <Text style={styles.settingDescription}>
                Enable verbose console logging
              </Text>
            </View>
            <Switch
              value={debugMode}
              onValueChange={setDebugMode}
              trackColor={{ false: colors.lightGray, true: colors.info }}
              thumbColor={debugMode ? colors.white : colors.mediumGray}
            />
          </View>

          <Button
            title="Save Settings"
            onPress={saveSettings}
            variant="outline"
            style={styles.saveButton}
          />
        </Card>

        {/* Network Status */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Network Status</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusIndicator}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isOffline ? colors.error : colors.success },
                ]}
              />
              <Text style={styles.statusText}>
                {isOffline ? 'Offline' : 'Online'}
              </Text>
            </View>
            <Text style={styles.statusDetail}>
              {forceOffline ? '(Forced)' : '(Auto-detected)'}
            </Text>
          </View>
        </Card>

        {/* App Stats */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>App Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.apiCalls}</Text>
              <Text style={styles.statLabel}>API Calls</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.cacheHits}</Text>
              <Text style={styles.statLabel}>Cache Hits</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.errors}</Text>
              <Text style={styles.statLabel}>Errors</Text>
            </View>
          </View>
        </Card>

        {/* Danger Zone */}
        <Card style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleClearCache}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={styles.dangerButtonText}>Clear Cache</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleResetApp}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.error} />
            <Text style={styles.dangerButtonText}>Reset App</Text>
          </TouchableOpacity>
        </Card>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Big Boy App v1.0.0 (Dev Build)</Text>
          <Text style={styles.versionText}>Build: 2024.01.15.001</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warning,
    paddingVertical: spacing.sm,
  },
  warningText: {
    ...typography.labelMedium,
    color: colors.black,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
  },
  userCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.secondary.main,
  },
  cardTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  userLabel: {
    ...typography.bodyMedium,
    color: colors.white,
    opacity: 0.7,
    width: 60,
  },
  userValue: {
    ...typography.bodyMedium,
    color: colors.white,
    flex: 1,
  },
  noUser: {
    ...typography.bodyMedium,
    color: colors.white,
    opacity: 0.7,
  },
  pointsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pointsInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    ...typography.bodyLarge,
    color: colors.text.primary,
    backgroundColor: colors.surface,
  },
  addButton: {
    width: 80,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  settingDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  statusDetail: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.headlineMedium,
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.labelSmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  dangerCard: {
    marginBottom: spacing.md,
    borderColor: colors.error,
    borderWidth: 1,
  },
  dangerTitle: {
    ...typography.titleMedium,
    color: colors.error,
    marginBottom: spacing.md,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  dangerButtonText: {
    ...typography.titleSmall,
    color: colors.error,
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  versionText: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    marginBottom: spacing.xxs,
  },
});

export default AdminScreen;
