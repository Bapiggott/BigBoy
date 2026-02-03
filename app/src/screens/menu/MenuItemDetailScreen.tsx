import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  StyleProp,
  ImageStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useCart, useToast } from '../../store';
import { Button } from '../../components/Button';
import { LoadingScreen } from '../../components/LoadingScreen';
import { getMenuItem } from '../../api';
import { MenuItem, ModifierGroup, Modifier, CartItem } from '../../types';
import { resolveMenuImage, MENU_IMAGE_PLACEHOLDER } from '../../assets/menuImageMap';

type MenuStackParamList = {
  Menu: { categoryId?: string };
  MenuItemDetail: { itemId: string };
  Cart: undefined;
};

type Props = NativeStackScreenProps<MenuStackParamList, 'MenuItemDetail'>;

interface SelectedModifier {
  groupId: string;
  groupName: string;
  modifierId: string;
  name: string;
  priceAdjustment: number;
}

const MenuItemImage: React.FC<{ item: MenuItem; style?: StyleProp<ImageStyle> }> = ({
  item,
  style,
}) => {
  const resolved = resolveMenuImage(item);
  const [source, setSource] = useState(resolved.source);

  useEffect(() => {
    setSource(resolved.source);
  }, [item.id, item.imageUrl, item.image]);

  return (
    <Image
      source={source}
      style={style}
      resizeMode="cover"
      onError={() => setSource(MENU_IMAGE_PLACEHOLDER)}
    />
  );
};

const MenuItemDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { itemId } = route.params;
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<Map<string, SelectedModifier[]>>(new Map());
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const item = await getMenuItem(itemId);
        setMenuItem(item);

        // Set default modifiers
        if (item?.modifierGroups) {
          const defaults = new Map<string, SelectedModifier[]>();
          item.modifierGroups.forEach((group) => {
            const defaultMods = group.modifiers
              .filter((m) => m.isDefault)
              .map((m) => ({
                groupId: group.id,
                groupName: group.name,
                modifierId: m.id,
                name: m.name,
                priceAdjustment: m.priceAdjustment || 0,
              }));
            if (defaultMods.length > 0) {
              defaults.set(group.id, defaultMods);
            }
          });
          setSelectedModifiers(defaults);
        }
      } catch (error) {
        console.error('Failed to load menu item:', error);
        showToast('Failed to load item details', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [itemId, showToast]);

  const toggleModifier = useCallback((group: ModifierGroup, modifier: Modifier) => {
    setSelectedModifiers((prev) => {
      const newMap = new Map(prev);
      const groupModifiers = newMap.get(group.id) || [];
      const existingIndex = groupModifiers.findIndex((m) => m.modifierId === modifier.id);

      if (existingIndex >= 0) {
        // Remove if already selected
        if (!group.isRequired || groupModifiers.length > group.minSelect) {
          const updated = groupModifiers.filter((_, i) => i !== existingIndex);
          if (updated.length === 0) {
            newMap.delete(group.id);
          } else {
            newMap.set(group.id, updated);
          }
        }
      } else {
        // Add if not at max
        if (groupModifiers.length < group.maxSelect) {
          newMap.set(group.id, [
            ...groupModifiers,
            {
              groupId: group.id,
              groupName: group.name,
              modifierId: modifier.id,
              name: modifier.name,
              priceAdjustment: modifier.priceAdjustment || 0,
            },
          ]);
        } else if (group.maxSelect === 1) {
          // Replace for single-select groups
          newMap.set(group.id, [
            {
              groupId: group.id,
              groupName: group.name,
              modifierId: modifier.id,
              name: modifier.name,
              priceAdjustment: modifier.priceAdjustment || 0,
            },
          ]);
        }
      }

      return newMap;
    });
  }, []);

  const isModifierSelected = (groupId: string, modifierId: string): boolean => {
    const groupModifiers = selectedModifiers.get(groupId) || [];
    return groupModifiers.some((m) => m.modifierId === modifierId);
  };

  const calculateTotal = (): number => {
    if (!menuItem) return 0;
    let total = menuItem.price;

    selectedModifiers.forEach((modifiers) => {
      modifiers.forEach((mod) => {
        total += mod.priceAdjustment;
      });
    });

    return total * quantity;
  };

  const handleAddToCart = () => {
    if (!menuItem) return;

    // Validate required modifiers
    const missingRequired = menuItem.modifierGroups?.filter((group) => {
      if (!group.isRequired) return false;
      const selected = selectedModifiers.get(group.id) || [];
      return selected.length < group.minSelect;
    });

    if (missingRequired && missingRequired.length > 0) {
      showToast(`Please select ${missingRequired[0].name}`, 'error');
      return;
    }

    // Flatten modifiers for cart
    const cartModifiers: CartItem['modifiers'] = [];
    selectedModifiers.forEach((modifiers) => {
      modifiers.forEach((mod) => {
        cartModifiers.push({
          groupId: mod.groupId,
          groupName: mod.groupName,
          modifierId: mod.modifierId,
          modifierName: mod.name,
          name: mod.name,
          priceAdjustment: mod.priceAdjustment,
        });
      });
    });

    addItem(
      menuItem,
      quantity,
      cartModifiers.length > 0 ? cartModifiers : undefined,
      specialInstructions || undefined
    );

    showToast(`${menuItem.name} added to cart!`, 'success');
    navigation.goBack();
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  if (isLoading) {
    return <LoadingScreen message="Loading item details..." />;
  }

  if (!menuItem) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>Item not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imagePlaceholder}>
          <MenuItemImage item={menuItem} style={styles.image} />
          {menuItem.isPopular && (
            <View style={styles.popularBadge}>
              <Ionicons name="flame" size={14} color={colors.white} />
              <Text style={styles.popularBadgeText}>Popular</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.itemName}>{menuItem.name}</Text>
            <Text style={styles.itemPrice}>{formatPrice(menuItem.price)}</Text>
          </View>

          <Text style={styles.itemDescription}>{menuItem.description}</Text>

          {/* Nutrition */}
          {(menuItem.calories || menuItem.prepTime) && (
            <View style={styles.nutritionRow}>
              {menuItem.calories && (
                <View style={styles.nutritionItem}>
                  <Ionicons name="flame-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.nutritionText}>{menuItem.calories} cal</Text>
                </View>
              )}
              {menuItem.prepTime && (
                <View style={styles.nutritionItem}>
                  <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.nutritionText}>{menuItem.prepTime} min</Text>
                </View>
              )}
            </View>
          )}

          {/* Modifiers */}
          {menuItem.modifierGroups && menuItem.modifierGroups.length > 0 && (
            <View style={styles.modifiersSection}>
              {menuItem.modifierGroups.map((group) => (
                <View key={group.id} style={styles.modifierGroup}>
                  <View style={styles.modifierGroupHeader}>
                    <Text style={styles.modifierGroupName}>{group.name}</Text>
                    {group.isRequired && (
                      <Text style={styles.requiredBadge}>Required</Text>
                    )}
                  </View>
                  <Text style={styles.modifierGroupHint}>
                    {group.maxSelect === 1
                      ? 'Select one'
                      : `Select up to ${group.maxSelect}`}
                  </Text>

                  {group.modifiers.map((modifier) => (
                    <TouchableOpacity
                      key={modifier.id}
                      style={[
                        styles.modifierOption,
                        isModifierSelected(group.id, modifier.id) && styles.modifierOptionSelected,
                      ]}
                      onPress={() => toggleModifier(group, modifier)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isModifierSelected(group.id, modifier.id) }}
                    >
                      <View style={styles.modifierLeft}>
                        <View
                          style={[
                            styles.checkbox,
                            group.maxSelect === 1 ? styles.radio : null,
                            isModifierSelected(group.id, modifier.id) && styles.checkboxSelected,
                          ]}
                        >
                          {isModifierSelected(group.id, modifier.id) && (
                            <Ionicons
                              name={group.maxSelect === 1 ? 'ellipse' : 'checkmark'}
                              size={group.maxSelect === 1 ? 8 : 14}
                              color={colors.white}
                            />
                          )}
                        </View>
                        <Text style={styles.modifierName}>{modifier.name}</Text>
                      </View>
                      {modifier.priceAdjustment !== undefined && modifier.priceAdjustment > 0 && (
                        <Text style={styles.modifierPrice}>
                          +{formatPrice(modifier.priceAdjustment)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Special Instructions */}
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsLabel}>Special Instructions</Text>
            <TextInput
              style={styles.instructionsInput}
              placeholder="e.g., No onions, extra sauce..."
              placeholderTextColor={colors.text.tertiary}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Quantity Selector */}
        <View style={styles.quantitySelector}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            accessibilityLabel="Decrease quantity"
          >
            <Ionicons
              name="remove"
              size={20}
              color={quantity <= 1 ? colors.text.tertiary : colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity((q) => q + 1)}
            accessibilityLabel="Increase quantity"
          >
            <Ionicons name="add" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Add to Cart Button */}
        <Button
          title={`Add to Cart • ${formatPrice(calculateTotal())}`}
          onPress={handleAddToCart}
          style={styles.addButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  imagePlaceholder: {
    height: 250,
    backgroundColor: colors.warmGray,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  popularBadge: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  popularBadgeText: {
    ...typography.labelMedium,
    color: colors.white,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  itemName: {
    ...typography.headlineSmall,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },
  itemPrice: {
    ...typography.headlineSmall,
    color: colors.primary.main,
    fontWeight: '700',
  },
  itemDescription: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nutritionText: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },
  modifiersSection: {
    marginBottom: spacing.xl,
  },
  modifierGroup: {
    marginBottom: spacing.xl,
  },
  modifierGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  modifierGroupName: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  requiredBadge: {
    ...typography.labelSmall,
    color: colors.error,
    backgroundColor: colors.error + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  modifierGroupHint: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  modifierOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  modifierOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  modifierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  radio: {
    borderRadius: 11,
  },
  checkboxSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  modifierName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  modifierPrice: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },
  instructionsSection: {
    marginBottom: spacing.xl,
  },
  instructionsLabel: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  instructionsInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    padding: spacing.md,
    ...typography.bodyMedium,
    color: colors.text.primary,
    minHeight: 80,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.md,
    ...shadows.lg,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmGray,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
  },
  quantityButton: {
    width: 40,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    ...typography.titleMedium,
    color: colors.text.primary,
    minWidth: 30,
    textAlign: 'center',
  },
  addButton: {
    flex: 1,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
});

export default MenuItemDetailScreen;
