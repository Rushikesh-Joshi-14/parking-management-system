import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParkingService } from '../services/parking.service';
import { LocalStorageService } from '../services/local-storage.service';
import { IncomeResponse } from '../models/parking.model';
import { CurrencyFormatPipe } from '../pipes/currency-format.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-billing-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyFormatPipe, FormsModule],
  template: `
    <div class="billing-container">
      <!-- Admin Toggle -->
      <div class="admin-section">
        <div class="admin-toggle">
          <label class="toggle-label">
            <input 
              type="checkbox" 
              [(ngModel)]="isAdminMode"
              (change)="toggleAdminMode()"
              class="toggle-input">
            <span class="toggle-slider"></span>
            <span class="toggle-text">{{ isAdminMode ? '👨‍💼 Admin Mode' : '👤 User Mode' }}</span>
          </label>
        </div>
      </div>

      <!-- User Section - Vehicle Exit -->
      <div *ngIf="!isAdminMode" class="user-section">
        <div class="card">
          <div class="card-header">
            <h2>🚪 Vehicle Exit & Billing</h2>
            <p>Enter your ticket ID to calculate bill and exit</p>
          </div>
          
          <div class="exit-form">
            <div class="form-group">
              <label for="ticketId">Ticket ID *</label>
              <input 
                type="text" 
                id="ticketId"
                [(ngModel)]="ticketId"
                placeholder="e.g., TKT-ABC123XYZ"
                class="form-control"
                maxlength="20">
            </div>
            
            <button 
              (click)="calculateBill()" 
              [disabled]="!ticketId || isCalculating"
              class="calculate-btn">
              <span *ngIf="isCalculating" class="loading-spinner"></span>
              {{ isCalculating ? 'Calculating...' : '💰 Calculate Bill' }}
            </button>
          </div>

          <!-- Bill Result -->
          <div *ngIf="billResult" class="bill-result" [class.success]="billResult.success" [class.error]="!billResult.success">
            <div class="result-header">
              <span class="icon">{{ billResult.success ? '✅' : '❌' }}</span>
              <h3>{{ billResult.success ? 'Bill Calculated' : 'Error' }}</h3>
            </div>
            
            <p class="result-message">{{ billResult.message }}</p>
            
            <div *ngIf="billResult.success" class="bill-details">
              <div class="bill-item">
                <span>Duration:</span>
                <strong>{{ billResult.duration }} hours</strong>
              </div>
              <div class="bill-item total">
                <span>Total Amount:</span>
                <strong class="amount">{{ billResult.totalBill | currencyFormat }}</strong>
              </div>
              
              <div class="payment-section">
                <h4>💳 Payment Options</h4>
                <div class="payment-methods">
                  <button class="payment-btn cash">💵 Cash</button>
                  <button class="payment-btn card">💳 Card</button>
                  <button class="payment-btn digital">📱 Digital</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Admin Section - Income Dashboard -->
      <div *ngIf="isAdminMode" class="admin-dashboard">
        <div class="dashboard-header">
          <h2>📊 Income Dashboard</h2>
          <button (click)="refreshIncome()" class="refresh-btn" [disabled]="isLoadingIncome">
            <span [class.spinning]="isLoadingIncome">🔄</span> Refresh
          </button>
        </div>

        <!-- Income Cards -->
        <div class="income-grid" *ngIf="incomeData">
          <div class="income-card total">
            <div class="card-icon">💰</div>
            <div class="card-content">
              <h3>{{ incomeData.totalIncome | currencyFormat }}</h3>
              <p>Total Income</p>
              <small>All time earnings</small>
            </div>
          </div>
          
          <div class="income-card today">
            <div class="card-icon">📅</div>
            <div class="card-content">
              <h3>{{ incomeData.todayIncome | currencyFormat }}</h3>
              <p>Today's Income</p>
              <small>Current day earnings</small>
            </div>
          </div>
          
          <div class="income-card vehicles">
            <div class="card-icon">🚗</div>
            <div class="card-content">
              <h3>{{ currentVehiclesParked }}</h3>
              <p>Vehicles Parked</p>
              <small>Currently in parking</small>
            </div>
          </div>
        </div>

        <!-- Statistics Section -->
        <div class="statistics-section" *ngIf="incomeData">
          <div class="stats-card">
            <h3>📈 Quick Stats</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Average per vehicle:</span>
                <span class="stat-value">{{ getAveragePerVehicle() | currencyFormat }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Occupancy rate:</span>
                <span class="stat-value">{{ getOccupancyRate() }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Peak earnings:</span>
                <span class="stat-value">{{ incomeData.todayIncome | currencyFormat }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Admin Actions -->
        <div class="admin-actions">
          <div class="actions-card">
            <h3>⚙️ Admin Actions</h3>
            <div class="action-buttons">
              <button (click)="resetDailyIncome()" class="action-btn warning">
                🔄 Reset Daily Income
              </button>
              <button (click)="exportReport()" class="action-btn primary">
                📊 Export Report
              </button>
              <button (click)="clearAllData()" class="action-btn danger">
                🗑️ Clear All Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoadingIncome" class="loading-state">
        <div class="loading-spinner-large"></div>
        <p>Loading income data...</p>
      </div>
    </div>
  `,
  styles: [`
    .billing-container {
      max-width: 1000px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .admin-section {
      margin-bottom: 2rem;
      text-align: center;
    }

    .admin-toggle {
      display: inline-block;
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      font-weight: 500;
      color: #374151;
    }

    .toggle-input {
      display: none;
    }

    .toggle-slider {
      position: relative;
      width: 50px;
      height: 26px;
      background: #cbd5e1;
      border-radius: 13px;
      transition: all 0.3s ease;
    }

    .toggle-slider::before {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 22px;
      height: 22px;
      background: white;
      border-radius: 50%;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .toggle-input:checked + .toggle-slider {
      background: #6366f1;
    }

    .toggle-input:checked + .toggle-slider::before {
      transform: translateX(24px);
    }

    .toggle-text {
      font-size: 1.1rem;
      min-width: 120px;
    }

    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
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
    }

    .exit-form {
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

    .calculate-btn {
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

    .calculate-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
    }

    .calculate-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .bill-result {
      margin: 2rem;
      padding: 1.5rem;
      border-radius: 12px;
      animation: slideIn 0.3s ease;
    }

    .bill-result.success {
      background: #ecfdf5;
      border: 2px solid #10b981;
    }

    .bill-result.error {
      background: #fef2f2;
      border: 2px solid #ef4444;
    }

    .result-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .result-header .icon {
      font-size: 1.5rem;
    }

    .result-header h3 {
      margin: 0;
      color: #1f2937;
    }

    .result-message {
      margin-bottom: 1.5rem;
      color: #374151;
    }

    .bill-details {
      background: rgba(255, 255, 255, 0.8);
      padding: 1.5rem;
      border-radius: 8px;
    }

    .bill-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .bill-item.total {
      border-bottom: none;
      padding-top: 1rem;
      margin-top: 0.5rem;
      border-top: 2px solid #10b981;
      font-size: 1.2rem;
    }

    .amount {
      color: #10b981;
      font-size: 1.5rem;
    }

    .payment-section {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .payment-section h4 {
      margin: 0 0 1rem 0;
      color: #374151;
    }

    .payment-methods {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .payment-btn {
      padding: 0.75rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 500;
    }

    .payment-btn:hover {
      border-color: #10b981;
      background: #f0fdf4;
      transform: translateY(-1px);
    }

    .admin-dashboard {
      space-y: 2rem;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .dashboard-header h2 {
      margin: 0;
      color: #1f2937;
      font-size: 2rem;
      font-weight: 700;
    }

    .refresh-btn {
      padding: 0.5rem 1rem;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .refresh-btn:hover:not(:disabled) {
      background: #e5e7eb;
      transform: translateY(-1px);
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    .income-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .income-card {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1.5rem;
      transition: all 0.3s ease;
      border-left: 5px solid;
    }

    .income-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }

    .income-card.total {
      border-left-color: #10b981;
    }

    .income-card.today {
      border-left-color: #3b82f6;
    }

    .income-card.vehicles {
      border-left-color: #f59e0b;
    }

    .card-icon {
      font-size: 3rem;
      opacity: 0.8;
    }

    .card-content h3 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 700;
      color: #1f2937;
    }

    .card-content p {
      margin: 0.5rem 0 0.25rem 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #374151;
    }

    .card-content small {
      color: #6b7280;
      font-size: 0.85rem;
    }

    .statistics-section {
      margin-bottom: 2rem;
    }

    .stats-card {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .stats-card h3 {
      margin: 0 0 1.5rem 0;
      color: #1f2937;
      font-size: 1.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #6366f1;
    }

    .stat-label {
      color: #6b7280;
      font-weight: 500;
    }

    .stat-value {
      font-weight: 700;
      color: #1f2937;
    }

    .admin-actions {
      margin-bottom: 2rem;
    }

    .actions-card {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .actions-card h3 {
      margin: 0 0 1.5rem 0;
      color: #1f2937;
      font-size: 1.5rem;
    }

    .action-buttons {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-btn {
      padding: 1rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }

    .action-btn.primary {
      background: #3b82f6;
      color: white;
    }

    .action-btn.warning {
      background: #f59e0b;
      color: white;
    }

    .action-btn.danger {
      background: #ef4444;
      color: white;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      opacity: 0.9;
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
    }

    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-spinner-large {
      width: 48px;
      height: 48px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 640px) {
      .billing-container {
        margin: 1rem auto;
        padding: 0 0.5rem;
      }

      .dashboard-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .income-grid {
        grid-template-columns: 1fr;
      }

      .payment-methods {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        grid-template-columns: 1fr;
      }

      .income-card {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
      }
    }
  `]
})
export class BillingDashboardComponent implements OnInit {
  isAdminMode = false;
  
