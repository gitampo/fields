type RegisterInput = {
  email?: string;
  password?: string;
  name?: string;
  username?: string;
};

type LoginInput = {
  email?: string;
  password?: string;
  username?: string;
};

const emailRegex = /\S+@\S+\.\S+/;
const strongPasswordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}/;

// Restituisce una lista di errori; se la lista e' vuota, l'input e' valido.
export const validateRegister = (input: RegisterInput): string[] => {
  const errors: string[] = [];
  const email = input.email?.trim();
  const password = input.password;
  const name = input.name?.trim();
  const username = input.username?.trim();

  if (!email || !password || !name) {
    errors.push('Email, password and name are required');
    return errors;
  }

  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  if (email.length > 100) {
    errors.push('Email must be less than 100 characters long');
  }

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (password.length > 100) {
    errors.push('Password must be less than 100 characters long');
  }

  if (!strongPasswordRegex.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character');
  }

  if (name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (name.length > 50) {
    errors.push('Name must be less than 50 characters long');
  }

  if (username && username.length > 30) {
    errors.push('Username must be less than 30 characters long');
  }

  return errors;
};

export const validateLogin = (input: LoginInput): string[] => {
  const errors: string[] = [];
  const email = input.email?.trim();
  const username = input.username?.trim();
  const password = input.password;

  if (!email && !username) {
    errors.push('Either email or username must be provided');
    return errors;
  }

  if (!password) {
    errors.push('Password is required');
    return errors;
  }

  if (email && !emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  if (email && email.length > 100) {
    errors.push('Email must be less than 100 characters long');
  }

  if (password && password.length > 100) {
    errors.push('Password must be less than 100 characters long');
  }

  if(!username && !email) {
    errors.push('Either username or email must be provided');
  }

  return errors;
};

