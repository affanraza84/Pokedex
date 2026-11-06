import { TestBed } from '@angular/core/testing';
import { of, throwError, firstValueFrom } from 'rxjs';
import { PokemonApiService } from './pokemon-api.service';
import { GraphQLService } from '../../core/services/graphql.service';
import { GraphQLError } from '../../core/models/graphql.model';

describe('PokemonApiService (GraphQL Operations)', () => {
  let service: PokemonApiService;
  let mockGraphQLService: { execute: any };

  const rawPokemonNode = {
    id: 1,
    name: 'bulbasaur',
    height: 7,
    weight: 69,
    pokemon_v2_pokemonsprites: [{ sprites: JSON.stringify({ front_default: 'https://img/1.png' }) }],
    pokemon_v2_pokemontypes: [{ pokemon_v2_type: { id: 12, name: 'grass' } }],
    pokemon_v2_pokemonstats: [
      { base_stat: 45, pokemon_v2_stat: { id: 1, name: 'hp' } },
      { base_stat: 49, pokemon_v2_stat: { id: 2, name: 'attack' } },
      { base_stat: 49, pokemon_v2_stat: { id: 3, name: 'defense' } },
      { base_stat: 65, pokemon_v2_stat: { id: 4, name: 'special-attack' } },
      { base_stat: 65, pokemon_v2_stat: { id: 5, name: 'special-defense' } },
      { base_stat: 45, pokemon_v2_stat: { id: 6, name: 'speed' } }
    ],
    pokemon_v2_pokemonabilities: [
      { is_hidden: false, slot: 1, pokemon_v2_ability: { id: 65, name: 'overgrow' } },
      { is_hidden: true, slot: 3, pokemon_v2_ability: { id: 34, name: 'chlorophyll' } }
    ]
  };

  beforeEach(() => {
    mockGraphQLService = {
      execute: () => of({})
    };

    TestBed.configureTestingModule({
      providers: [
        PokemonApiService,
        { provide: GraphQLService, useValue: mockGraphQLService }
      ]
    });

    service = TestBed.inject(PokemonApiService);
  });

  it('should fetch and normalize Pokémon list with stats, types, and abilities', async () => {
    mockGraphQLService.execute = () =>
      of({
        pokemon_v2_pokemon: [rawPokemonNode],
        pokemon_v2_pokemon_aggregate: { aggregate: { count: 151 } }
      });

    const res = await firstValueFrom(
      service.getPokemons({
        page: 1,
        pageSize: 10,
        search: '',
        type: '',
        sortField: 'id',
        sortOrder: 'asc'
      })
    );

    expect(res.totalCount).toBe(151);
    expect(res.pokemons.length).toBe(1);

    const p = res.pokemons[0];
    expect(p.id).toBe(1);
    expect(p.name).toBe('bulbasaur');
    expect(p.types).toEqual(['grass']);
    expect(p.stats.hp).toBe(45);
    expect(p.stats.attack).toBe(49);
    expect(p.stats.total).toBe(318);

    // Verify abilities
    expect(p.abilities.length).toBe(2);
    expect(p.abilities[0].name).toBe('overgrow');
    expect(p.abilities[0].isHidden).toBe(false);
    expect(p.abilities[1].name).toBe('chlorophyll');
    expect(p.abilities[1].isHidden).toBe(true);
  });

  it('should fetch single Pokémon details by ID', async () => {
    mockGraphQLService.execute = () =>
      of({
        pokemon_v2_pokemon_by_pk: rawPokemonNode
      });

    const pokemon = await firstValueFrom(service.getPokemonById(1));
    expect(pokemon.id).toBe(1);
    expect(pokemon.name).toBe('bulbasaur');
    expect(pokemon.abilities.length).toBe(2);
  });

  it('should propagate GraphQL errors without silently swallowing them', async () => {
    const errorToPropagate = new GraphQLError('Rate limit exceeded', []);
    mockGraphQLService.execute = () => throwError(() => errorToPropagate);

    try {
      await firstValueFrom(
        service.getPokemons({
          page: 1,
          pageSize: 10,
          search: 'mew',
          type: '',
          sortField: 'id',
          sortOrder: 'asc'
        })
      );
      expect.unreachable('Expected call to fail');
    } catch (err: any) {
      expect(err).toBe(errorToPropagate);
      expect(err.message).toContain('Rate limit exceeded');
    }
  });
});
