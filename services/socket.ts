import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants/config';
import { Alert, BarnDevice } from '../types';

interface SensorData {
  temperature: number;
  humidity: number;
  ammonia?: number;
  co2?: number;
  lightLevel?: number;
  timestamp: string;
}

interface YoloDetection {
  timestamp: string;
  detections: Array<{
    class: string;
    confidence: number;
    bbox: [number, number, number, number];
  }>;
  image?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private currentToken: string | null = null;

  connect(token: string): void {
    if (this.socket?.connected) {
      this.disconnect();
    }

    this.currentToken = token;
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket'],
      timeout: 10000,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentToken = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });
  }

  joinBarn(barnId: number): void {
    if (this.socket?.connected) {
      this.socket.emit('join_barn', { barnId });
    }
  }

  leaveBarn(barnId: number): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_barn', { barnId });
    }
  }

  // Event listeners for real-time data
  onSensorUpdate(callback: (data: { barnId: number; sensors: SensorData }) => void): void {
    if (this.socket) {
      this.socket.on('sensor:update', callback);
    }
  }

  onNewAlert(callback: (alert: Alert) => void): void {
    if (this.socket) {
      this.socket.on('alert:new', callback);
    }
  }

  onDeviceStatusChange(callback: (data: { deviceId: number; status: 'ONLINE' | 'OFFLINE' | 'ERROR'; barnId: number }) => void): void {
    if (this.socket) {
      this.socket.on('device:status', callback);
    }
  }

  onYoloDetection(callback: (data: { barnId: number; detection: YoloDetection }) => void): void {
    if (this.socket) {
      this.socket.on('yolo:detection', callback);
    }
  }

  onEnvironmentAlert(callback: (data: { barnId: number; type: string; message: string; severity: string }) => void): void {
    if (this.socket) {
      this.socket.on('environment:alert', callback);
    }
  }

  // Remove event listeners
  offSensorUpdate(callback: (data: { barnId: number; sensors: SensorData }) => void): void {
    if (this.socket) {
      this.socket.off('sensor:update', callback);
    }
  }

  offNewAlert(callback: (alert: Alert) => void): void {
    if (this.socket) {
      this.socket.off('alert:new', callback);
    }
  }

  offDeviceStatusChange(callback: (data: { deviceId: number; status: 'ONLINE' | 'OFFLINE' | 'ERROR'; barnId: number }) => void): void {
    if (this.socket) {
      this.socket.off('device:status', callback);
    }
  }

  offYoloDetection(callback: (data: { barnId: number; detection: YoloDetection }) => void): void {
    if (this.socket) {
      this.socket.off('yolo:detection', callback);
    }
  }

  offEnvironmentAlert(callback: (data: { barnId: number; type: string; message: string; severity: string }) => void): void {
    if (this.socket) {
      this.socket.off('environment:alert', callback);
    }
  }

  // Control commands
  sendDeviceControl(deviceId: number, action: 'ON' | 'OFF' | 'TOGGLE', value?: number): void {
    if (this.socket?.connected) {
      this.socket.emit('device:control', {
        deviceId,
        action,
        value,
      });
    }
  }

  sendFeedCommand(barnId: number, amount: number): void {
    if (this.socket?.connected) {
      this.socket.emit('feed:command', {
        barnId,
        amount,
      });
    }
  }

  // Get socket instance for advanced usage
  getSocket(): Socket | null {
    return this.socket;
  }

  // Reconnect with current token
  reconnect(): void {
    if (this.currentToken) {
      this.connect(this.currentToken);
    }
  }
}

// Singleton instance
export const socketService = new SocketService();
export default socketService;