  // User section
  ticketId = '';
  isCalculating = false;
  billResult: any = null;
  
  // Admin section
  incomeData: IncomeResponse | null = null;
  isLoadingIncome = false;
  currentVehiclesParked = 0;

  constructor(
    private parkingService: ParkingService,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit() {
    this.isAdminMode = this.localStorageService.isAdmin();
    if (this.isAdminMode) {
      this.loadIncomeData();
    }
  }

  toggleAdminMode() {
    this.localStorageService.setAdminStatus(this.isAdminMode);
    if (this.isAdminMode) {
      this.loadIncomeData();
    } else {
      this.incomeData = null;
      this.currentVehiclesParked = 0;
    }
    this.billResult = null;
    this.ticketId = '';
  }

  calculateBill() {
    if (!this.ticketId.trim()) return;

    this.isCalculating = true;
    this.billResult = null;

    const exitRequest = {
      ticketId: this.ticketId.trim(),
      timeOfExit: new Date()
    };

    this.parkingService.exitVehicle(exitRequest).subscribe({
      next: (response) => {
        this.isCalculating = false;
        this.billResult = response;
        if (response.success) {
          this.ticketId = '';
        }
      },
      error: (error) => {
        this.isCalculating = false;
        this.billResult = {
          success: false,
          message: 'An error occurred while calculating the bill',
          totalBill: 0,
          duration: 0
        };
        console.error('Bill calculation error:', error);
      }
    });
  }

  loadIncomeData() {
    this.isLoadingIncome = true;
    // Load income
    this.parkingService.getIncome().subscribe({
      next: (data) => {
        this.incomeData = data;
        this.isLoadingIncome = false;
      },
      error: (error) => {
        console.error('Error loading income data:', error);
        this.isLoadingIncome = false;
      }
    });
    // Load current parked vehicles from status for real-time accuracy
    this.parkingService.getParkingStatus().subscribe({
      next: (status) => {
        this.currentVehiclesParked = status.occupiedSlots.length;
      },
      error: (error) => {
        console.error('Error loading parking status:', error);
        this.currentVehiclesParked = 0;
      }
    });
  }

  refreshIncome() {
    this.loadIncomeData();
  }

  getAveragePerVehicle(): number {
    if (!this.incomeData || this.incomeData.totalVehiclesParked === 0) {
      return 0;
    }
    return this.incomeData.totalIncome / Math.max(1, this.incomeData.totalVehiclesParked);
  }

  getOccupancyRate(): number {
    if (!this.incomeData) return 0;
    // Assuming total 25 slots (10 bike + 10 car + 5 EV)
    const totalSlots = 25;
    return Math.round((this.incomeData.totalVehiclesParked / totalSlots) * 100);
  }

  resetDailyIncome() {
    if (confirm('Are you sure you want to reset today\'s income? This action cannot be undone.')) {
      const data = this.localStorageService.getParkingData();
      if (data) {
        data.todayIncome = 0;
        this.localStorageService.saveParkingData(data);
        this.loadIncomeData();
      }
    }
  }

  exportReport() {
    if (!this.incomeData) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      totalIncome: this.incomeData.totalIncome,
      todayIncome: this.incomeData.todayIncome,
      vehiclesParked: this.incomeData.totalVehiclesParked,
      occupancyRate: this.getOccupancyRate(),
      averagePerVehicle: this.getAveragePerVehicle()
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parking-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  clearAllData() {
    if (confirm('Are you sure you want to clear all parking data? This will remove all vehicles and reset income. This action cannot be undone.')) {
      this.localStorageService.clearData();
      this.loadIncomeData();
      alert('All data has been cleared successfully.');
    }
  }
}