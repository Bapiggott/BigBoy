import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StyleProp,
  ImageStyle,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MenuStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../theme';
import { useFavorites, useToast, useUser } from '../../store';
import { MenuItem } from '../../types';
import { Card } from '../../components/Card';
import { LoadingScreen } from '../../components/LoadingScreen';
import { resolveMenuImage, MENU_IMAGE_PLACEHOLDER } from '../../assets/menuImageMap';

type Props = NativeStackScreenProps<MenuStackParamList, 'Favorites'>;

const MenuItemImage: React.FC<{ item: MenuItem; style?: StyleProp<ImageStyle> }> = ({ item, style }) => {
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

const FavoritesScreen: React.FC<Props> = ({ navigation }) => {
  const { favorites, isLoading, refreshFavorites, toggleFavorite, isFavorite } = useFavorites();
  const { isAuthenticated } = useUser();
  const { showToast } = useToast();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshFavorites();
    setIsRefreshing(false);
  }, [refreshFavorites]);

  const handleToggleFavorite = useCallback(async (item: MenuItem) => {
    if (!isAuthenticated) {
      showToast('Please log in to save favorites', 'warning');
      return;
    }

    try {
      await toggleFavorite(item);
    } catch (error) {
      console.error('Failed to update favorite:', error);
      showToast('Unable to update favorites', 'error');
    }
  }, [isAuthenticated, showToast, toggleFavorite]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={64} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>Log in to see favorites</Text>
          <Text style={styles.emptySubtitle}>Save menu items you love for quick access.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return <LoadingScreen message="Loading favorites..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>Tap the heart on any menu item to save it.</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('MenuItemDetail', { itemId: item.id })}
            variant="elevated"
            padding="none"
          >
            <View style={styles.imageWrap}>
              <MenuItemImage item={item} style={styles.image} />
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => handleToggleFavorite(item)}
                accessibilityLabel={isFavorite(item.id) ? 'Remove favorite' : 'Add favorite'}
              >
                <Ionicons
                  name={isFavorite(item.id) ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavorite(item.id) ? colors.primary.main : colors.text.inverse}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    overflow: 'hidden',
  },
  imageWrap: {
    height: 160,
    backgroundColor: colors.warmGray,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  itemName: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  itemDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  itemPrice: {
    ...typography.titleSmall,
    color: colors.primary.main,
    fontWeight: '700',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.black + '70',
    borderRadius: 20,
    padding: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.headlineSmall,
    color: colors.text.primary,
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default FavoritesScreen;
