import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useAuth } from './src/hooks/useAuth';
import { AuthContext } from './src/context/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import MainTabs from './src/navigation/MainTabs';
import Screen from './src/components/Screen';
import { theme } from './src/theme/theme';

export default function App() {
  const auth = useAuth();
  const isLoggedIn = useMemo(() => auth.token.length > 0, [auth.token]);
  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: theme.colors.background,
      },
    }),
    [],
  );

  if (!auth.authReady) {
    return (
      <Screen style={styles.splashContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.splashText}>Ripristino sessione...</Text>
      </Screen>
    );
  }

  return (
    <AuthContext.Provider value={{ token: auth.token, currentUser: auth.currentUser, logout: auth.logout }}>
      <NavigationContainer theme={navigationTheme}>
        {!isLoggedIn ? (
          <Screen style={styles.container}>
            <KeyboardAvoidingView
              style={styles.keyboardWrapper}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
            >
              <ScrollView
                contentContainerStyle={styles.authContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <AuthScreen
                  authMode={auth.authMode}
                  switchAuthMode={auth.switchAuthMode}
                  name={auth.name}
                  setName={auth.setName}
                  email={auth.email}
                  setEmail={auth.setEmail}
                  username={auth.username}
                  setUsername={auth.setUsername}
                  password={auth.password}
                  setPassword={auth.setPassword}
                  showPassword={auth.showPassword}
                  setShowPassword={auth.setShowPassword}
                  loading={auth.loading}
                  emailError={auth.emailError}
                  nameError={auth.nameError}
                  usernameError={auth.usernameError}
                  passwordError={auth.passwordError}
                  formError={auth.formError}
                  authSuccess={auth.authSuccess}
                  clearMessages={auth.clearMessages}
                  handleLogin={auth.handleLogin}
                  handleRegister={auth.handleRegister}
                />
              </ScrollView>
            </KeyboardAvoidingView>
          </Screen>
        ) : (
          <MainTabs />
        )}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    gap: 8,
  },
  splashText: {
    fontSize: 14,
    color: '#54677A',
    fontWeight: '500',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardWrapper: {
    flex: 1,
  },
  authContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
