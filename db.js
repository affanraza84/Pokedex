/**
 * Mock database for json-graphql-server
 * Run command: npx json-graphql-server db.js --port 4000
 */
module.exports = {
  trainers: [
    { id: '1', name: 'Ash Ketchum' },
    { id: '2', name: 'Misty' },
    { id: '3', name: 'Brock' }
  ],
  teams: [
    {
      id: '1',
      name: 'Kanto Classics',
      trainer_id: '1',
      pokemons: JSON.stringify([
        {
          id: 1,
          name: 'bulbasaur',
          sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
          types: ['grass', 'poison'],
          stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45, total: 318 },
          abilities: ['overgrow', 'chlorophyll']
        },
        {
          id: 4,
          name: 'charmander',
          sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png',
          types: ['fire'],
          stats: { hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65, total: 309 },
          abilities: ['blaze', 'solar-power']
        },
        {
          id: 7,
          name: 'squirtle',
          sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png',
          types: ['water'],
          stats: { hp: 44, attack: 48, defense: 65, specialAttack: 50, specialDefense: 64, speed: 43, total: 314 },
          abilities: ['torrent', 'rain-dish']
        },
        {
          id: 25,
          name: 'pikachu',
          sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
          types: ['electric'],
          stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90, total: 320 },
          abilities: ['static', 'lightning-rod']
        }
      ])
    },
    {
      id: '2',
      name: 'Ghost & Dragon Strike',
      trainer_id: '2',
      pokemons: JSON.stringify([
        {
          id: 94,
          name: 'gengar',
          sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png',
          types: ['ghost', 'poison'],
          stats: { hp: 60, attack: 65, defense: 60, specialAttack: 130, specialDefense: 75, speed: 110, total: 500 },
          abilities: ['cursed-body']
        },
        {
          id: 149,
          name: 'dragonite',
          sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png',
          types: ['dragon', 'flying'],
          stats: { hp: 91, attack: 134, defense: 95, specialAttack: 100, specialDefense: 100, speed: 80, total: 600 },
          abilities: ['inner-focus', 'multiscale']
        }
      ])
    },
    {
      id: '3',
      name: 'Rock Solid',
      pokemons: JSON.stringify([
        {
          id: 95,
          name: 'onix',
          sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/95.png',
          types: ['rock', 'ground'],
          stats: { hp: 35, attack: 45, defense: 160, specialAttack: 30, specialDefense: 45, speed: 70, total: 385 },
          abilities: ['rock-head', 'sturdy', 'weak-armor']
        }
      ])
    }
  ]
};
