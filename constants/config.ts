export enum DeviceType {
  TEMPERATURE_SENSOR = 'TEMPERATURE_SENSOR',
  HUMIDITY_SENSOR = 'HUMIDITY_SENSOR',
  FEEDER = 'FEEDER',
  WATERER = 'WATERER',
  LIGHT = 'LIGHT',
  FAN = 'FAN',
  HEATER = 'HEATER',
  CAMERA = 'CAMERA',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum FlockStage {
  BROODER = 'BROODER',
  GROWER = 'GROWER',
  FINISHER = 'FINISHER',
}

export const COLORS = {
  primary: '#2D6A2D',
  secondary: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  background: '#F5F5F5',
  text: '#333333',
  white: '#FFFFFF',
  gray: '#9E9E9E',
  lightGray: '#F0F0F0',
} as const;

export const API_URL = 'http://localhost:3000/api';
export const SOCKET_URL = 'http://localhost:3000';

export const MQTT_TOPICS = {
  getSensorsTopic: (barnId: number): string => `farm/barn${barnId}/sensors`,
  getYoloTopic: (barnId: number): string => `farm/barn${barnId}/yolo`,
  getAlertTopic: (barnId: number): string => `farm/barn${barnId}/alert`,
  CONTROL: 'farm/control',
} as const;
