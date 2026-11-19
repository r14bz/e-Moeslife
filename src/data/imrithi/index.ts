import { imrithiBabs } from './daftarBab';
import { baitsBagian1 } from './bagian1-muqaddimah-irob';
import { baitsBagian2 } from './bagian2-nakirah-afal';
import { baitsBagian3 } from './bagian3-marfuat-tawabi';
import { baitsBagian4 } from './bagian4-manshubat-khatimah';
import type { ImrithiBait } from '../../types/imrithi';

export { imrithiBabs };

export const allImrithiBaits: ImrithiBait[] = [
  ...baitsBagian1,
  ...baitsBagian2,
  ...baitsBagian3,
  ...baitsBagian4,
];
