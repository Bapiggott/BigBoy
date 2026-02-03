import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Card, LoadingScreen, OfflineBanner } from '../../components';
import { useLocation, useNetwork } from '../../store';
import { Location } from '../../types';
import { LocationsStackParamList } from '../../navigation/types';
import * as locationsApi from '../../api/endpoints/locations';

type LocationsNavigation = NativeStackNavigationProp<LocationsStackParamList, 'Locations'>;

const LocationsScreen: React.FC = () => {
  const navigation = useNavigation<LocationsNavigation>();
  const { selectedLocation, selectLocation, locations } = useLocation();
  const { isOffline } = useNetwork();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLocations = useCallback(async () => {
    try {
      if (searchQuery.trim()) {
        const results = await locationsApi.searchLocations(searchQuery);
        setFilteredLocations(results);
      } else {
        setFilteredLocations(locations);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
      setFilteredLocations(locations);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, locations]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadLocations();
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleSelectLocation = async (location: Location) => {
    await selectLocation(location);
    navigation.goBack();
  };

  const formatHours = (location: Location) => {
    const isOpen = locationsApi.isLocationOpen(location);
    return isOpen ? 'Open Now' : 'Closed';
  };

  const renderLocationItem = ({ item }: { item: Location }) => {
    const isSelected = selectedLocation?.id === item.id;
    const isOpen = locationsApi.isLocationOpen(item);

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('LocationDetail', { locationId: item.id })}
        activeOpacity={0.7}
      >
        <Card style={[styles.locationCard, isSelected ? styles.locationCardSelected : undefined]}>
          <View style={styles.locationHeader}>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{item.name}</Text>
              <Text style={styles.locationAddress}>{item.address}</Text>
              <Text style={styles.locationCity}>
                {item.city}, {item.state} {item.zipCode}
              </Text>
            </View>
            {isSelected && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary.main} />
              </View>
            )}
          </View>

          <View style={styles.locationDetails}>
            <View style={styles.detailItem}>
              <Ionicons
                name="time-outline"
                size={16}
                color={isOpen ? colors.success : colors.error}
              />
              <Text style={[styles.detailText, { color: isOpen ? colors.success : colors.error }]}>
                {formatHours(item)}
              </Text>
            </View>
            {item.phone && (
              <View style={styles.detailItem}>
                <Ionicons name="call-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.detailText}>{item.phone}</Text>
              </View>
            )}
            {item.distance !== undefined && (
              <View style={styles.detailItem}>
                <Ionicons name="navigate-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.detailText}>{item.distance.toFixed(1)} mi</Text>
              </View>
            )}
          </View>

          {/* Amenities */}
          <View style={styles.amenities}>
            {item.amenities?.driveThru && (
              <View style={styles.amenityBadge}>
                <Ionicons name="car-outline" size={12} color={colors.text.secondary} />
                <Text style={styles.amenityText}>Drive-Thru</Text>
              </View>
            )}
            {item.amenities?.wifi && (
              <View style={styles.amenityBadge}>
                <Ionicons name="wifi-outline" size={12} color={colors.text.secondary} />
                <Text style={styles.amenityText}>WiFi</Text>
              </View>
            )}
            {item.amenities?.playground && (
              <View style={styles.amenityBadge}>
                <Ionicons name="football-outline" size={12} color={colors.text.secondary} />
                <Text style={styles.amenityText}>Playground</Text>
              </View>
            )}
          </View>

          {/* Select Button */}
          <TouchableOpacity
            style={[styles.selectButton, isSelected && styles.selectButtonSelected]}
            onPress={() => handleSelectLocation(item)}
          >
            <Text style={[styles.selectButtonText, isSelected && styles.selectButtonTextSelected]}>
              {isSelected ? 'Selected' : 'Select Location'}
            </Text>
          </TouchableOpacity>
        </Card>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Finding locations..." />;
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by city or zip code"
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Locations List */}
      <FlatList
        data={filteredLocations}
        keyExtractor={(item) => item.id}
        renderItem={renderLocationItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No Locations Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try a different search term'
                : 'Unable to load locations'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmGray,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.text.primary,
    paddingVertical: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
  },
  locationCard: {
    marginBottom: spacing.md,
  },
  locationCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  locationAddress: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  locationCity: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  selectedBadge: {
    marginLeft: spacing.md,
  },
  locationDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.warmGray,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  amenityText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
  },
  selectButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.light,
    alignItems: 'center',
  },
  selectButtonSelected: {
    backgroundColor: colors.primary.main,
  },
  selectButtonText: {
    ...typography.labelLarge,
    color: colors.primary.main,
    fontWeight: '600',
  },
  selectButtonTextSelected: {
    color: colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default LocationsScreen;
