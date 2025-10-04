// app/index.tsx
import { Redirect } from 'expo-router';

export default function Index() {
  // Always land on the login screen on app launch
  return <Redirect href="/login" />;
}
