// lib/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = '@fundr/users';
const MAX_USERS = 5; // Hard limit for number of allowed users

type User = {
  email: string;
  userId: string;
  password: string;
  createdAt: string;
};

// Get all users from local storage
async function getAllUsers(): Promise<User[]> {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to get users:', e);
    return [];
  }
}

// Save users to local storage
async function saveUsers(users: User[]): Promise<void> {
  try {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users:', e);
    throw new Error('Failed to save user data');
  }
}

/**
 * Login function - validates credentials
 */
export async function login(userId: string, password: string): Promise<void> {
  if (!userId || !password) {
    throw new Error('Please enter both user ID and password');
  }

  const users = await getAllUsers();
  const user = users.find(u => u.userId.toLowerCase() === userId.toLowerCase());

  if (!user) {
    throw new Error('User not found');
  }

  if (user.password !== password) {
    throw new Error('Incorrect password');
  }

  // Store current user session
  await AsyncStorage.setItem('@fundr/currentUser', userId.toLowerCase());
  
  console.log(`✅ Login successful for user: ${userId}`);
}

/**
 * Signup function - creates new account with limit check
 */
export async function signup(data: {
  email: string;
  userId: string;
  password: string;
}): Promise<void> {
  const { email, userId, password } = data;

  // Validation
  if (!email || !userId || !password) {
    throw new Error('All fields are required');
  }

  if (password.length < 3) {
    throw new Error('Password must be at least 3 characters');
  }

  if (userId.length < 3) {
    throw new Error('User ID must be at least 3 characters');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address');
  }

  const users = await getAllUsers();

  // Check user limit
  if (users.length >= MAX_USERS) {
    throw new Error(`Maximum number of users (${MAX_USERS}) reached. Cannot create new accounts.`);
  }

  // Check if userId already exists
  if (users.some(u => u.userId.toLowerCase() === userId.toLowerCase())) {
    throw new Error('User ID already exists. Please choose a different one.');
  }

  // Check if email already exists
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Email already registered. Please use a different email.');
  }

  // Create new user
  const newUser: User = {
    email: email.toLowerCase(),
    userId: userId.toLowerCase(),
    password,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await saveUsers(users);

  // Store current user session
  await AsyncStorage.setItem('@fundr/currentUser', userId.toLowerCase());

  console.log(`✅ Signup successful for user: ${userId} (${users.length}/${MAX_USERS} accounts)`);
}

/**
 * Get current logged-in user
 */
export async function getCurrentUser(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('@fundr/currentUser');
  } catch (e) {
    console.error('Failed to get current user:', e);
    return null;
  }
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  try {
    await AsyncStorage.removeItem('@fundr/currentUser');
    await AsyncStorage.removeItem('userProfile');
    await AsyncStorage.removeItem('@fundr/matches');
    console.log('✅ Logout successful');
  } catch (e) {
    console.error('Failed to logout:', e);
    throw new Error('Logout failed');
  }
}

/**
 * Get account statistics
 */
export async function getAccountStats(): Promise<{
  totalUsers: number;
  maxUsers: number;
  remainingSlots: number;
}> {
  const users = await getAllUsers();
  return {
    totalUsers: users.length,
    maxUsers: MAX_USERS,
    remainingSlots: MAX_USERS - users.length,
  };
}