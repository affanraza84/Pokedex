import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="navbar">
      <div class="nav-container">
        <a routerLink="/pokedex" class="brand">
          <div class="pokeball-icon">
            <span class="pokeball-top"></span>
            <span class="pokeball-bottom"></span>
            <span class="pokeball-center"></span>
          </div>
          <span class="brand-text">Mini <strong>Pokédex</strong></span>
        </a>

        <nav class="nav-links">
          <a
            routerLink="/pokedex"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-link">
            Pokédex
          </a>
          <a
            routerLink="/teams"
            routerLinkActive="active"
            class="nav-link">
            Team Builder
          </a>
        </nav>

        <div class="server-badge" [class.badge-fallback]="isFallback()">
          <span class="pulse-dot"></span>
          <span>{{ isFallback() ? 'Offline Mode (Local Fallback)' : 'PokéAPI Live' }}</span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }
    .nav-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #0f172a;
    }
    .brand-text {
      font-size: 1.25rem;
      letter-spacing: -0.02em;
    }
    .brand-text strong {
      color: #ef4444;
      font-weight: 700;
    }
    .pokeball-icon {
      width: 28px;
      height: 28px;
      position: relative;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid #1e293b;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .pokeball-top {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 50%;
      background: #ef4444;
    }
    .pokeball-bottom {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 50%;
      background: #ffffff;
    }
    .pokeball-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      background: #ffffff;
      border: 2px solid #1e293b;
      border-radius: 50%;
      z-index: 2;
    }
    .nav-links {
      display: flex;
      gap: 8px;
    }
    .nav-link {
      padding: 8px 16px;
      border-radius: 8px;
      text-decoration: none;
      color: #64748b;
      font-weight: 500;
      font-size: 0.95rem;
      transition: all 0.2s ease;
    }
    .nav-link:hover {
      color: #0f172a;
      background: #f1f5f9;
    }
    .nav-link.active {
      color: #ef4444;
      background: #fee2e2;
      font-weight: 600;
    }
    .server-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 600;
    }
    .server-badge.badge-fallback {
      background: #fffbeb;
      color: #b45309;
      border-color: #fde68a;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
    }
    .badge-fallback .pulse-dot {
      background: #f59e0b;
    }
  `]
})
export class NavbarComponent {
  public readonly isFallback = input<boolean>(false);
}

