import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParkingService } from '../services/parking.service';
import { VehicleType } from '../models/parking.model';
import { LoggerService } from '../services/logger.service';

@Component({
  selector: 'app-parking-entry-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="parking-entry-container">
      <div class="card">
        <div class="card-header">
          <h2>🚗 Vehicle Entry</h2>
          <p>Park your vehicle with ease</p>
        </div>
        
        <form #entryForm="ngForm" (ngSubmit)="onSubmit(entryForm)" class="entry-form">
          <div class="form-group">
            <label for="licensePlate">License Plate *</label>
            <input 
              type="text" 
              id="licensePlate"
              name="licensePlate"
              [(ngModel)]="formData.licensePlate"
              #licensePlate="ngModel"
              class="form-control"
              [class.invalid]="licensePlate.invalid && licensePlate.touched"
              placeholder="e.g., MH12AB1234"
              required
              pattern="^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$"
              maxlength="10">
            
            <div class="error-messages" *ngIf="licensePlate.invalid && licensePlate.touched">
              <small *ngIf="licensePlate.errors?.['required']" class="error">
                License plate is required
              </small>
              <small *ngIf="licensePlate.errors?.['pattern']" class="error">
                Please enter a valid license plate format (e.g., MH12AB1234)
              </small>
            </div>
          </div>

          <div class="form-group">
            <label for="vehicleType">Vehicle Type *</label>
            <select 
              id="vehicleType"
              name="vehicleType"
              [(ngModel)]="formData.vehicleType"
              #vehicleType="ngModel"
              class="form-control"
              [class.invalid]="vehicleType.invalid && vehicleType.touched"
              required>
              <option value="">Select Vehicle Type</option>
              <option value="bike">🏍️ Bike - ₹5/hr</option>
              <option value="car">🚗 Car - ₹10/hr</option>
              <option value="ev">🔋 Electric Vehicle - ₹15/hr</option>
            </select>
            
            <div class="error-messages" *ngIf="vehicleType.invalid && vehicleType.touched">
              <small *ngIf="vehicleType.errors?.['required']" class="error">
                Please select a vehicle type
              </small>
            </div>
          </div>

          <button 
            type="submit" 
            class="submit-btn"
            [disabled]="entryForm.invalid || isLoading">
            <span *ngIf="isLoading" class="loading-spinner"></span>
            {{ isLoading ? 'Parking Vehicle...' : '🅿️ Park Vehicle' }}
          </button>
        </form>

        <!-- Success/Error Messages -->
        <div *ngIf="message" class="message" [class.success]="isSuccess" [class.error]="!isSuccess">
          <div class="message-content">
            <span class="icon">{{ isSuccess ? '✅' : '❌' }}</span>
            <div>
              <strong>{{ isSuccess ? 'Success!' : 'Error!' }}</strong>
              <p>{{ message }}</p>
              <div *ngIf="ticketInfo && isSuccess" class="ticket-info">
                <p><strong>Ticket ID:</strong> {{ ticketInfo.ticketId }}</p>
                <p><strong>Slot Number:</strong> {{ ticketInfo.parkingSlotNumber }}</p>
                <p><strong>Entry Time:</strong> {{ ticketInfo.timeOfEntry | date:'medium' }}</p>
                <p><strong>Rate:</strong> ₹{{ ticketInfo.ticketChargePerHr }}/hour</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .parking-entry-container {
      max-width: 500px;
      margin: 1rem auto;
      padding: 0 1rem;
    }

    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .card-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }

    .card-header h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.8rem;
      font-weight: 600;
    }

    .card-header p {
      margin: 0;
      opacity: 0.9;
      font-size: 1rem;
    }

    .entry-form {
      padding: 2rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
      font-size: 0.9rem;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-control.invalid {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .error-messages {
      margin-top: 0.5rem;
    }

    .error {
      color: #ef4444;
      font-size: 0.8rem;
      display: block;
    }

    .submit-btn {
      width: 100%;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .message {
      margin-top: 1.5rem;
      padding: 1rem;
      border-radius: 8px;
      animation: slideIn 0.3s ease;
    }

    .message.success {
      background: #ecfdf5;
      border: 1px solid #10b981;
      color: #065f46;
    }

    .message.error {
      background: #fef2f2;
      border: 1px solid #ef4444;
      color: #991b1b;
    }

    .message-content {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .icon {
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .ticket-info {
      background: rgba(255, 255, 255, 0.5);
      padding: 0.75rem;
      border-radius: 6px;
      margin-top: 0.5rem;
      font-size: 0.85rem;
    }

    .ticket-info p {
      margin: 0.25rem 0;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 640px) {
      .parking-entry-container {
        margin: 1rem auto;
        padding: 0 0.5rem;
      }
      
      .card-header {
        padding: 1.5rem;
      }
      
      .entry-form {
        padding: 1.5rem;
      }
    }
  `]
})
export class ParkingEntryFormComponent {
  formData = {
    licensePlate: '',
    vehicleType: '' as VehicleType
  };

  isLoading = false;
  message = '';
  isSuccess = false;
  ticketInfo: any = null;

  constructor(private parkingService: ParkingService, private logger: LoggerService) {}

  onSubmit(form: any) {
    if (form.valid) {
      this.isLoading = true;
      this.message = '';
      this.ticketInfo = null;
      this.logger.info('Submitting vehicle entry', 'ParkingEntryFormComponent', { licensePlate: this.formData.licensePlate, vehicleType: this.formData.vehicleType });

      this.parkingService.parkVehicle(
        this.formData.licensePlate.toUpperCase(),
        this.formData.vehicleType
      ).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.isSuccess = response.success;
          this.message = response.message;
          this.logger.info('Vehicle entry result', 'ParkingEntryFormComponent', response);
          
          if (response.success) {
            this.ticketInfo = response;
            form.resetForm();
            this.formData = { licensePlate: '', vehicleType: '' as VehicleType };
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.isSuccess = false;
          this.message = 'An error occurred while parking the vehicle';
          this.logger.error('Vehicle entry failed', 'ParkingEntryFormComponent', error);
        }
      });
    }
  }
}