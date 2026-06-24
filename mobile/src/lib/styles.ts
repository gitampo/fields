import { StyleSheet } from 'react-native';

export const sharedStyles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#D6DFE6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#0A84FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonSecondary: {
    backgroundColor: '#0F5A9E',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorText: {
    color: '#D93025',
    marginTop: -4,
    marginBottom: 8,
    fontSize: 12,
  },
  successText: {
    color: '#188038',
    marginTop: -4,
    marginBottom: 8,
    fontSize: 12,
  },
});
