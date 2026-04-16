// API Configuration
const PRODUCTION_API_URL = 'https://smartfarmbackend-production.up.railway.app/api';

const getBaseUrl = () => {
  // Priority: Environment Variable > Default IP > Fallback
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  
  if (process.env.EXPO_PUBLIC_ANDROID_API_URL) {
    return process.env.EXPO_PUBLIC_ANDROID_API_URL;
  }
  
  return PRODUCTION_API_URL;
};

export const API_CONFIG = {
  // BASE_URL: dùng production URL cho cả dev lẫn prod (services/api.ts đã có API_URL đúng)
  BASE_URL: getBaseUrl(),
  
  // Fallback URLs nếu main URL lỗi
  FALLBACK_URLS: [
    getBaseUrl(),
    PRODUCTION_API_URL,
  ],
  
  // API Endpoints – KHÔNG có prefix '/api/' vì baseURL đã chứa '/api'
  ENDPOINTS: {
    AUTH: '/auth',
    BARNS: '/barns',
    DEVICES: '/devices',
    SCHEDULES: '/schedules',
    FEEDS: '/feed',
    ALERTS: '/alerts',
  },
  
  // Request settings
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  
  // Debug mode
  DEBUG: process.env.EXPO_PUBLIC_DEBUG_API === 'true',
};

// Helper function to get working API URL
export const getApiUrl = async (): Promise<string> => {
  const baseUrl = API_CONFIG.BASE_URL;
  
  // Test the main URL first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${baseUrl}/auth/test`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    if (response.ok) return baseUrl;
  } catch (error) {
    console.log(`Main URL ${baseUrl} failed, trying fallbacks...`);
  }
  
  // Try fallback URLs
  for (const fallbackUrl of API_CONFIG.FALLBACK_URLS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${fallbackUrl}/auth/test`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      if (response.ok) {
        console.log(`✅ Using fallback URL: ${fallbackUrl}`);
        return fallbackUrl;
      }
    } catch (error) {
      console.log(`❌ Fallback URL ${fallbackUrl} failed`);
    }
  }
  
  throw new Error('No working API URL found');
};

export default API_CONFIG;
