export interface ParkingSlot {
  id: number;
  type: VehicleType;
  isOccupied: boolean;
  vehicleDetails?: VehicleEntry;
  timeOfEntry?: Date;
}

export interface VehicleEntry {
  licensePlate: string;
  vehicleType: VehicleType;
  timeOfEntry: Date;
  ticketChargePerHr: number;
  parkingSlotNumber: number;
  ticketId: string;
}

export interface ParkingEntryResponse {
  timeOfEntry: Date;
  ticketChargePerHr: number;
  parkingSlotNumber: number;
  ticketId: string;
  success: boolean;
  message: string;
}

export interface ParkingStatusResponse {
  availableSlots: ParkingSlot[];
  occupiedSlots: ParkingSlot[];
  totalSlots: number;
}

export interface ParkingExitRequest {
  ticketId: string;
  timeOfExit: Date;
}

export interface ParkingExitResponse {
  totalBill: number;
  duration: number;
  success: boolean;
  message: string;
}

export interface IncomeResponse {
  totalIncome: number;
  todayIncome: number;
  totalVehiclesParked: number;
}

export type VehicleType = 'bike' | 'car' | 'ev';

export interface ParkingData {
  slots: ParkingSlot[];
  parkedVehicles: VehicleEntry[];
  totalIncome: number;
  todayIncome: number;
}