import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { useToast, Toast, ToastType } from '../store/ToastContext';

const getToastConfig = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        backgroundColor: colors.success,
        icon: 'checkmark-circle' as const,
      };
    case 'error':
      return {
        backgroundColor: colors.error,
        icon: 'alert-circle' as const,
      };
    case 'warning':
      return {
        backgroundColor: colors.warning,
        icon: 'warning' as const,
      };
    case 'info':
    default:
      return {
        backgroundColor: colors.info,
        icon: 'information-circle' as const,
      };
  }
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const config = getToastConfig(toast.type);
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.toastItem,
        { backgroundColor: config.backgroundColor, opacity },
      ]}
    >
      <Ionicons name={config.icon} size={20} color={colors.white} />
      <Text style={styles.toastMessage} numberOfLines={2}>
        {toast.message}
      </Text>
      <TouchableOpacity
        onPress={() => onDismiss(toast.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={18} color={colors.white} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const ToastDisplay: React.FC = () => {
  const { toasts, hideToast } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + spacing.md }]}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={hideToast} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
  },
  toastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toastMessage: {
    ...typography.bodyMedium,
    color: colors.white,
    flex: 1,
  },
});

export default ToastDisplay;
