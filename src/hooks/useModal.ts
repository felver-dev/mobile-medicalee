import { useState, useCallback } from 'react';

interface ModalState {
  visible: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  showCancel: boolean;
  confirmText: string;
  cancelText: string;
  loading: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

interface UseModalReturn {
  modalState: ModalState;
  showModal: (config: Partial<ModalState>) => void;
  hideModal: () => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, type?: ModalState['type']) => void;
  showAlert: (title: string, message: string, type?: ModalState['type']) => void;
  showLoading: (message: string) => void;
  hideLoading: () => void;
}

const initialModalState: ModalState = {
  visible: false,
  title: '',
  message: '',
  type: 'info',
  showCancel: true,
  confirmText: 'Confirmer',
  cancelText: 'Annuler',
  loading: false,
};

export const useModal = (): UseModalReturn => {
  const [modalState, setModalState] = useState<ModalState>(initialModalState);

  const showModal = useCallback((config: Partial<ModalState>) => {
    setModalState(prev => ({
      ...prev,
      ...config,
      visible: true,
    }));
  }, []);

  const hideModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      visible: false,
      loading: false,
    }));
  }, []);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    type: ModalState['type'] = 'warning'
  ) => {
    showModal({
      title,
      message,
      type,
      showCancel: true,
      confirmText: 'Confirmer',
      cancelText: 'Annuler',
      onConfirm: () => {
        onConfirm();
        hideModal();
      },
      onCancel: hideModal,
      onClose: hideModal,
    });
  }, [showModal, hideModal]);

  const showAlert = useCallback((
    title: string,
    message: string,
    type: ModalState['type'] = 'info'
  ) => {
    showModal({
      title,
      message,
      type,
      showCancel: false,
      confirmText: 'OK',
      onConfirm: hideModal,
      onClose: hideModal,
    });
  }, [showModal, hideModal]);

  const showLoading = useCallback((message: string) => {
    showModal({
      title: 'Chargement',
      message,
      type: 'info',
      showCancel: false,
      confirmText: '',
      loading: true,
    });
  }, [showModal]);

  const hideLoading = useCallback(() => {
    hideModal();
  }, [hideModal]);

  return {
    modalState,
    showModal,
    hideModal,
    showConfirm,
    showAlert,
    showLoading,
    hideLoading,
  };
};
