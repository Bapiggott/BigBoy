import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { BrandedHeader, Card, OfflineBanner } from '../../components';
import { useNetwork } from '../../store/NetworkContext';
import { useToast } from '../../store/ToastContext';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: '1',
    question: 'How do I earn rewards points?',
    answer: 'You earn 10 points for every $1 spent on qualifying purchases. Points are automatically added to your account after each order is completed.',
  },
  {
    id: '2',
    question: 'How do I redeem my rewards?',
    answer: 'Go to the Rewards tab, browse available rewards, and tap "Redeem" on any reward you have enough points for. You\'ll receive a code to use at checkout.',
  },
  {
    id: '3',
    question: 'Can I modify my order after placing it?',
    answer: 'Orders can be modified within 2 minutes of placing. After that, please contact the restaurant directly for any changes.',
  },
  {
    id: '4',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit/debit cards, Apple Pay, Google Pay, and Big Boy gift cards. Cash payment is available for in-restaurant orders.',
  },
  {
    id: '5',
    question: 'How does pickup work?',
    answer: 'After placing your order, you\'ll receive an estimated ready time. When you arrive, check in through the app or at the counter to pick up your order.',
  },
  {
    id: '6',
    question: 'What are the loyalty tier benefits?',
    answer: 'Bronze: Earn points on purchases. Silver (1,000+ lifetime points): Birthday reward + exclusive offers. Gold (5,000+ lifetime points): Double points days + priority support.',
  },
];

const HelpSupportScreen: React.FC = () => {
  const { isOffline } = useNetwork();
  const { showToast } = useToast();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const handleCall = () => {
    Linking.openURL('tel:+18005555555').catch(() => {
      showToast('Unable to make call', 'error');
    });
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@bigboy.com?subject=App Support Request').catch(() => {
      showToast('Unable to open email', 'error');
    });
  };

  const handleWebsite = () => {
    Linking.openURL('https://www.bigboy.com/support').catch(() => {
      showToast('Unable to open website', 'error');
    });
  };

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BrandedHeader title="Help & Support" showBack />
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactGrid}>
            <TouchableOpacity
              style={styles.contactCard}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="call" size={28} color={colors.primary.main} />
              </View>
              <Text style={styles.contactLabel}>Call</Text>
              <Text style={styles.contactValue}>1-800-555-5555</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={handleEmail}
              activeOpacity={0.7}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="mail" size={28} color={colors.primary.main} />
              </View>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>support@bigboy.com</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.websiteButton}
            onPress={handleWebsite}
            activeOpacity={0.7}
          >
            <Ionicons name="globe-outline" size={20} color={colors.primary.main} />
            <Text style={styles.websiteButtonText}>Visit Support Center</Text>
            <Ionicons name="open-outline" size={16} color={colors.primary.main} />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq) => (
            <Card key={faq.id} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => toggleFAQ(faq.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
              {expandedFAQ === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </Card>
          ))}
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <Card style={styles.linksCard}>
            <TouchableOpacity style={styles.linkItem}>
              <Ionicons name="document-text-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.linkText}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
            <View style={styles.linkDivider} />
            <TouchableOpacity style={styles.linkItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
            <View style={styles.linkDivider} />
            <TouchableOpacity style={styles.linkItem}>
              <Ionicons name="accessibility-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.linkText}>Accessibility</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
            <View style={styles.linkDivider} />
            <TouchableOpacity style={styles.linkItem}>
              <Ionicons name="nutrition-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.linkText}>Nutrition Information</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Support Hours */}
        <Card style={styles.hoursCard}>
          <View style={styles.hoursHeader}>
            <Ionicons name="time-outline" size={20} color={colors.text.primary} />
            <Text style={styles.hoursTitle}>Support Hours</Text>
          </View>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursDay}>Monday - Friday</Text>
            <Text style={styles.hoursTime}>8:00 AM - 10:00 PM EST</Text>
          </View>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursDay}>Saturday - Sunday</Text>
            <Text style={styles.hoursTime}>9:00 AM - 8:00 PM EST</Text>
          </View>
        </Card>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Big Boy App v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 Big Boy Restaurants International</Text>
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
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  contactGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  contactCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  contactIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contactLabel: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
  },
  contactValue: {
    ...typography.bodySmall,
    color: colors.text.primary,
    textAlign: 'center',
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  websiteButtonText: {
    ...typography.titleSmall,
    color: colors.primary.main,
  },
  faqCard: {
    marginBottom: spacing.sm,
    padding: 0,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  faqQuestion: {
    ...typography.titleSmall,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },
  faqAnswer: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  faqAnswerText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  linksCard: {
    padding: 0,
    overflow: 'hidden',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  linkText: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    flex: 1,
  },
  linkDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginLeft: spacing.lg + 20 + spacing.md,
  },
  hoursCard: {
    marginBottom: spacing.xl,
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  hoursTitle: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  hoursDay: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  hoursTime: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  appVersion: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  appCopyright: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
  },
});

export default HelpSupportScreen;
