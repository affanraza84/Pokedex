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
      import('./pokedex/pokedex.component').then(m => m.PokedexComponent)
  },
  {
    path: 'teams',
    loadComponent: () =>
      import('./teams/teams.component').then(m => m.TeamsComponent)
  },
  {
    path: '**',
    redirectTo: 'pokedex'
  }
];
