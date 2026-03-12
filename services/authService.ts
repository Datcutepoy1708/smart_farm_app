import { Alert } from 'react-native';
import { API_CONFIG, getApiUrl } from '../config/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: number;
      fullName: string;
      email: string;
      phone?: string;
      role: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  error?: string;
}

class AuthService {
  private baseUrl: string = API_CONFIG.BASE_URL;

  constructor() {
    // Initialize with base URL, will be updated by getApiUrl if needed
    this.initializeBaseUrl();
  }

  private async initializeBaseUrl() {
    try {
      this.baseUrl = await getApiUrl();
      console.log('✅ API URL initialized:', this.baseUrl);
    } catch (error) {
      console.log('⚠️ Using default URL, connection may fail');
      // Use fallback URL
      this.baseUrl = API_CONFIG.BASE_URL;
      console.log('🔄 Using fallback URL:', this.baseUrl);
    }
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    try {
      const fullUrl = `${this.baseUrl}${endpoint}`;
      
      if (API_CONFIG.DEBUG) {
        console.log('🚀 API Request:', {
          method: options.method || 'GET',
          url: fullUrl,
          headers: options.headers,
        });
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (API_CONFIG.DEBUG) {
        console.log('📥 API Response:', {
          status: response.status,
          statusText: response.statusText,
          url: fullUrl,
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (API_CONFIG.DEBUG) {
        console.log('📊 API Data:', data);
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ API Request Error:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Kết nối quá thời gian chờ. Vui lòng thử lại.');
      }
      
      if (error.message === 'Network request failed') {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra:\n\n1. Backend server đang chạy\n2. Kết nối mạng ổn định\n3. Firewall không chặn kết nối');
      }
      
      throw error;
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('Login request:', { email: credentials.email });
      
      const data = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      console.log('Login response:', data);

      if (data.success) {
        return data;
      } else {
        throw new Error(data.error || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      console.error('Login service error:', error);
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('Register request:', { email: userData.email, fullName: userData.fullName });
      
      const data = await this.makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      console.log('Register response:', data);

      if (data.success) {
        return data;
      } else {
        throw new Error(data.error || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      console.error('Register service error:', error);
      throw error;
    }
  }

  async getMe(token: string): Promise<any> {
    try {
      const data = await this.makeRequest('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return data;
    } catch (error: any) {
      console.error('GetMe service error:', error);
      throw error;
    }
  }

  // Test connection to server
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/api/auth/test', { method: 'GET' });
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Test all possible URLs
  async testAllUrls(): Promise<{ url: string; working: boolean }[]> {
    const results = [];
    
    for (const url of [...API_CONFIG.FALLBACK_URLS, API_CONFIG.BASE_URL]) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${url}/api/auth/test`, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        results.push({ url, working: response.ok });
        
        if (response.ok) {
          console.log(`✅ ${url} - Working`);
        } else {
          console.log(`❌ ${url} - Not working`);
        }
      } catch (error) {
        console.log(`❌ ${url} - Error: ${error}`);
        results.push({ url, working: false });
      }
    }
    
    return results;
  }
}

export const authService = new AuthService();
