import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  loading?: boolean;
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  title,
  message,
  type = 'info',
  showCancel = true,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  onClose,
  loading = false,
}) => {
  const { theme } = useTheme();

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: 'checkmark-circle', color: theme.colors.success };
      case 'warning':
        return { icon: 'warning', color: theme.colors.warning };
      case 'error':
        return { icon: 'close-circle', color: theme.colors.error };
      default:
        return { icon: 'information-circle', color: theme.colors.primary };
    }
  };

  const { icon, color } = getIconAndColor();

  const handleConfirm = () => {
    if (!loading) {
      onConfirm?.();
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onCancel?.() || onClose?.();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          {/* Handle bar */}
          <View style={[styles.handleBar, { backgroundColor: theme.colors.textSecondary }]} />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
              <Ionicons name={icon as any} size={32} color={color} />
            </View>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              {title}
            </Text>
            <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
              {message}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {showCancel && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  { backgroundColor: theme.colors.background },
                  { borderColor: theme.colors.border },
                ]}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={[styles.buttonText, { color: theme.colors.textSecondary }]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: color },
                loading && styles.loadingButton,
              ]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Chargement...</Text>
                </View>
              ) : (
                <Text style={[styles.buttonText, styles.confirmButtonText]}>
                  {confirmText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34, // Safe area bottom
    maxHeight: 400,
    minHeight: 200,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
    opacity: 0.3,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingButton: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Hook pour gérer l'état du modal
export const useModal = () => {
  const [modalState, setModalState] = React.useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'error' | 'success',
    showCancel: true,
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    onConfirm: undefined as (() => void) | undefined,
    onCancel: undefined as (() => void) | undefined,
    onClose: undefined as (() => void) | undefined,
    loading: false,
  });

  const show = (options: {
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
    showCancel?: boolean;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    onClose?: () => void;
    loading?: boolean;
  }) => {
    setModalState({
      visible: true,
      title: options.title,
      message: options.message,
      type: options.type || 'info',
      showCancel: options.showCancel !== false,
      confirmText: options.confirmText || 'Confirmer',
      cancelText: options.cancelText || 'Annuler',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      onClose: options.onClose,
      loading: options.loading || false,
    });
  };

  const hide = () => {
    setModalState(prev => ({ ...prev, visible: false }));
  };

  const showAlert = (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    show({ title, message, type, showCancel: false, confirmText: 'OK' });
  };

  return {
    ...modalState,
    show,
    hide,
    showAlert,
  };
};

export default CustomModal;
