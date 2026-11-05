/**
 * json-graphql-server queries and mutations for teams.
 * Server: http://localhost:4000/
 */

export const GET_ALL_TEAMS_QUERY = `
  query GetAllTeams {
    allTeams {
      id
      name
      pokemons
    }
  }
`;

export const CREATE_TEAM_MUTATION = `
  mutation CreateTeam($name: String!, $pokemons: String!) {
    createTeam(name: $name, pokemons: $pokemons) {
      id
      name
      pokemons
    }
  }
`;

export const DELETE_TEAM_MUTATION = `
  mutation DeleteTeam($id: ID!) {
    removeTeam(id: $id) {
      id
      name
    }
  }
`;
