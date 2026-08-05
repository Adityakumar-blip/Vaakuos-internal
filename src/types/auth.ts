// Tenant types for navigation
export enum TenantType {
  AGENCY = "agency",
  BUSINESS = "business",
  INTERNAL = "internal",
}

// User information interface
export interface UserInfo {
  id: string;
  email: string;
  name?: string;
  tenantId: string;
  tenantType: TenantType;
  roles: string[];
  permissions: string[];
  forcePasswordChange?: boolean;
  [key: string]: unknown; // Allow additional properties from API
}

// Login request payload
export interface LoginRequest {
  email: string;
  password: string;
}

// Login response from API
// Login response from API
export interface LoginResponse {
  access_token: string;
  user: UserInfo;
}

// Forgot password request payload
export interface ForgotPasswordRequest {
  email: string;
}

// Forgot password response
export interface ForgotPasswordResponse {
  message: string;
  success: boolean;
}

// Reset password request payload
export interface ResetPasswordRequest {
  newPassword: string;
  token: string;
}

// Reset password response
export interface ResetPasswordResponse {
  message: string;
  success: boolean;
}

// OTP verification request (placeholder for future implementation)
export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

// OTP verification response (placeholder for future implementation)
export interface VerifyOtpResponse {
  message: string;
  success: boolean;
  token?: string;
}

// Auth state interface
export interface AuthState {
  token: string;
  resetToken: string;
  userInfo: UserInfo | null;
  permissions: string[];
}
