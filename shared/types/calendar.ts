// shared/types/calendar.ts
import { View } from 'react-big-calendar';

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  cliente_id: number;
  collezione_id: number;
  cliente_nome: string;
  collezione_nome: string;
  note?: string;
  color: string;
}

export interface Warning {
  message: string;
  type: 'info' | 'warning' | 'urgent';
}

export interface EventValidation {
  eventData: Partial<CalendarEvent>;
  excludeEventId?: number | null;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export interface EventWorkload {
  total_events: number;
  total_duration: number;
}

export interface EventDetails extends CalendarEvent {
  workload: EventWorkload;
}

export interface Message {
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface ModalDates {
  start: Date;
  end: Date;
}
