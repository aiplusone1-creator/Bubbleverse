import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\dfd0540b-c896-4021-bfae-5c19d6a8988e';

const copies = [
  { src: 'hero_left_boy_1794933082565.jpg', dest: 'public/bubble-books/hero-left.jpg' },
  { src: 'hero_right_girl_1794933112483.jpg', dest: 'public/bubble-books/hero-right.jpg' },
  { src: 'jungle_adventure_cover_clean_1794932835641.jpg', dest: 'public/bubble-books/jungle.jpg' },
  { src: 'career_astronaut_1794933093527.jpg', dest: 'public/bubble-books/space.jpg' },
  { src: 'career_astronaut_1794933093527.jpg', dest: 'public/showcase/career/career-astronaut.jpg' },
  { src: 'career_engineer_1794933114400.jpg', dest: 'public/showcase/career/career-engineer.jpg' },
  { src: 'likeness_real_photo_1794933089401.jpg', dest: 'public/showcase/character/likeness-real.jpg' },
  { src: 'likeness_pixar_hero_1794933109092.jpg', dest: 'public/showcase/character/likeness-pixar.jpg' },
  { src: 'catalog_dinosaur_valley_1794933102992.jpg', dest: 'public/catalog/dinosaur-valley.jpg' },
  { src: 'catalog_bedtime_magic_1794933113442.jpg', dest: 'public/catalog/bedtime-magic.jpg' },
  { src: 'catalog_bedtime_magic_1794933113442.jpg', dest: 'public/showcase/gender/gender-girl.jpg' },
  { src: 'catalog_superhero_academy_1794933125491.jpg', dest: 'public/catalog/superhero-academy.jpg' },
  { src: 'catalog_superhero_academy_1794933125491.jpg', dest: 'public/showcase/gender/gender-boy.jpg' },
  { src: 'review_seif_family_1794933108085.jpg', dest: 'public/showcase/reviews/review-seif.jpg' },
  { src: 'review_fahad_family_1794933126015.jpg', dest: 'public/showcase/reviews/review-fahad.jpg' },
];

for (const item of copies) {
  const fullSrc = path.join(brainDir, item.src);
  const fullDest = path.resolve(process.cwd(), item.dest);
  fs.mkdirSync(path.dirname(fullDest), { recursive: true });
  fs.copyFileSync(fullSrc, fullDest);
  const stats = fs.statSync(fullDest);
  console.log(`Copied ${item.src} -> ${item.dest} (${(stats.size / 1024).toFixed(1)} KB)`);
}
