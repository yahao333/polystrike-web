
export interface Weapon {
  name: string;
  damage: number;
  ammo: number;
  maxAmmo: number;
  fireRate: number; // ms between shots
}

export interface EnemyData {
  id: string;
  position: [number, number, number];
  hp: number;
  maxHp: number;
  status: 'alive' | 'dead';
  enemyType: 'soldier' | 'creeper';
}

export interface GameState {
  score: number;
  health: number;
  isGameOver: boolean;
  enemies: EnemyData[];
}

export type MapTheme = 'default' | 'spaceship' | 'forest';
