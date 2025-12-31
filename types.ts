
export interface Room {
  room_id: string;
  room_number: number;
  number_of_beds: number;
}

export interface Bed {
  bed_id: string;
  room_id: string;
  room_number: number;
  bed_number: string;
  status: 'Available' | 'Occupied' | 'Under Maintenance';
  patient_id: string | null;
  patient_name: string | null;
  image_url?: string;
}

export interface Patient {
  patient_id: string;
  p_name: string;
  p_phone: number;
  p_email: string;
  amount_spent: string;
}

export interface Booking {
  booking_id: string;
  booking_date: string;
  bed_id: string;
  bed_number: string;
  patient_id: string;
  patient_name: string;
  payment_status: boolean;
  booking_start_date: string;
  booking_end_date: string;
}

export interface Medicine {
  medicine_id: string;
  serial_number: string;
  medicine_name: string;
  quantity: number;
  threshold_quantity: number;
  image_url?: string;
}

export interface Alert {
  alert_id: string;
  medicine_id: string;
  threshold_quantity: number;
  current_quantity: number;
  alert_message: string;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  order_id: string;
  patient_id: string;
  bed_id: string;
  bed_number: string;
  medicine_id: string;
  medicine: any;
  order_date: string;
  ordered_quantity: number;
}
