import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Button } from '../../components/Button';
import { useToast } from '../../store';
import * as authApi from '../../api/endpoints/auth';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

const ResetPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { showToast } = useToast();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!token.trim()) {
      setError('Reset token is required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const ok = await authApi.resetPassword(token.trim(), password);
      if (ok) {
        showToast('Password reset. Please sign in.', 'success');
        navigation.navigate('Login');
      } else {
        showToast('Reset failed. Check token and try again.', 'error');
      }
    } catch (err) {
      console.error('Reset password failed:', err);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Set New Password</Text>
            <Text style={styles.subtitle}>
              Paste your reset token and choose a new password.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Reset Token</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Paste token from email"
              placeholderTextColor={colors.text.tertiary}
              value={token}
              onChangeText={(text) => {
                setToken(text);
                if (error) setError(null);
              }}
              autoCapitalize="none"
            />

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="New password"
              placeholderTextColor={colors.text.tertiary}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError(null);
              }}
              secureTextEntry
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Confirm password"
              placeholderTextColor={colors.text.tertiary}
              value={confirm}
              onChangeText={(text) => {
                setConfirm(text);
                if (error) setError(null);
              }}
              secureTextEntry
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title={isSubmitting ? 'Resetting...' : 'Reset Password'}
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitButton}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.backLink}
              accessibilityRole="button"
              accessibilityLabel="Back to login"
            >
              <Text style={styles.backLinkText}>Back to login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: { marginBottom: spacing.xl },
  title: { ...typography.headlineMedium, color: colors.text.primary },
  subtitle: { ...typography.bodyMedium, color: colors.text.secondary, marginTop: spacing.sm },
  form: { marginTop: spacing.lg },
  label: { ...typography.labelLarge, color: colors.text.primary, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.bodyLarge,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  inputError: { borderColor: colors.error },
  errorText: { ...typography.labelSmall, color: colors.error, marginTop: spacing.sm },
  submitButton: { marginTop: spacing.lg },
  backLink: { marginTop: spacing.lg, alignSelf: 'center' },
  backLinkText: { ...typography.labelLarge, color: colors.primary.main },
});

export default ResetPasswordScreen;
