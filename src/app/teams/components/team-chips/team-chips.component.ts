import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamMember } from '../../models/team.model';
import { TypeColorPipe } from '../../../shared/pipes/type-color.pipe';

@Component({
  selector: 'app-team-chips',
  standalone: true,
  imports: [CommonModule, TypeColorPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chips-container">
      @if (members().length === 0) {
        <div class="empty-chips-hint">
          <span class="hint-icon">📋</span>
          <span>No Pokémon selected yet. Search and select between 1 and 6 Pokémon.</span>
        </div>
      } @else {
        <div class="chips-grid">
          @for (member of members(); track $index) {
            <div class="team-chip" [attr.aria-label]="member.name">
              <img [src]="member.sprite" [alt]="member.name" class="chip-sprite" />
              <div class="chip-details">
                <span class="chip-name">{{ member.name | titlecase }}</span>
                <div class="chip-types">
                  @for (type of member.types; track type) {
                    @let color = type | typeColor;
                    <span
                      class="mini-pill"
                      [style.backgroundColor]="color.bg"
                      [style.color]="color.text">
                      {{ type }}
                    </span>
                  }
                </div>
              </div>
              <button
                type="button"
                class="remove-chip-btn"
                [attr.aria-label]="'Remove ' + member.name + ' from team'"
                (click)="remove.emit($index)">
                ✕
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .chips-container {
      width: 100%;
    }
    .empty-chips-hint {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      color: #64748b;
      font-size: 0.9rem;
    }
    .hint-icon {
      font-size: 1.2rem;
    }
    .chips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
    }
    .team-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      position: relative;
      transition: all 0.2s;
    }
    .team-chip:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
    }
    .chip-sprite {
      width: 36px;
      height: 36px;
      object-fit: contain;
    }
    .chip-details {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
    }
    .chip-name {
      font-weight: 600;
      font-size: 0.88rem;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .chip-types {
      display: flex;
      gap: 4px;
      margin-top: 2px;
    }
    .mini-pill {
      font-size: 0.6rem;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .remove-chip-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 0.8rem;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .remove-chip-btn:hover {
      background: #fee2e2;
      color: #ef4444;
    }
  `]
})
export class TeamChipsComponent {
  public readonly members = input<TeamMember[]>([]);
  public readonly remove = output<number>();
}

