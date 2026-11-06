/**
 * json-graphql-server queries and mutations discovered directly from db.js schema.
 * Endpoint: http://localhost:4000/
 */

export const GET_ALL_TEAMS_QUERY = `
  query GetAllTeams($page: Int, $perPage: Int, $sortField: String, $sortOrder: String) {
    allTeams(page: $page, perPage: $perPage, sortField: $sortField, sortOrder: $sortOrder) {
      id
      name
      trainer_id
      pokemons
      Trainer {
        id
        name
      }
    }
  }
`;

export const GET_TEAM_BY_ID_QUERY = `
  query GetTeamById($id: ID!) {
    Team(id: $id) {
      id
      name
      trainer_id
      pokemons
      Trainer {
        id
        name
      }
    }
  }
`;

export const CREATE_TEAM_MUTATION = `
  mutation CreateTeam($name: String!, $pokemons: String!, $trainer_id: ID) {
    createTeam(name: $name, pokemons: $pokemons, trainer_id: $trainer_id) {
      id
      name
      trainer_id
      pokemons
      Trainer {
        id
        name
      }
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

export const GET_ALL_TRAINERS_QUERY = `
  query GetAllTrainers($page: Int, $perPage: Int) {
    allTrainers(page: $page, perPage: $perPage) {
      id
      name
      Teams {
        id
        name
      }
    }
  }
`;

export const CREATE_TRAINER_MUTATION = `
  mutation CreateTrainer($name: String!) {
    createTrainer(name: $name) {
      id
      name
    }
  }
`;
