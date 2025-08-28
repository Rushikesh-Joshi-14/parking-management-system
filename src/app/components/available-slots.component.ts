import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParkingService } from '../services/parking.service';
import { ParkingSlot, ParkingStatusResponse, ParkingExitRequest } from '../models/parking.model';
import { CurrencyFormatPipe } from '../pipes/currency-format.pipe';

@Component({
  selector: 'app-available-slots',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyFormatPipe],
  template: `
    <div class="slots-container">
      <div class="header">
        <h2>🅿️ Parking Status</h2>
        <button (click)="refreshData()" class="refresh-btn" [disabled]="isLoading">
          <span [class.spinning]="isLoading">🔄</span> Refresh
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid" *ngIf="parkingStatus">
        <div class="summary-card available">
          <div class="summary-icon">🟢</div>
          <div class="summary-info">
            <h3>{{ getAvailableCount() }}</h3>
            <p>Available Slots</p>
          </div>
        </div>
        
        <div class="summary-card occupied">
          <div class="summary-icon">🔴</div>
          <div class="summary-info">
            <h3>{{ getOccupiedCount() }}</h3>
            <p>Occupied Slots</p>
          </div>
        </div>
        
        <div class="summary-card total">
          <div class="summary-icon">🅿️</div>
          <div class="summary-info">
            <h3>{{ parkingStatus.totalSlots }}</h3>
            <p>Total Slots</p>
          </div>
        </div>
      </div>

      <!-- Vehicle Type Filters -->
      <div class="filters">
        <button 
          *ngFor="let type of vehicleTypes" 
          (click)="selectedFilter = type"
          [class.active]="selectedFilter === type"
          class="filter-btn">
          {{ getTypeIcon(type) }} {{ getTypeLabel(type) }} 
          ({{ getTypeCount(type).available }}/{{ getTypeCount(type).total }})
        </button>
      </div>

      <!-- Parking Grid -->
      <div class="parking-grid" *ngIf="parkingStatus">
        <div 
          *ngFor="let slot of getFilteredSlots()" 
          class="parking-slot"
          [class.occupied]="slot.isOccupied"
          [class.available]="!slot.isOccupied"
          [class.bike]="slot.type === 'bike'"
          [class.car]="slot.type === 'car'"
          [class.ev]="slot.type === 'ev'">
          
          <div class="slot-header">
            <span class="slot-number">{{ slot.id }}</span>
            <span class="slot-type">{{ getTypeIcon(slot.type) }}</span>
          </div>
          
          <div class="slot-status">
            <span class="status-indicator">
              {{ slot.isOccupied ? '🔴' : '🟢' }}
            </span>
            <span class="status-text">
              {{ slot.isOccupied ? 'Occupied' : 'Available' }}
            </span>
          </div>
          
          <div *ngIf="slot.isOccupied && slot.vehicleDetails" class="vehicle-info">
            <p><strong>{{ slot.vehicleDetails.licensePlate }}</strong></p>
            <p class="entry-time">{{ slot.vehicleDetails.timeOfEntry | date:'short' }}</p>
            <button 
              (click)="openExitModal(slot.vehicleDetails.ticketId)" 
              class="exit-btn">
              Exit Vehicle
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading parking data...</p>
      </div>

      <!-- Exit Modal -->
      <div *ngIf="showExitModal" class="modal-overlay" (click)="closeExitModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>🚗 Vehicle Exit</h3>
            <button (click)="closeExitModal()" class="close-btn">✕</button>
          </div>
          
          <div class="modal-body">
            <p>Are you sure you want to exit this vehicle?</p>
            <p><strong>Ticket ID:</strong> {{ selectedTicketId }}</p>
            
            <div *ngIf="exitResult" class="exit-result" [class.success]="exitResult.success" [class.error]="!exitResult.success">
              <div class="result-content">
                <span class="icon">{{ exitResult.success ? '✅' : '❌' }}</span>
                <div>
                  <strong>{{ exitResult.success ? 'Success!' : 'Error!' }}</strong>
                  <p>{{ exitResult.message }}</p>
                  <div *ngIf="exitResult.success" class="bill-details">
                    <p><strong>Duration:</strong> {{ exitResult.duration }} hour(s)</p>
                    <p><strong>Total Bill:</strong> {{ exitResult.totalBill | currencyFormat }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button (click)="closeExitModal()" class="cancel-btn">Cancel</button>
            <button 
              (click)="confirmExit()" 
              class="confirm-btn"
              [disabled]="isExiting || (exitResult && exitResult.success)">
              {{ isExiting ? 'Processing...' : 'Confirm Exit' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .slots-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header h2 {
      margin: 0;
      color: #1f2937;
      font-size: 2rem;
      font-weight: 700;
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 500;
    }

    .refresh-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .summary-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
      border-left: 4px solid;
    }

    .summary-card.available {
      border-left-color: #10b981;
    }

    .summary-card.occupied {
      border-left-color: #ef4444;
    }

    .summary-card.total {
      border-left-color: #6366f1;
    }

    .summary-icon {
      font-size: 2rem;
    }

    .summary-info h3 {
      margin: 0 0 0.25rem 0;
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
    }

    .summary-info p {
      margin: 0;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 0.75rem 1.5rem;
      border: 2px solid #e5e7eb;
      background: white;
      border-radius: 25px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 500;
      color: #374151;
    }

    .filter-btn:hover {
      border-color: #6366f1;
      transform: translateY(-2px);
    }

    .filter-btn.active {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      border-color: #6366f1;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
    }

    .parking-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .parking-slot {
      background: white;
      border-radius: 12px;
      padding: 0.75rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .parking-slot:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    }

    .parking-slot.available {
      border-color: #10b981;
      background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
    }

    .parking-slot.occupied {
      border-color: #ef4444;
      background: linear-gradient(135deg, #fef2f2 0%, #fef7f7 100%);
    }

    .slot-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .slot-number {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1f2937;
    }

    .slot-type {
      font-size: 1.1rem;
    }

    .slot-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .status-indicator {
      font-size: 1rem;
    }

    .status-text {
      font-weight: 600;
      color: #374151;
    }

    .vehicle-info {
      background: rgba(255, 255, 255, 0.7);
      padding: 0.75rem;
      border-radius: 8px;
      margin-top: 0.5rem;
    }

    .vehicle-info p {
      margin: 0.25rem 0;
      color: #374151;
    }

    .entry-time {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .exit-btn {
      margin-top: 0.75rem;
      width: 100%;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .exit-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e5e7eb;
      border-top: 4px solid #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem auto;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    }

    .modal {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      animation: modalSlideIn 0.3s ease;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      margin: 0;
      color: #1f2937;
      font-size: 1.25rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
      padding: 0.25rem;
      border-radius: 4px;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
      justify-content: flex-end;
    }

    .cancel-btn {
      padding: 0.75rem 1.5rem;
      border: 2px solid #d1d5db;
      background: white;
      color: #374151;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .cancel-btn:hover {
      border-color: #9ca3af;
      background: #f9fafb;
    }

    .confirm-btn {
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .confirm-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
    }

    .confirm-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .exit-result {
      margin: 1rem 0;
      padding: 1rem;
      border-radius: 8px;
      animation: slideIn 0.3s ease;
    }

    .exit-result.success {
      background: #ecfdf5;
      border: 1px solid #10b981;
      color: #065f46;
    }

    .exit-result.error {
      background: #fef2f2;
      border: 1px solid #ef4444;
      color: #991b1b;
    }

    .result-content {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .icon {
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .bill-details {
      background: rgba(255, 255, 255, 0.5);
      padding: 0.75rem;
      border-radius: 6px;
      margin-top: 0.5rem;
      font-size: 0.9rem;
    }

    .bill-details p {
      margin: 0.25rem 0;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalSlideIn {
      from { opacity: 0; transform: translateY(-20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 768px) {
      .slots-container {
        padding: 1rem 0.5rem;
      }
      
      .header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
      
      .header h2 {
        font-size: 1.5rem;
      }
      
      .summary-grid {
        grid-template-columns: 1fr;
      }
      
      .filters {
        justify-content: center;
      }
      
      .parking-grid {
        grid-template-columns: 1fr;
      }
      
      .modal {
        width: 95%;
        margin: 1rem;
      }
    }
  `]
})
export class AvailableSlotsComponent implements OnInit {
  parkingStatus: ParkingStatusResponse | null = null;
  isLoading = false;
  selectedFilter = 'all';
  vehicleTypes = ['all', 'bike', 'car', 'ev'];
  
