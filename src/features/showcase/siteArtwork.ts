export const visual = (name: string) => `/artwork/${name}.webp`;

export const characterArtwork = {
  reference: visual('character-reference'),
  illustrated: visual('character-illustrated'),
  expressions: [visual('character-joy'), visual('character-brave'), visual('character-curious')],
  angles: [visual('character-front'), visual('character-profile'), visual('character-action')],
  styles: [visual('style-cinematic'), visual('style-watercolor'), visual('style-comic')],
};

export const careerArtwork = {
  astronaut: visual('career-astronaut'),
  engineer: visual('career-engineer'),
  doctor: visual('career-doctor'),
  scientist: visual('career-scientist'),
};

export const merchArtwork = {
  plush: visual('merch-plush'),
  giftbox: visual('merch-giftbox'),
  lamp: visual('merch-lamp'),
  backpack: visual('merch-backpack'),
  activity: visual('merch-activity'),
  trio: visual('merch-trio'),
};
