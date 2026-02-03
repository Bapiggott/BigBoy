import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { OfflineBanner } from '../../components/OfflineBanner';
import { useNetwork } from '../../store/NetworkContext';
import { useToast } from '../../store/ToastContext';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

const NotificationsScreen: React.FC = () => {
  const { isOffline } = useNetwork();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const [pushSettings, setPushSettings] = useState<NotificationSetting[]>([
    {
      id: 'order_updates',
      title: 'Order Updates',
      description: 'Get notified when your order status changes',
      enabled: true,
      icon: 'receipt-outline',
    },
    {
      id: 'promotions',
      title: 'Promotions & Offers',
      description: 'Receive special deals and limited-time offers',
      enabled: true,
      icon: 'pricetag-outline',
    },
    {
      id: 'rewards',
      title: 'Rewards Alerts',
      description: 'Know when you earn or can redeem rewards',
      enabled: true,
      icon: 'gift-outline',
    },
    {
      id: 'new_items',
      title: 'New Menu Items',
      description: 'Be the first to know about new dishes',
      enabled: false,
      icon: 'restaurant-outline',
    },
  ]);

  const [emailSettings, setEmailSettings] = useState<NotificationSetting[]>([
    {
      id: 'email_receipts',
      title: 'Order Receipts',
      description: 'Receive email receipts for your orders',
      enabled: true,
      icon: 'mail-outline',
    },
    {
      id: 'email_newsletter',
      title: 'Newsletter',
      description: 'Weekly updates and exclusive content',
      enabled: false,
      icon: 'newspaper-outline',
    },
    {
      id: 'email_rewards',
      title: 'Rewards Summary',
      description: 'Monthly summary of your rewards activity',
      enabled: true,
      icon: 'stats-chart-outline',
    },
  ]);

  const [smsSettings, setSmsSettings] = useState<NotificationSetting[]>([
    {
      id: 'sms_order',
      title: 'Order Ready Alerts',
      description: 'Text message when your order is ready',
      enabled: false,
      icon: 'chatbubble-outline',
    },
    {
      id: 'sms_deals',
      title: 'Flash Deals',
      description: 'Time-sensitive offers via text',
      enabled: false,
      icon: 'flash-outline',
    },
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const togglePushSetting = (id: string) => {
    setPushSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
    showToast('Preference updated', 'success');
  };

  const toggleEmailSetting = (id: string) => {
    setEmailSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
    showToast('Preference updated', 'success');
  };

  const toggleSmsSetting = (id: string) => {
    setSmsSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
    showToast('Preference updated', 'success');
  };

  const renderSettingItem = (
    setting: NotificationSetting,
    onToggle: (id: string) => void
  ) => (
    <View key={setting.id} style={styles.settingItem}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={setting.icon} size={22} color={colors.primary.main} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{setting.title}</Text>
        <Text style={styles.settingDescription}>{setting.description}</Text>
      </View>
      <Switch
        value={setting.enabled}
        onValueChange={() => onToggle(setting.id)}
        trackColor={{ false: colors.lightGray, true: colors.primary.light }}
        thumbColor={setting.enabled ? colors.primary.main : colors.mediumGray}
        ios_backgroundColor={colors.lightGray}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Push Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={20} color={colors.text.primary} />
            <Text style={styles.sectionTitle}>Push Notifications</Text>
          </View>
          <Card style={styles.settingsCard}>
            {pushSettings.map((setting, index) => (
              <View key={setting.id}>
                {renderSettingItem(setting, togglePushSetting)}
                {index < pushSettings.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </Card>
        </View>

        {/* Email Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail" size={20} color={colors.text.primary} />
            <Text style={styles.sectionTitle}>Email Notifications</Text>
          </View>
          <Card style={styles.settingsCard}>
            {emailSettings.map((setting, index) => (
              <View key={setting.id}>
                {renderSettingItem(setting, toggleEmailSetting)}
                {index < emailSettings.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </Card>
        </View>

        {/* SMS Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubbles" size={20} color={colors.text.primary} />
            <Text style={styles.sectionTitle}>Text Messages</Text>
          </View>
          <Card style={styles.settingsCard}>
            {smsSettings.map((setting, index) => (
              <View key={setting.id}>
                {renderSettingItem(setting, toggleSmsSetting)}
                {index < smsSettings.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </Card>
        </View>

        {/* Info Notice */}
        <Card style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.info} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>About Notifications</Text>
            <Text style={styles.infoText}>
              You can change your notification preferences at any time. 
              Standard message and data rates may apply for SMS notifications.
            </Text>
          </View>
        </Card>

        {/* Quiet Hours Notice */}
        <Card style={styles.quietCard}>
          <View style={styles.quietHeader}>
            <Ionicons name="moon-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.quietTitle}>Quiet Hours</Text>
          </View>
          <Text style={styles.quietText}>
            We won't send push notifications between 10 PM and 8 AM unless it's 
            about an active order.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    ...typography.titleSmall,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  settingDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginLeft: spacing.lg + 40 + spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.warmGray,
    marginBottom: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...typography.titleSmall,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  quietCard: {
    backgroundColor: colors.secondary.main,
  },
  quietHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  quietTitle: {
    ...typography.titleSmall,
    color: colors.white,
  },
  quietText: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.9,
    lineHeight: 18,
  },
});

export default NotificationsScreen;
