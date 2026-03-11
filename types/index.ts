import { DeviceType, AlertSeverity, FlockStage } from '../constants/config';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Barn {
  id: number;
  userId: number;
  name: string;
  location?: string;
  capacity: number;
  currentFlock?: number;
  batchName?: string;
  batchStartDate?: string;
  status: 'active' | 'empty' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

export interface Flock {
  id: number;
  barnId: number;
  batchCode: string;
  initialCount: number;
  currentCount: number;
  deadCount: number;
  startDate: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  avgWeightKg: number;
  currentAgeDays: number;
  currentStage: FlockStage;
  status: 'active' | 'completed' | 'terminated';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BarnDevice {
  id: number;
  barnId: number;
  name: string;
  deviceType: DeviceType;
  mqttTopic?: string;
  currentStatus: 'ON' | 'OFF';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: number;
  barnId: number;
  deviceId: number;
  name: string;
  scheduledTime: string;
  durationSeconds: number;
  daysOfWeek: number[];
  feedAmountGram?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedCalculation {
  id: string;
  barnId: number;
  flockId: number;
  standardId: number;
  chickenCount: number;
  avgWeightKg: number;
  ageDays: number;
  stage: FlockStage;
  envTemperature: number;
  tempAdjustmentFactor: number;
  baseFeedGram: number;
  recommendedFeedGram: number;
  recommendedWaterLiter: number;
  calculatedAt: string;
}

export interface EnvironmentLog {
  id: string;
  barnId: number;
  temperature: number;
  humidity: number;
  rawData?: any;
  recordedAt: string;
}

export interface Alert {
  id: string;
  barnId: number;
  flockId?: number;
  alertType: string;
  severity: AlertSeverity;
  message: string;
  detailData?: any;
  isRead: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export interface Note {
  id: number;
  userId: number;
  barnId?: number;
  flockId?: number;
  title: string;
  content: string;
  tag: 'urgent' | 'routine' | 'medical' | 'feeding';
  reminderAt?: string;
  isReminded: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FarmAiChat {
  id: string;
  userId: number;
  barnId?: number;
  role: 'user' | 'assistant';
  content: string;
  contextData?: any;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
