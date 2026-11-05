import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToastMessage {
  text: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toast(); as t) {
      <aside class="toast-wrapper" [class]="'toast-' + t.type" role="alert" aria-live="assertive">
        <div class="toast-icon">
          @if (t.type === 'success') {
            <span>✓</span>
          } @else if (t.type === 'error') {
            <span>⚠️</span>
          } @else {
            <span>ℹ️</span>
          }
        </div>
        <div class="toast-message">{{ t.text }}</div>
        <button
          type="button"
          class="toast-close-btn"
          aria-label="Dismiss notification"
          (click)="closed.emit()">
          ✕
        </button>
      </aside>
    }
  `,
  styles: [`
    .toast-wrapper {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      max-width: 450px;
      padding: 14px 18px;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      font-size: 0.95rem;
      font-weight: 500;
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      backdrop-filter: blur(8px);
      color: #ffffff;
    }
    .toast-success {
      background: linear-gradient(135deg, #10b981, #059669);
      border-left: 5px solid #047857;
    }
    .toast-error {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      border-left: 5px solid #b91c1c;
    }
    .toast-info {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border-left: 5px solid #1d4ed8;
    }
    .toast-icon {
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .toast-message {
      flex: 1;
      line-height: 1.4;
    }
    .toast-close-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.85);
      cursor: pointer;
      font-size: 1rem;
      padding: 4px;
      border-radius: 4px;
      transition: background 0.15s, color 0.15s;
    }
    .toast-close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }
    @keyframes slideIn {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastComponent {
  public readonly toast = input<ToastMessage | null>(null);
  public readonly closed = output<void>();
}
