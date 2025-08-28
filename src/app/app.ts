import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { LocalStorageService } from './services/local-storage.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-container">
      <!-- Navigation Header -->
      <nav class="navbar">
        <div class="nav-container">
          <div class="nav-brand">
            <h1>🅿️ ParkEase</h1>
            <p>Smart Parking Management</p>
          </div>
          
          <div class="nav-menu" [class.active]="isMenuOpen">
            <a 
              routerLink="/entry" 
              routerLinkActive="active"
              class="nav-link"
              (click)="closeMenu()">
              🚗 Park Vehicle
            </a>
            <a 
              routerLink="/slots" 
              routerLinkActive="active"
              class="nav-link"
              (click)="closeMenu()">
              🅿️ View Slots
            </a>
            <a 
              routerLink="/billing" 
              routerLinkActive="active"
              class="nav-link"
              (click)="closeMenu()">
              💰 Billing
            </a>
          </div>
          
          <button 
            class="mobile-menu-btn"
            (click)="toggleMenu()">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="footer">
        <div class="footer-content">
          <p>&copy; 2025 ParkEase. Smart Parking Management System</p>
          <div class="footer-links">
            <span>Made with ❤️ by Rushikesh Joshi</span>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      background-attachment: fixed;
    }

    .navbar {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-brand h1 {
      color: #1f2937;
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .nav-brand p {
      color: #6b7280;
      font-size: 0.9rem;
      margin: 0;
    }

    .nav-menu {
      display: flex;
      gap: 2rem;
      align-items: center;
    }

    .nav-link {
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 25px;
      transition: all 0.3s ease;
      position: relative;
      font-size: 1rem;
    }

    .nav-link:hover {
      color: #667eea;
      background: rgba(102, 126, 234, 0.1);
      transform: translateY(-2px);
    }

    .nav-link.active {
      color: white;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .mobile-menu-btn {
      display: none;
      flex-direction: column;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      gap: 4px;
    }

    .mobile-menu-btn span {
      width: 25px;
      height: 3px;
      background: #374151;
      border-radius: 2px;
      transition: all 0.3s ease;
    }

    .main-content {
      flex: 1;
      padding: 1rem 0;
      min-height: calc(100vh - 140px);
    }

    .footer {
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 1.5rem 0;
      margin-top: auto;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-links {
      font-size: 0.9rem;
      opacity: 0.8;
    }

    /* Mobile Styles */
    @media (max-width: 768px) {
      .mobile-menu-btn {
        display: flex;
      }

      .nav-menu {
        position: fixed;
        top: 100%;
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(10px);
        flex-direction: column;
        padding: 1rem;
        gap: 0.5rem;
        transform: translateY(-100%);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }

      .nav-menu.active {
        transform: translateY(0);
        opacity: 1;
        visibility: visible;
      }

      .nav-link {
        width: 100%;
        text-align: center;
        padding: 1rem;
        border-radius: 12px;
      }

      .nav-container {
        padding: 1rem;
      }

      .nav-brand h1 {
        font-size: 1.5rem;
      }

      .footer-content {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .main-content {
        padding: 0.5rem 0;
      }
    }

    @media (max-width: 480px) {
      .nav-brand h1 {
        font-size: 1.3rem;
      }
      
      .nav-brand p {
        font-size: 0.8rem;
      }
    }

    /* Animation for mobile menu button */
    .mobile-menu-btn.active span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }

    .mobile-menu-btn.active span:nth-child(2) {
      opacity: 0;
    }

    .mobile-menu-btn.active span:nth-child(3) {
      transform: rotate(-45deg) translate(7px, -6px);
    }
  `]
})
export class AppComponent {
  title = 'parking-management-system';
  isMenuOpen = false;

  constructor(
    private localStorageService: LocalStorageService,
    private router: Router
  ) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }
}