export async function login(userId: string, password: string) {
  await new Promise(r => setTimeout(r, 150));
  if (userId === 'mahi' && password === '123') return { userId: 'mahi', token: 'dev-token' };
  throw new Error('Invalid credentials');
}

export async function signup({
  userId, email, password,
}: { userId: string; email: string; password: string }) {
  await new Promise(r => setTimeout(r, 150));
  const ok = userId === 'mahi' && email === 'mahi22joshi@gmail.com' && password === '123';
  if (!ok) throw new Error('Use mahi / mahi22joshi@gmail.com / 123');
  return { userId };
}
