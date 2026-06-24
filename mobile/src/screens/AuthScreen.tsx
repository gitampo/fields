import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Inter_700Bold, Inter_400Regular } from '@expo-google-fonts/inter';
import { sharedStyles } from '../lib/styles';

type Props = {
  authMode: 'login' | 'register';
  switchAuthMode: (mode: 'login' | 'register') => void;
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean | ((prev: boolean) => boolean)) => void;
  loading: boolean;
  emailError: string;
  nameError: string;
  passwordError: string;
  formError: string;
  authSuccess: string;
  clearMessages: () => void;
  handleLogin: () => void;
  handleRegister: () => void;
};

export default function AuthScreen({
  authMode,
  switchAuthMode,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  emailError,
  nameError,
  passwordError,
  formError,
  authSuccess,
  clearMessages,
  handleLogin,
  handleRegister,
}: Props) {
  const [fontsLoaded] = useFonts({ Inter_700Bold, Inter_400Regular });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Fields</Text>
        <Text style={styles.subtitle}>Prenota il tuo campo sportivo</Text>
      </View>
      <View style={styles.authToggle}>
        <TouchableOpacity
          style={[styles.authToggleButton, authMode === 'login' && styles.authToggleButtonActive]}
          onPress={() => switchAuthMode('login')}
        >
          <Text style={[styles.authToggleLabel, authMode === 'login' && styles.authToggleLabelActive]}>
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.authToggleButton, authMode === 'register' && styles.authToggleButtonActive]}
          onPress={() => switchAuthMode('register')}
        >
          <Text style={[styles.authToggleLabel, authMode === 'register' && styles.authToggleLabelActive]}>
            Registrati
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.cardTitle}>{authMode === 'login' ? 'Accedi' : 'Crea account'}</Text>

      {authMode === 'register' ? (
        <>
          <TextInput
            value={name}
            onChangeText={(v) => { setName(v); clearMessages(); }}
            placeholder="Nome"
            autoCapitalize="words"
            style={sharedStyles.input}
          />
          {nameError ? <Text style={sharedStyles.errorText}>{nameError}</Text> : null}
        </>
      ) : null}

      <TextInput
        value={email}
        onChangeText={(v) => { setEmail(v); clearMessages(); }}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={sharedStyles.input}
      />
      {emailError ? <Text style={sharedStyles.errorText}>{emailError}</Text> : null}

      <TextInput
        value={password}
        onChangeText={(v) => { setPassword(v); clearMessages(); }}
        placeholder="Password"
        secureTextEntry={!showPassword}
        style={sharedStyles.input}
      />
      <TouchableOpacity
        style={styles.passwordToggle}
        onPress={() => setShowPassword((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={showPassword ? 'Nascondi password' : 'Mostra password'}
      >
        <Ionicons
          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color="#0A84FF"
        />
      </TouchableOpacity>
      {passwordError ? <Text style={sharedStyles.errorText}>{passwordError}</Text> : null}

      <TouchableOpacity
        style={sharedStyles.button}
        onPress={authMode === 'login' ? handleLogin : handleRegister}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#FFFFFF" />
          : <Text style={sharedStyles.buttonText}>{authMode === 'login' ? 'Login' : 'Registrati'}</Text>
        }
      </TouchableOpacity>

      {formError ? <Text style={sharedStyles.errorText}>{formError}</Text> : null}
      {authSuccess ? <Text style={sharedStyles.successText}>{authSuccess}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 15,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 50,
    fontFamily: 'Inter_700Bold',
    color: '#0B1F33',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#54677A',
    textAlign: 'center',
    paddingBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0B1F33',
    marginBottom: 10,
  },
  authToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  authToggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D6DFE6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F7FAFD',
  },
  authToggleButtonActive: {
    borderColor: '#0A84FF',
    backgroundColor: '#EAF4FF',
  },
  authToggleLabel: {
    color: '#5C6F82',
    fontWeight: '600',
  },
  authToggleLabelActive: {
    color: '#0A84FF',
  },
  passwordToggle: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
});
