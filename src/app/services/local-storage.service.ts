import { Injectable } from '@angular/core';
import { ParkingData, ParkingSlot, VehicleEntry, VehicleType } from '../models/parking.model';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly PARKING_DATA_KEY = 'parking_data';
  private readonly ADMIN_KEY = 'is_admin';

  constructor() {
    this.initializeData();
  }

  private initializeData(): void {
    const existingData = this.getParkingData();
    if (!existingData) {
      const initialData: ParkingData = {
        slots: this.createInitialSlots(),
        parkedVehicles: [],
        totalIncome: 0,
        todayIncome: 0
      };
      this.saveParkingData(initialData);
    }
  }

  private createInitialSlots(): ParkingSlot[] {
    const slots: ParkingSlot[] = [];
    let slotId = 1;

    // 10 bike slots
    for (let i = 0; i < 10; i++) {
      slots.push({
        id: slotId++,
        type: 'bike',
        isOccupied: false
      });
    }

    // 10 car slots
    for (let i = 0; i < 10; i++) {
      slots.push({
        id: slotId++,
        type: 'car',
        isOccupied: false
      });
    }

    // 5 EV slots
    for (let i = 0; i < 5; i++) {
      slots.push({
        id: slotId++,
        type: 'ev',
        isOccupied: false
      });
    }

    return slots;
  }

  getParkingData(): ParkingData | null {
    const data = localStorage.getItem(this.PARKING_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  saveParkingData(data: ParkingData): void {
    localStorage.setItem(this.PARKING_DATA_KEY, JSON.stringify(data));
  }

  setAdminStatus(isAdmin: boolean): void {
    localStorage.setItem(this.ADMIN_KEY, isAdmin.toString());
  }

  isAdmin(): boolean {
    return localStorage.getItem(this.ADMIN_KEY) === 'true';
  }

  clearData(): void {
    localStorage.removeItem(this.PARKING_DATA_KEY);
    localStorage.removeItem(this.ADMIN_KEY);
    this.initializeData();
  }
}