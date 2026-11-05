/**
 * PokéAPI v1beta GraphQL queries.
 * Target: https://beta.pokeapi.co/graphql/v1beta
 */

export const GET_POKEMON_LIST_QUERY = `
  query GetPokemonList($limit: Int, $offset: Int, $where: pokemon_v2_pokemon_bool_exp, $order_by: [pokemon_v2_pokemon_order_by!]) {
    pokemon_v2_pokemon(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
      id
      name
      height
      weight
      pokemon_v2_pokemonsprites {
        sprites
      }
      pokemon_v2_pokemontypes {
        pokemon_v2_type {
          name
        }
      }
      pokemon_v2_pokemonstats {
        base_stat
        pokemon_v2_stat {
          name
        }
      }
    }
    pokemon_v2_pokemon_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_POKEMON_TYPES_QUERY = `
  query GetPokemonTypes {
    pokemon_v2_type {
      id
      name
    }
  }
`;

