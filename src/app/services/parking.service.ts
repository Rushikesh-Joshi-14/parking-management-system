import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { 
  ParkingEntryResponse, 
  ParkingStatusResponse, 
  ParkingExitRequest,
  ParkingExitResponse,
  IncomeResponse,
  VehicleEntry,
  VehicleType,
  ParkingSlot
} from '../models/parking.model';
import { LocalStorageService } from './local-storage.service';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class ParkingService {
  private readonly RATES = {
    bike: 5,
    car: 10,
    ev: 15
  };

  constructor(private localStorageService: LocalStorageService, private logger: LoggerService) {}

  // POST /api/parking/entry
  parkVehicle(licensePlate: string, vehicleType: VehicleType, customerName?: string, customerMobile?: string): Observable<ParkingEntryResponse> {
    const data = this.localStorageService.getParkingData();
    if (!data) {
      this.logger.error('Parking data missing on parkVehicle', 'ParkingService');
      return throwError(() => new Error('No parking data found'));
    }

    // Check if vehicle already parked
    const existingVehicle = data.parkedVehicles.find(v => v.licensePlate === licensePlate);
    if (existingVehicle) {
      this.logger.warn('Vehicle already parked', 'ParkingService', { licensePlate });
      return of({
        timeOfEntry: new Date(),
        ticketChargePerHr: 0,
        parkingSlotNumber: 0,
        ticketId: '',
        success: false,
        message: 'Vehicle already parked'
      }).pipe(delay(500));
    }

    // Find available slot
    const availableSlot = data.slots.find(slot => slot.type === vehicleType && !slot.isOccupied);
    if (!availableSlot) {
      this.logger.warn('No available slots', 'ParkingService', { vehicleType });
      return of({
        timeOfEntry: new Date(),
        ticketChargePerHr: 0,
        parkingSlotNumber: 0,
        ticketId: '',
        success: false,
        message: `No available ${vehicleType} slots`
      }).pipe(delay(500));
    }

    // Park the vehicle
    const timeOfEntry = new Date();
    const ticketId = this.generateTicketId();
    const ticketChargePerHr = this.RATES[vehicleType];

    const vehicleEntry: VehicleEntry = {
      licensePlate,
      vehicleType,
      timeOfEntry,
      ticketChargePerHr,
      parkingSlotNumber: availableSlot.id,
      ticketId,
      customerName,
      customerMobile
    };

    // Update slot
    availableSlot.isOccupied = true;
    availableSlot.vehicleDetails = vehicleEntry;
    availableSlot.timeOfEntry = timeOfEntry;

    // Add to parked vehicles
    data.parkedVehicles.push(vehicleEntry);

    // Save data
    this.localStorageService.saveParkingData(data);
    this.logger.info('Vehicle parked successfully', 'ParkingService', { licensePlate, vehicleType, slot: availableSlot.id, ticketId, customerName, customerMobile });

    return of({
      timeOfEntry,
      ticketChargePerHr,
      parkingSlotNumber: availableSlot.id,
      ticketId,
      success: true,
      message: 'Vehicle parked successfully'
    }).pipe(delay(500));
  }

  // GET /api/parking/status
  getParkingStatus(): Observable<ParkingStatusResponse> {
    const data = this.localStorageService.getParkingData();
    if (!data) {
      this.logger.error('Parking data missing on getParkingStatus', 'ParkingService');
      return throwError(() => new Error('No parking data found'));
    }

    const availableSlots = data.slots.filter(slot => !slot.isOccupied);
    const occupiedSlots = data.slots.filter(slot => slot.isOccupied);

    this.logger.debug('Parking status fetched', 'ParkingService', { available: availableSlots.length, occupied: occupiedSlots.length, total: data.slots.length });

    return of({
      availableSlots,
      occupiedSlots,
      totalSlots: data.slots.length
    }).pipe(delay(300));
  }

  // POST /api/parking/exit
  exitVehicle(exitRequest: ParkingExitRequest): Observable<ParkingExitResponse> {
    const data = this.localStorageService.getParkingData();
    if (!data) {
      this.logger.error('Parking data missing on exitVehicle', 'ParkingService');
      return throwError(() => new Error('No parking data found'));
    }

    const vehicleIndex = data.parkedVehicles.findIndex(v => v.ticketId === exitRequest.ticketId);
    if (vehicleIndex === -1) {
      this.logger.warn('Invalid ticket ID on exit', 'ParkingService', { ticketId: exitRequest.ticketId });
      return of({
        totalBill: 0,
        duration: 0,
        success: false,
        message: 'Invalid ticket ID'
      }).pipe(delay(500));
    }

    const vehicle = data.parkedVehicles[vehicleIndex];
    const timeOfEntry = new Date(vehicle.timeOfEntry);
    const timeOfExit = exitRequest.timeOfExit;
    
    // Calculate duration in hours (minimum 1 hour)
    const durationMs = timeOfExit.getTime() - timeOfEntry.getTime();
    const durationHours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));
    
    const totalBill = durationHours * vehicle.ticketChargePerHr;

    // Update slot
    const slot = data.slots.find(s => s.id === vehicle.parkingSlotNumber);
    if (slot) {
      slot.isOccupied = false;
      slot.vehicleDetails = undefined;
      slot.timeOfEntry = undefined;
    }

    // Remove from parked vehicles
    data.parkedVehicles.splice(vehicleIndex, 1);

    // Update income
    data.totalIncome += totalBill;
    data.todayIncome += totalBill;

    // Save data
    this.localStorageService.saveParkingData(data);
    this.logger.info('Vehicle exited successfully', 'ParkingService', { ticketId: exitRequest.ticketId, bill: totalBill, durationHours });

    return of({
      totalBill,
      duration: durationHours,
      success: true,
      message: 'Vehicle exited successfully'
    }).pipe(delay(500));
  }

  // GET /api/parking/income
  getIncome(): Observable<IncomeResponse> {
    const data = this.localStorageService.getParkingData();
    if (!data) {
      this.logger.error('Parking data missing on getIncome', 'ParkingService');
      return throwError(() => new Error('No parking data found'));
    }

    const response = {
      totalIncome: data.totalIncome,
      todayIncome: data.todayIncome,
      totalVehiclesParked: data.parkedVehicles.length
    };

    this.logger.debug('Income fetched', 'ParkingService', response);

    return of(response).pipe(delay(300));
  }

  private generateTicketId(): string {
    return 'TKT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
}