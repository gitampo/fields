import React, { useMemo } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from './src/hooks/useAuth';
import { AuthContext } from './src/context/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import MainTabs from './src/navigation/MainTabs';

export default function App() {
  const auth = useAuth();
  const isLoggedIn = useMemo(() => auth.token.length > 0, [auth.token]);

  if (!auth.authReady) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#0A84FF" />
        <Text style={styles.splashText}>Ripristino sessione...</Text>
      </SafeAreaView>
    );
  }

  return (
    <AuthContext.Provider value={{ token: auth.token, logout: auth.logout }}>
      <NavigationContainer>
        {!isLoggedIn ? (
          <SafeAreaView style={styles.container}>
            <AuthScreen
              authMode={auth.authMode}
              switchAuthMode={auth.switchAuthMode}
              name={auth.name}
              setName={auth.setName}
              email={auth.email}
              setEmail={auth.setEmail}
              password={auth.password}
              setPassword={auth.setPassword}
              showPassword={auth.showPassword}
              setShowPassword={auth.setShowPassword}
              loading={auth.loading}
              emailError={auth.emailError}
              nameError={auth.nameError}
              passwordError={auth.passwordError}
              formError={auth.formError}
              authSuccess={auth.authSuccess}
              clearMessages={auth.clearMessages}
              handleLogin={auth.handleLogin}
              handleRegister={auth.handleRegister}
            />
          </SafeAreaView>
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
    backgroundColor: '#F5F7FA',
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
    backgroundColor: '#F5F7FA',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
