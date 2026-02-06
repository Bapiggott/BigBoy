import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { BrandedHeader, Card, Button, OfflineBanner } from '../../components';
import { useNetwork } from '../../store/NetworkContext';
import { useToast } from '../../store/ToastContext';

interface GiftCard {
  id: string;
  code: string;
  balance: number;
  lastFour: string;
  addedAt: string;
}

// Mock gift cards
const mockGiftCards: GiftCard[] = [
  {
    id: 'gc-1',
    code: 'XXXX-XXXX-XXXX-1234',
    balance: 25.00,
    lastFour: '1234',
    addedAt: '2024-12-15',
  },
  {
    id: 'gc-2',
    code: 'XXXX-XXXX-XXXX-5678',
    balance: 50.00,
    lastFour: '5678',
    addedAt: '2024-11-20',
  },
];

const GiftCardsScreen: React.FC = () => {
  const { isOffline } = useNetwork();
  const { showToast } = useToast();
  const [giftCards, setGiftCards] = useState<GiftCard[]>(mockGiftCards);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardPin, setNewCardPin] = useState('');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleAddCard = () => {
    if (!newCardNumber.trim()) {
      showToast('Please enter a card number', 'error');
      return;
    }
    if (!newCardPin.trim()) {
      showToast('Please enter the PIN', 'error');
      return;
    }

    // Simulate adding card
    const lastFour = newCardNumber.slice(-4);
    const newCard: GiftCard = {
      id: `gc-${Date.now()}`,
      code: `XXXX-XXXX-XXXX-${lastFour}`,
      balance: Math.floor(Math.random() * 100) + 10, // Random balance for demo
      lastFour,
      addedAt: new Date().toISOString().split('T')[0],
    };

    setGiftCards([...giftCards, newCard]);
    setNewCardNumber('');
    setNewCardPin('');
    setShowAddCard(false);
    showToast('Gift card added successfully!', 'success');
  };

  const handleRemoveCard = (cardId: string) => {
    Alert.alert(
      'Remove Gift Card',
      'Are you sure you want to remove this gift card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setGiftCards(giftCards.filter(c => c.id !== cardId));
            showToast('Gift card removed', 'info');
          },
        },
      ]
    );
  };

  const totalBalance = giftCards.reduce((sum, card) => sum + card.balance, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BrandedHeader title="Gift Cards" showBack />
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Total Balance Card */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Gift Card Balance</Text>
          <Text style={styles.balanceAmount}>${totalBalance.toFixed(2)}</Text>
          <Text style={styles.balanceSubtext}>
            {giftCards.length} card{giftCards.length !== 1 ? 's' : ''} on file
          </Text>
        </Card>

        {/* Gift Cards List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Gift Cards</Text>

          {giftCards.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="gift-outline" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No gift cards added yet</Text>
              <Text style={styles.emptySubtext}>
                Add a gift card to use it for your orders
              </Text>
            </Card>
          ) : (
            giftCards.map(card => (
              <Card key={card.id} style={styles.cardItem}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconContainer}>
                    <Ionicons name="gift" size={24} color={colors.primary.main} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardNumber}>•••• {card.lastFour}</Text>
                    <Text style={styles.cardAdded}>Added {card.addedAt}</Text>
                  </View>
                  <View style={styles.cardBalance}>
                    <Text style={styles.cardBalanceAmount}>
                      ${card.balance.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveCard(card.id)}
                  accessibilityLabel="Remove gift card"
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </Card>
            ))
          )}
        </View>

        {/* Add Gift Card Section */}
        {showAddCard ? (
          <Card style={styles.addCardForm}>
            <Text style={styles.addCardTitle}>Add Gift Card</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.input}
                value={newCardNumber}
                onChangeText={setNewCardNumber}
                placeholder="Enter 16-digit card number"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="number-pad"
                maxLength={16}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PIN</Text>
              <TextInput
                style={styles.input}
                value={newCardPin}
                onChangeText={setNewCardPin}
                placeholder="Enter 4-digit PIN"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>

            <View style={styles.addCardButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddCard(false);
                  setNewCardNumber('');
                  setNewCardPin('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Button
                title="Add Card"
                onPress={handleAddCard}
                style={styles.addButton}
              />
            </View>
          </Card>
        ) : (
          <Button
            title="Add Gift Card"
            onPress={() => setShowAddCard(true)}
            variant="outline"
            icon={<Ionicons name="add" size={20} color={colors.primary.main} />}
            style={styles.addCardButton}
          />
        )}

        {/* Info Section */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.infoText}>
              Gift cards can be used at any Big Boy location
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.infoText}>
              Balances are protected and never expire
            </Text>
          </View>
        </Card>
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
  balanceCard: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    marginBottom: spacing.lg,
    backgroundColor: colors.primary.main,
  },
  balanceLabel: {
    ...typography.labelMedium,
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    ...typography.displayMedium,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  balanceSubtext: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.8,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  cardItem: {
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardNumber: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  cardAdded: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  cardBalance: {
    alignItems: 'flex-end',
  },
  cardBalanceAmount: {
    ...typography.titleLarge,
    color: colors.success,
  },
  removeButton: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    alignItems: 'center',
  },
  removeButtonText: {
    ...typography.labelMedium,
    color: colors.error,
  },
  addCardForm: {
    marginBottom: spacing.lg,
  },
  addCardTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    ...typography.bodyLarge,
    color: colors.text.primary,
    backgroundColor: colors.surface,
  },
  addCardButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: 8,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.text.secondary,
    textTransform: 'none',
  },
  addButton: {
    flex: 1,
  },
  addCardButton: {
    marginBottom: spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.warmGray,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
});

export default GiftCardsScreen;
