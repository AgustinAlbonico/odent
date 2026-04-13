export enum BotState {
  IDLE = 'idle',
  CONFIRMING = 'confirming',
  RESCHEDULING = 'rescheduling',
  RESCHEDULING_SELECT_DATE = 'rescheduling_select_date',
  RESCHEDULING_SELECT_TIME = 'rescheduling_select_time',
  CANCELLING = 'cancelling',
}

export interface BotContext {
  appointmentId?: string;
  selectedDate?: string;
  selectedTime?: string;
  professionalId?: string;
  tenantId?: string;
}

export interface WhatsAppMessage {
  from: string;
  body: string;
  timestamp: number;
}

export interface WhatsAppButton {
  id: string;
  title: string;
}

export interface WhatsAppInteractiveMessage {
  text: string;
  buttons: WhatsAppButton[];
}

export interface PatientInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  tenantId: string;
}
