import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, Button } from '../../components';
import { useUser, useToast } from '../../store';

const ProfileScreen: React.FC = () => {
  const { user, updateUser } = useUser();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would call the API
      updateUser({ firstName, lastName, phone });
      showToast('Profile updated successfully', 'success');
      setIsEditing(false);
    } catch (error) {
      showToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setPhone(user?.phone || '');
    setIsEditing(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {firstName?.[0]}{lastName?.[0]}
          </Text>
        </View>
        <TouchableOpacity style={styles.changePhotoButton}>
          <Ionicons name="camera-outline" size={16} color={colors.primary.main} />
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Form */}
      <Card style={styles.formCard}>
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>First Name</Text>
          <TextInput
            style={[styles.fieldInput, !isEditing && styles.fieldInputDisabled]}
            value={firstName}
            onChangeText={setFirstName}
            editable={isEditing}
            placeholder="Enter first name"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Last Name</Text>
          <TextInput
            style={[styles.fieldInput, !isEditing && styles.fieldInputDisabled]}
            value={lastName}
            onChangeText={setLastName}
            editable={isEditing}
            placeholder="Enter last name"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldInputDisabled]}
            value={user?.email || ''}
            editable={false}
            placeholder="Email"
            placeholderTextColor={colors.text.tertiary}
          />
          <Text style={styles.fieldNote}>Email cannot be changed</Text>
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Phone</Text>
          <TextInput
            style={[styles.fieldInput, !isEditing && styles.fieldInputDisabled]}
            value={phone}
            onChangeText={setPhone}
            editable={isEditing}
            placeholder="Enter phone number"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="phone-pad"
          />
        </View>
      </Card>

      {/* Action Buttons */}
      {isEditing ? (
        <View style={styles.editActions}>
          <Button
            title="Cancel"
            onPress={handleCancel}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={isSaving}
            style={styles.saveButton}
          />
        </View>
      ) : (
        <Button
          title="Edit Profile"
          onPress={() => setIsEditing(true)}
          variant="outline"
        />
      )}

      {/* Member Since */}
      <View style={styles.memberInfo}>
        <Ionicons name="calendar-outline" size={16} color={colors.text.tertiary} />
        <Text style={styles.memberText}>
          Member since {user?.loyaltyStatus?.memberSince ? new Date(user.loyaltyStatus.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    ...typography.displayMedium,
    color: colors.white,
    fontWeight: '700',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  changePhotoText: {
    ...typography.bodyMedium,
    color: colors.primary.main,
    fontWeight: '500',
  },
  formCard: {
    marginBottom: spacing.xl,
  },
  formField: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  fieldInput: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    backgroundColor: colors.warmGray,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  fieldInputDisabled: {
    backgroundColor: colors.warmGray,
    color: colors.text.secondary,
  },
  fieldNote: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  memberText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
});

export default ProfileScreen;
