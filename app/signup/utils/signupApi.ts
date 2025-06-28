export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  success: boolean;
  message?: string;
}

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
  const res = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let message = 'Signup failed';
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {}
    throw new Error(message);
  }
  return res.json();
} 