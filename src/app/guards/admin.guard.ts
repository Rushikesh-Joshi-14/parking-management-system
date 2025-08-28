import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private localStorageService: LocalStorageService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.localStorageService.isAdmin()) {
      return true;
    }
    
    // Redirect to home page if not admin
    this.router.navigate(['/']);
    return false;
  }
}