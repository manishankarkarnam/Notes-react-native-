import React, { createContext, useState, useContext } from 'react';
import { View } from 'react-native';
import AlertModal from '../components/AlertModal';
import { Text } from 'react-native';

const AlertContext = createContext({});

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    type: 'default'
  });

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  const showAlert = ({ title, message, buttons = [{ text: 'OK' }], type = 'default' }) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons,
      type
    });
  };

  // Helper functions for common alert types
  const showErrorAlert = (title, message, buttons) => {
    showAlert({
      title,
      message,
      buttons: buttons || [{ text: 'OK' }],
      type: 'error'
    });
  };

  const showSuccessAlert = (title, message, buttons) => {
    showAlert({
      title,
      message,
      buttons: buttons || [{ text: 'OK' }],
      type: 'success'
    });
  };

  const showWarningAlert = (title, message, buttons) => {
    showAlert({
      title,
      message,
      buttons: buttons || [{ text: 'OK' }],
      type: 'warning'
    });
  };

  const showConfirmationAlert = (title, message, onConfirm, onCancel) => {
    showAlert({
      title,
      message,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'Confirm', onPress: onConfirm }
      ]
    });
  };

  const showDestructiveAlert = (title, message, onConfirm, onCancel) => {
    showAlert({
      title,
      message,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'Delete', style: 'destructive', onPress: onConfirm }
      ],
      type: 'warning'
    });
  };

  return (
    <AlertContext.Provider 
      value={{ 
        showAlert, 
        showErrorAlert, 
        showSuccessAlert, 
        showWarningAlert, 
        showConfirmationAlert,
        showDestructiveAlert
      }}
    >
      <View style={{ flex: 1 }}>
        {React.Children.map(children, child => 
          typeof child === 'string' ? null : child
        )}
        <AlertModal
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={alertState.buttons}
          type={alertState.type}
          onDismiss={hideAlert}
        />
      </View>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export default AlertContext;