  // Exit modal properties
  showExitModal = false;
  selectedTicketId = '';
  isExiting = false;
  exitResult: any = null;

  constructor(private parkingService: ParkingService) {}

  ngOnInit() {
    this.loadParkingStatus();
  }

  loadParkingStatus() {
    this.isLoading = true;
    this.parkingService.getParkingStatus().subscribe({
      next: (response) => {
        this.parkingStatus = response;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading parking status:', error);
        this.isLoading = false;
      }
    });
  }

  refreshData() {
    this.loadParkingStatus();
  }

  getAvailableCount(): number {
    return this.parkingStatus?.availableSlots.length || 0;
  }

  getOccupiedCount(): number {
    return this.parkingStatus?.occupiedSlots.length || 0;
  }

  getTypeIcon(type: string): string {
    const icons = {
      all: '🅿️',
      bike: '🏍️',
      car: '🚗',
      ev: '🔋'
    };
    return icons[type as keyof typeof icons] || '🅿️';
  }

  getTypeLabel(type: string): string {
    const labels = {
      all: 'All',
      bike: 'Bikes',
      car: 'Cars',
      ev: 'EV'
    };
    return labels[type as keyof typeof labels] || 'All';
  }

  getTypeCount(type: string) {
    if (!this.parkingStatus) return { available: 0, total: 0 };
    
    if (type === 'all') {
      return {
        available: this.getAvailableCount(),
        total: this.parkingStatus.totalSlots
      };
    }
    
    const allSlots = [...this.parkingStatus.availableSlots, ...this.parkingStatus.occupiedSlots];
    const typeSlots = allSlots.filter(slot => slot.type === type);
    const availableTypeSlots = this.parkingStatus.availableSlots.filter(slot => slot.type === type);
    
    return {
      available: availableTypeSlots.length,
      total: typeSlots.length
    };
  }

