import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'pokedex'
  },
  {
    path: 'pokedex',
    loadComponent: () =>
      import('./features/pokedex/pokedex.component').then(m => m.PokedexComponent)
  },
  {
    path: 'teams',
    loadComponent: () =>
      import('./features/team-builder/team-builder.component').then(m => m.TeamBuilderComponent)
  },
  {
    path: '**',
    redirectTo: 'pokedex'
  }
];
