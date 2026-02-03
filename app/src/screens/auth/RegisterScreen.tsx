import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useUser, useToast } from '../../store';
import { Button } from '../../components/Button';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useUser();
  const { showToast } = useToast();

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const success = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
      });

      if (success) {
        showToast('Account created! Welcome to Big Boy!', 'success');
      } else {
        showToast('Registration failed. Please try again.', 'error');
      }
    } catch (error) {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    field: keyof FormData,
    label: string,
    options: {
      placeholder?: string;
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words';
      secureTextEntry?: boolean;
    } = {}
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[field] && styles.inputError]}
        placeholder={options.placeholder || label}
        placeholderTextColor={colors.text.tertiary}
        value={formData[field]}
        onChangeText={(text) => updateField(field, text)}
        keyboardType={options.keyboardType || 'default'}
        autoCapitalize={options.autoCapitalize ?? 'sentences'}
        autoCorrect={false}
        secureTextEntry={options.secureTextEntry}
        editable={!isLoading}
        accessibilityLabel={`${label} input`}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join Big Boy Rewards and start earning points!
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={styles.halfInput}>
                {renderInput('firstName', 'First Name', {
                  autoCapitalize: 'words',
                })}
              </View>
              <View style={styles.halfInput}>
                {renderInput('lastName', 'Last Name', {
                  autoCapitalize: 'words',
                })}
              </View>
            </View>

            {renderInput('email', 'Email', {
              placeholder: 'your@email.com',
              keyboardType: 'email-address',
              autoCapitalize: 'none',
            })}

            {renderInput('phone', 'Phone (Optional)', {
              placeholder: '(248) 555-1234',
              keyboardType: 'phone-pad',
            })}

            {renderInput('password', 'Password', {
              placeholder: 'Min 8 characters',
              secureTextEntry: true,
              autoCapitalize: 'none',
            })}

            {renderInput('confirmPassword', 'Confirm Password', {
              placeholder: 'Re-enter password',
              secureTextEntry: true,
              autoCapitalize: 'none',
            })}

            {/* Terms */}
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.linkInline}>Terms of Service</Text> and{' '}
              <Text style={styles.linkInline}>Privacy Policy</Text>.
            </Text>

            <Button
              title={isLoading ? 'Creating Account...' : 'Create Account'}
              onPress={handleRegister}
              disabled={isLoading}
              style={styles.submitButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing['2xl'],
  },
  title: {
    ...typography.headlineMedium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  form: {
    marginBottom: spacing.xl,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.labelLarge,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.bodyLarge,
    color: colors.text.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.labelSmall,
    color: colors.error,
    marginTop: spacing.xs,
  },
  termsText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  linkInline: {
    color: colors.primary.main,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  footerText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  linkText: {
    ...typography.labelLarge,
    color: colors.primary.main,
  },
});

export default RegisterScreen;
