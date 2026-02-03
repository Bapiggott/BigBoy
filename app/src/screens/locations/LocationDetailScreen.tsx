import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, Button, LoadingScreen } from '../../components';
import { useLocation, useToast } from '../../store';
import { Location } from '../../types';
import * as locationsApi from '../../api/endpoints/locations';

type Props = NativeStackScreenProps<{ LocationDetail: { locationId: string } }, 'LocationDetail'>;

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

const LocationDetailScreen = ({ route }: Props) => {
  const { locationId } = route.params;
  const navigation = useNavigation();
  const { selectedLocation, selectLocation } = useLocation();
  const { showToast } = useToast();

  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isSelected = selectedLocation?.id === locationId;
  const isOpen = location ? locationsApi.isLocationOpen(location) : false;

  const fetchLocation = useCallback(async () => {
    try {
      const data = await locationsApi.getLocation(locationId);
      setLocation(data);
      navigation.setOptions({ title: data?.name || 'Location Details' });
    } catch (error) {
      console.error('Failed to fetch location:', error);
    } finally {
      setIsLoading(false);
    }
  }, [locationId, navigation]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const handleSelectLocation = async () => {
    if (location) {
      await selectLocation(location);
      showToast(`${location.name} selected as your location`, 'success');
    }
  };

  const handleCall = () => {
    if (location?.phone) {
      const phoneNumber = location.phone.replace(/\D/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleDirections = () => {
    if (location?.latitude && location?.longitude) {
      const scheme = Platform.select({
        ios: 'maps:',
        android: 'geo:',
      });
      const url = Platform.select({
        ios: `${scheme}?daddr=${location.latitude},${location.longitude}`,
        android: `${scheme}${location.latitude},${location.longitude}?q=${location.latitude},${location.longitude}(${encodeURIComponent(location.name)})`,
      });
      if (url) {
        Linking.openURL(url);
      }
    }
  };

  const formatDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const getTodayDayName = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  if (isLoading) {
    return <LoadingScreen message="Loading location..." />;
  }

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.text.tertiary} />
        <Text style={styles.errorText}>Location not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusClosed]}>
          <Ionicons
            name={isOpen ? 'checkmark-circle' : 'close-circle'}
            size={16}
            color={isOpen ? colors.success : colors.error}
          />
          <Text style={[styles.statusText, { color: isOpen ? colors.success : colors.error }]}>
            {isOpen ? 'Open Now' : 'Closed'}
          </Text>
        </View>

        {/* Location Info */}
        <Text style={styles.name}>{location.name}</Text>
        <Text style={styles.address}>{location.address}</Text>
        <Text style={styles.city}>
          {location.city}, {location.state} {location.zipCode}
        </Text>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <View style={styles.actionIcon}>
              <Ionicons name="call" size={20} color={colors.primary.main} />
            </View>
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
            <View style={styles.actionIcon}>
              <Ionicons name="navigate" size={20} color={colors.primary.main} />
            </View>
            <Text style={styles.actionText}>Directions</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
            <Ionicons name="call-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.infoText}>{location.phone}</Text>
          </TouchableOpacity>
        </Card>

        {/* Hours */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Hours</Text>
          {location.hours && DAYS_OF_WEEK.map((day) => {
            const hours = location.hours?.[day];
            const isToday = getTodayDayName() === day;
            return (
              <View key={day} style={[styles.hoursRow, isToday && styles.hoursRowToday]}>
                <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                  {formatDayName(day)}
                </Text>
                <Text style={[styles.hoursText, isToday && styles.hoursTextToday]}>
                  {hours || 'Closed'}
                </Text>
              </View>
            );
          })}
        </Card>

        {/* Amenities */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            <View style={styles.amenityItem}>
              <Ionicons
                name={location.amenities?.dineIn ? 'checkmark-circle' : 'close-circle-outline'}
                size={20}
                color={location.amenities?.dineIn ? colors.success : colors.text.tertiary}
              />
              <Text style={styles.amenityText}>Dine-In</Text>
            </View>
            <View style={styles.amenityItem}>
              <Ionicons
                name={location.amenities?.takeout ? 'checkmark-circle' : 'close-circle-outline'}
                size={20}
                color={location.amenities?.takeout ? colors.success : colors.text.tertiary}
              />
              <Text style={styles.amenityText}>Takeout</Text>
            </View>
            <View style={styles.amenityItem}>
              <Ionicons
                name={location.amenities?.driveThru ? 'checkmark-circle' : 'close-circle-outline'}
                size={20}
                color={location.amenities?.driveThru ? colors.success : colors.text.tertiary}
              />
              <Text style={styles.amenityText}>Drive-Thru</Text>
            </View>
            <View style={styles.amenityItem}>
              <Ionicons
                name={location.amenities?.wifi ? 'checkmark-circle' : 'close-circle-outline'}
                size={20}
                color={location.amenities?.wifi ? colors.success : colors.text.tertiary}
              />
              <Text style={styles.amenityText}>WiFi</Text>
            </View>
            <View style={styles.amenityItem}>
              <Ionicons
                name={location.amenities?.playground ? 'checkmark-circle' : 'close-circle-outline'}
                size={20}
                color={location.amenities?.playground ? colors.success : colors.text.tertiary}
              />
              <Text style={styles.amenityText}>Playground</Text>
            </View>
            <View style={styles.amenityItem}>
              <Ionicons
                name={location.amenities?.accessible ? 'checkmark-circle' : 'close-circle-outline'}
                size={20}
                color={location.amenities?.accessible ? colors.success : colors.text.tertiary}
              />
              <Text style={styles.amenityText}>Accessible</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Select Button */}
      <View style={styles.footer}>
        <Button
          title={isSelected ? 'Currently Selected' : 'Select This Location'}
          onPress={handleSelectLocation}
          variant={isSelected ? 'secondary' : 'primary'}
          disabled={isSelected}
        />
      </View>
    </View>
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    marginTop: spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  statusOpen: {
    backgroundColor: colors.semantic.success + '20',
  },
  statusClosed: {
    backgroundColor: colors.semantic.error + '20',
  },
  statusText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  name: {
    ...typography.headlineMedium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  address: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
  },
  city: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
    marginBottom: spacing.xl,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {
    ...typography.labelMedium,
    color: colors.text.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  hoursRowToday: {
    backgroundColor: colors.primary.light,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  dayName: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  dayNameToday: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  hoursText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  hoursTextToday: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  amenityItem: {
    width: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  amenityText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});

export default LocationDetailScreen;
