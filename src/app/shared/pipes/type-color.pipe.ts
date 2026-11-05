import { Pipe, PipeTransform } from '@angular/core';

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  normal: { bg: '#A8A878', text: '#FFFFFF' },
  fire: { bg: '#F08030', text: '#FFFFFF' },
  water: { bg: '#6890F0', text: '#FFFFFF' },
  grass: { bg: '#78C850', text: '#FFFFFF' },
  electric: { bg: '#F8D030', text: '#222222' },
  ice: { bg: '#98D8D8', text: '#222222' },
  fighting: { bg: '#C03028', text: '#FFFFFF' },
  poison: { bg: '#A040A0', text: '#FFFFFF' },
  ground: { bg: '#E0C068', text: '#222222' },
  flying: { bg: '#A890F0', text: '#FFFFFF' },
  psychic: { bg: '#F85888', text: '#FFFFFF' },
  bug: { bg: '#A8B820', text: '#FFFFFF' },
  rock: { bg: '#B8A038', text: '#FFFFFF' },
  ghost: { bg: '#705898', text: '#FFFFFF' },
  dragon: { bg: '#7038F8', text: '#FFFFFF' },
  steel: { bg: '#B8B8D0', text: '#222222' },
  fairy: { bg: '#EE99AC', text: '#222222' }
};

/**
 * Transforms a Pokémon type into its brand hex color.
 */
@Pipe({
  name: 'typeColor',
  standalone: true
})
export class TypeColorPipe implements PipeTransform {
  transform(type: string | undefined): { bg: string; text: string } {
    if (!type) return { bg: '#6c757d', text: '#FFFFFF' };
    const key = type.toLowerCase();
    return TYPE_COLORS[key] ?? { bg: '#6c757d', text: '#FFFFFF' };
  }
}
