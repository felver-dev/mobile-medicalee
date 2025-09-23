import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface LoaderProps {
  visible: boolean;
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  overlay?: boolean;
  fullScreen?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ 
  visible, 
  message = 'Chargement...', 
  size = 'large',
  color,
  overlay = false,
  fullScreen = false
}) => {
  const { theme } = useTheme();
  
  if (!visible) return null;

  const loaderColor = color || theme.colors.primary;

  if (fullScreen) {
    return (
      <View style={[styles.fullScreenContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loaderContent}>
          <ActivityIndicator size={size} color={loaderColor} />
          <Text style={[styles.loaderText, { color: theme.colors.textPrimary }]}>
            {message}
          </Text>
        </View>
      </View>
    );
  }

  if (overlay) {
    return (
      <View style={styles.overlayContainer}>
        <View style={[styles.loaderCard, { backgroundColor: theme.colors.surface }]}>
          <ActivityIndicator size={size} color={loaderColor} />
          <Text style={[styles.loaderText, { color: theme.colors.textPrimary }]}>
            {message}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.inlineContainer}>
      <ActivityIndicator size={size} color={loaderColor} />
      <Text style={[styles.loaderText, { color: theme.colors.textPrimary }]}>
        {message}
      </Text>
    </View>
  );
};

interface LoadingCardProps {
  visible: boolean;
  message?: string;
  height?: number;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  visible, 
  message = 'Chargement des données...', 
  height = 200 
}) => {
  const { theme } = useTheme();
  
  if (!visible) return null;

  return (
    <View style={[styles.loadingCard, { backgroundColor: theme.colors.surface, height }]}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  disabled?: boolean;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({ 
  loading, 
  children, 
  onPress, 
  style, 
  disabled = false 
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.buttonContainer, style]}>
      {loading && (
        <View style={styles.buttonLoader}>
          <ActivityIndicator size="small" color="white" />
        </View>
      )}
      {children}
    </View>
  );
};

interface LoadingListProps {
  visible: boolean;
  itemCount?: number;
  message?: string;
}

export const LoadingList: React.FC<LoadingListProps> = ({ 
  visible, 
  itemCount = 3, 
  message = 'Chargement...' 
}) => {
  const { theme } = useTheme();
  
  if (!visible) return null;

  return (
    <View style={styles.loadingListContainer}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <View key={index} style={[styles.loadingItem, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.loadingItemHeader, { backgroundColor: theme.colors.background }]} />
          <View style={[styles.loadingItemContent, { backgroundColor: theme.colors.background }]} />
          <View style={[styles.loadingItemContent, { backgroundColor: theme.colors.background, width: '60%' }]} />
        </View>
      ))}
      <View style={styles.loadingMessage}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.loadingMessageText, { color: theme.colors.textSecondary }]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

interface LoadingModalProps {
  visible: boolean;
  message?: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({ 
  visible, 
  message = 'Traitement en cours...' 
}) => {
  const { theme } = useTheme();
  
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalLoader, { backgroundColor: theme.colors.surface }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.modalLoaderText, { color: theme.colors.textPrimary }]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderContent: {
    alignItems: 'center',
    gap: 16,
  },
  loaderText: {
    fontSize: 16,
    fontWeight: '500',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  loaderCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  loadingCard: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    margin: 16,
  },
  loadingContent: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'relative',
  },
  buttonLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    zIndex: 1,
  },
  loadingListContainer: {
    padding: 20,
  },
  loadingItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingItemHeader: {
    height: 20,
    borderRadius: 4,
    marginBottom: 12,
    opacity: 0.6,
  },
  loadingItemContent: {
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
    opacity: 0.4,
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  loadingMessageText: {
    fontSize: 14,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1001,
  },
  modalLoader: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalLoaderText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default Loader;