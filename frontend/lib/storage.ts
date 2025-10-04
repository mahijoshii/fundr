import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'fundr_profile';
const USER_KEY = 'fundr_user'; // your mock auth can set this

export type Profile = {
  age: string;
  residency: string;
  income: string;
  race: string;
  gender: string;
  studentStatus: string;
  immigrantStatus: string;
  indigenousStatus: string;
  veteranStatus: string;
  orgType?: 'None' | 'Nonprofit' | 'Small Business';
  funding_purpose?: string[];
  eligibility_tags?: string[];
};

export type User = { userId: string; email: string };

export async function setProfile(p: Profile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}
export async function getProfile(): Promise<Profile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function setUser(u: User) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
}
export async function getUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
