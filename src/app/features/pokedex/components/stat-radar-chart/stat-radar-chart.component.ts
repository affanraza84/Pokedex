import {
  Component,
  ChangeDetectionStrategy,
  input,
  ElementRef,
  viewChild,
  effect,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, RadialLinearScale, RadarController, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { PokemonStats } from '../../../../core/models/pokemon.model';

Chart.register(RadialLinearScale, RadarController, PointElement, LineElement, Filler, Tooltip, Legend);

@Component({
  selector: 'app-stat-radar-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="radar-container">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .radar-container {
      position: relative;
      width: 100%;
      height: 280px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    canvas {
      max-width: 100%;
      max-height: 100%;
    }
  `]
})
export class StatRadarChartComponent implements OnDestroy {
  public readonly stats = input<PokemonStats | null>(null);
  public readonly pokemonName = input<string>('Pokémon');

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chartInstance: Chart<'radar'> | null = null;

  constructor() {
    effect(() => {
      const stats = this.stats();
      const canvasEl = this.canvasRef()?.nativeElement;
      if (canvasEl && stats) {
        this.renderOrUpdateChart(canvasEl, stats, this.pokemonName());
      }
    });
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  private renderOrUpdateChart(canvas: HTMLCanvasElement, stats: PokemonStats, name: string): void {
    const labels = ['HP', 'Attack', 'Defense', 'Sp. Attack', 'Sp. Defense', 'Speed'];
    const dataValues = [
      stats.hp,
      stats.attack,
      stats.defense,
      stats.specialAttack,
      stats.specialDefense,
      stats.speed
    ];

    if (this.chartInstance) {
      this.chartInstance.data.datasets[0].data = dataValues;
      this.chartInstance.data.datasets[0].label = name;
      this.chartInstance.update();
      return;
    }

    this.chartInstance = new Chart(canvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: name,
            data: dataValues,
            backgroundColor: 'rgba(239, 68, 68, 0.25)',
            borderColor: '#ef4444',
            borderWidth: 2,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: '#ef4444',
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750,
          easing: 'easeOutQuart'
        },
        scales: {
          r: {
            angleLines: {
              color: 'rgba(203, 213, 225, 0.6)'
            },
            grid: {
              color: 'rgba(203, 213, 225, 0.5)'
            },
            pointLabels: {
              font: {
                size: 11,
                weight: 'bold',
                family: 'system-ui, sans-serif'
              },
              color: '#334155'
            },
            ticks: {
              display: false,
              stepSize: 30
            },
            suggestedMin: 0,
            suggestedMax: 150
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: context => ` ${context.dataset.label}: ${context.raw} base`
            }
          }
        }
      }
    });
  }
}
