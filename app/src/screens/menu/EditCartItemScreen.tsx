import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { BrandedHeader, Button, Card } from '../../components';
import { useCart } from '../../store';
import { MenuStackParamList } from '../../navigation/types';
import { getIngredientOptions } from '../../utils/ingredients';

type Props = NativeStackScreenProps<MenuStackParamList, 'EditCartItem'>;

const EditCartItemScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cartItemId } = route.params;
  const {
    cart,
    updateQuantity,
    updateItemInstructions,
    updateItemIngredients,
    updateItemAddOns,
    removeItem,
  } = useCart();

  const item = useMemo(() => cart.items.find((entry) => entry.id === cartItemId), [cart.items, cartItemId]);

  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [instructions, setInstructions] = useState(item?.specialInstructions ?? '');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(
    item?.selectedIngredients ?? item?.ingredientOptions ?? []
  );
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(item?.selectedAddOns ?? []);

  const ingredientOptions = useMemo(() => {
    if (item?.ingredientOptions && item.ingredientOptions.length > 0) {
      return item.ingredientOptions;
    }
    return getIngredientOptions({ name: item?.name ?? '' });
  }, [item]);

  const addOnOptions = useMemo(() => item?.addOnOptions ?? [], [item]);

  if (!item) {
    return (
      <View style={styles.container}>
        <BrandedHeader title="Edit Item" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Item not found.</Text>
          <Button title="Back to Cart" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((itemName) => itemName !== ingredient)
        : [...prev, ingredient]
    );
  };

  const toggleAddOn = (addOn: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOn) ? prev.filter((itemName) => itemName !== addOn) : [...prev, addOn]
    );
  };

  const handleSave = () => {
    updateQuantity(item.id, quantity);
    updateItemInstructions(item.id, instructions);
    updateItemIngredients(item.id, selectedIngredients);
    updateItemAddOns(item.id, selectedAddOns);
    navigation.goBack();
  };

  const handleRemove = () => {
    removeItem(item.id);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <BrandedHeader title="Edit Item" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.section} variant="outlined">
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
            >
              <Ionicons name="remove" size={18} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity((prev) => prev + 1)}
            >
              <Ionicons name="add" size={18} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.section} variant="outlined">
          <Text style={styles.sectionTitle}>Removals</Text>
          <Text style={styles.sectionHint}>Uncheck items to remove</Text>
          {ingredientOptions.map((ingredient) => {
            const enabled = selectedIngredients.includes(ingredient);
            return (
              <TouchableOpacity
                key={ingredient}
                style={styles.ingredientRow}
                onPress={() => toggleIngredient(ingredient)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: enabled }}
              >
                <View style={[styles.ingredientCheckbox, enabled && styles.ingredientCheckboxChecked]}>
                  {enabled && <Ionicons name="checkmark" size={14} color={colors.white} />}
                </View>
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </TouchableOpacity>
            );
          })}
        </Card>

        {addOnOptions.length > 0 && (
          <Card style={styles.section} variant="outlined">
            <Text style={styles.sectionTitle}>Add-ons</Text>
            <View style={styles.addOnsRow}>
              {addOnOptions.map((addOn) => {
                const selected = selectedAddOns.includes(addOn.name);
                return (
                  <TouchableOpacity
                    key={addOn.name}
                    style={[styles.addOnChip, selected && styles.addOnChipSelected]}
                    onPress={() => toggleAddOn(addOn.name)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.addOnChipText, selected && styles.addOnChipTextSelected]}>
                      {addOn.name} +${addOn.priceAdjustment.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        <Card style={styles.section} variant="outlined">
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <TextInput
            style={styles.instructionsInput}
            placeholder="Add instructions"
            placeholderTextColor={colors.text.tertiary}
            value={instructions}
            onChangeText={setInstructions}
            multiline
          />
        </Card>

        <View style={styles.actions}>
          <Button title="Save Changes" onPress={handleSave} />
          <Button title="Remove Item" variant="outline" onPress={handleRemove} />
        </View>
      </ScrollView>
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
  section: {
    padding: spacing.md,
  },
  itemName: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warmGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    ...typography.titleMedium,
    color: colors.text.primary,
    minWidth: 32,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionHint: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.sm,
  },
  ingredientCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border.main,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  ingredientCheckboxChecked: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  ingredientText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  addOnsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  addOnChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary.main,
    backgroundColor: colors.surface,
  },
  addOnChipSelected: {
    backgroundColor: colors.primary.main,
  },
  addOnChipText: {
    ...typography.labelMedium,
    color: colors.primary.main,
  },
  addOnChipTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  instructionsInput: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 80,
    backgroundColor: colors.surface,
  },
  actions: {
    gap: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
});

export default EditCartItemScreen;
