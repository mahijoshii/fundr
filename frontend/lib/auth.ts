// lib/auth.ts
export type SignupInput = { userId: string; email: string; password: string };

export async function login(userId: string, password: string) {
  await new Promise(r => setTimeout(r, 200)); // simulate network
  // TODO: replace with Auth0 login
  if (userId === 'mahi' && password === '123') return { userId, token: 'dev-token' };
  throw new Error('Invalid credentials');
}

export async function signup(input: SignupInput) {
  await new Promise(r => setTimeout(r, 200));
  // TODO: replace with Auth0 signup
  const ok =
    input.userId === 'mahi' &&
    input.email === 'mahi22joshi@gmail.com' &&
    input.password === '123';
  if (!ok) throw new Error('Use mahi / mahi22joshi@gmail.com / 123 for now');
  return { userId: input.userId };
}