  getFilteredSlots(): ParkingSlot[] {
    if (!this.parkingStatus) return [];
    
    const allSlots = [...this.parkingStatus.availableSlots, ...this.parkingStatus.occupiedSlots];
    
    if (this.selectedFilter === 'all') {
      return allSlots.sort((a, b) => a.id - b.id);
    }
    
    return allSlots
      .filter(slot => slot.type === this.selectedFilter)
      .sort((a, b) => a.id - b.id);
  }

  openExitModal(ticketId: string) {
    this.selectedTicketId = ticketId;
    this.showExitModal = true;
    this.exitResult = null;
    this.isExiting = false;
  }

  closeExitModal() {
    this.showExitModal = false;
    this.selectedTicketId = '';
    this.exitResult = null;
    this.isExiting = false;
    
    // Refresh data if exit was successful
    if (this.exitResult?.success) {
      this.loadParkingStatus();
    }
  }

  confirmExit() {
    if (!this.selectedTicketId || this.isExiting) return;
    
    this.isExiting = true;
    
    const exitRequest: ParkingExitRequest = {
      ticketId: this.selectedTicketId,
      timeOfExit: new Date()
    };

    this.parkingService.exitVehicle(exitRequest).subscribe({
      next: (response) => {
        this.exitResult = response;
        this.isExiting = false;
        
        if (response.success) {
          // Auto-close modal after 3 seconds on success
          setTimeout(() => {
            this.closeExitModal();
          }, 3000);
        }
      },
      error: (error) => {
        this.exitResult = {
          success: false,
          message: 'An error occurred while processing the exit'
        };
        this.isExiting = false;
        console.error('Exit error:', error);
      }
    });
  }
}