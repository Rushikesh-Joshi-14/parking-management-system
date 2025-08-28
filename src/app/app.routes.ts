import { Routes } from '@angular/router';
import { ParkingEntryFormComponent } from './components/parking-entry-form.component';
import { AvailableSlotsComponent } from './components/available-slots.component';
import { BillingDashboardComponent } from './components/billing-dashboard.component';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/entry', pathMatch: 'full' },
  { path: 'entry', component: ParkingEntryFormComponent },
  { path: 'slots', component: AvailableSlotsComponent },
  { path: 'billing', component: BillingDashboardComponent },
  { 
    path: 'admin-income', 
    component: BillingDashboardComponent, 
    canActivate: [AdminGuard] 
  },
  { path: '**', redirectTo: '/entry' }
];