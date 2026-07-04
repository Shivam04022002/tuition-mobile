import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// Types
export interface LoginRequest {
  emailOrMobile: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  role: 'parent' | 'teacher' | 'admin';
  user: {
    id: string;
    email: string;
    phoneNumber: string;
    role: 'parent' | 'teacher' | 'admin';
    profile: {
      firstName: string;
      lastName: string;
      profileImage?: string;
    };
    profileCompleted: boolean;
    onboardingCompleted: boolean;
  };
}

export interface SignupRequest {
  role: 'parent' | 'teacher';
  fullName: string;
  mobileNumber: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    phoneNumber: string;
    role: 'parent' | 'teacher' | 'admin';
    profile: {
      firstName: string;
      lastName: string;
    };
    profileCompleted: boolean;
    onboardingCompleted: boolean;
  };
}

export interface AuthError {
  success: false;
  message: string;
}

// Login API with network debugging
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const url = `${API_BASE_URL}/auth/login`;
  
  console.log('========================================');
  console.log('🔐 LOGIN REQUEST DEBUG');
  console.log('========================================');
  console.log('📡 LOGIN URL:', url);
  console.log('📦 LOGIN PAYLOAD:', JSON.stringify(data, null, 2));
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('📨 RESPONSE STATUS:', response.status);
    console.log('📨 RESPONSE OK:', response.ok);

    const result = await response.json();
    console.log('📨 RESPONSE BODY:', JSON.stringify(result, null, 2));
    console.log('========================================');

    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }

    return result;
  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
    
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      console.error('🔴 NETWORK ERROR DETECTED');
      console.error('   Possible causes:');
      console.error('   1. Backend not running on correct IP/port');
      console.error('   2. Phone and PC not on same WiFi network');
      console.error('   3. Windows Firewall blocking port 5000');
      console.error('   4. CORS not configured for mobile IP');
      console.error('   5. Using localhost/10.0.2.2 on physical device');
      console.error('');
      console.error('✅ SOLUTION:');
      console.error('   1. Backend: server.listen(PORT, "0.0.0.0")');
      console.error('   2. Mobile: Use LAN IP (10.149.172.60) instead of localhost/10.0.2.2');
      console.error('   3. Same WiFi: Ensure phone and PC are connected to same network');
      console.error('   4. Firewall: Allow Node.js through Windows Firewall');
    }
    
    throw error;
  }
};

// Signup API
export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Signup failed');
  }

  return result;
};

// Get current user
export const getCurrentUser = async (token: string): Promise<LoginResponse['user']> => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to get user');
  }

  return result.user;
};

// Send OTP
export const sendOTP = async (
  phoneNumber: string
): Promise<{ success: boolean; message: string; userExists?: boolean; mailServiceDown?: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phoneNumber }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to send OTP');
  }

  return result;
};

// Verify OTP
export const verifyOTP = async (data: { phoneNumber: string; otp: string; role?: string }): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'OTP verification failed');
  }

  return result;
};

// Continue without OTP — only succeeds while the server's mail service for
// OTP verification is actually down (see sendOTP's mailServiceDown flag).
export const continueWithoutOtp = async (data: { phoneNumber: string; role?: string }): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/continue-without-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to continue without OTP');
  }

  return result;
};

// Logout API
export const logout = async (token: string): Promise<void> => {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
