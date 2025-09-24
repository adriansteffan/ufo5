import { MALE_NAMES, FEMALE_NAMES, TRAIT_DISPLAY_WORDS, MISC_DISPLAY_WORDS, COUPLE_MESSAGES } from './datinggamelist';

// Core personality scales (0-10, 5 is average)
export interface CoreTraits {
  openness: number; // 0=traditional, 10=very open to new experiences
  sportiness: number; // 0=sedentary, 10=very athletic
  social: number; // 0=introverted, 10=very social
  natural: number; // 0=glamorous/makeup, 10=natural/low-maintenance
}

// Binary preferences (neutral, positive, or negative)
export type PreferenceValue = 'neutral' | 'positive' | 'negative';

export interface MiscPreferences {
  cats: PreferenceValue;
  dogs: PreferenceValue;
  smoking: PreferenceValue;
  drinking: PreferenceValue;
  travel: PreferenceValue;
  cooking: PreferenceValue;
  reading: PreferenceValue;
  music: PreferenceValue;
  movies: PreferenceValue;
  outdoors: PreferenceValue;
}

export interface Person {
  id: number; // autoincrementing from 0, so safe for ids unless we play this game for millions of years
  name: string;
  image: string;
  gender: 'male' | 'female';
  lookingFor: 'male' | 'female' | 'both';
  coreTraits: CoreTraits;
  miscPreferences: MiscPreferences;
  displayTraits: string[]; // Generated from core traits and preferences
}

const MEN_IMAGES = Array.from({ length: 53 }, (_, i) => `/dating/men/man_${i + 1}.png`);
const WOMEN_IMAGES = Array.from({ length: 61 }, (_, i) => `/dating/women/woman_${i + 1}.png`);

// Helper functions for trait generation
const generateCoreTraits = (): CoreTraits => {
  // Generate traits using uniform distribution (0-10)
  const uniformRandom = () => Math.floor(Math.random() * 11); // 0 to 10 inclusive

  return {
    openness: uniformRandom(),
    sportiness: uniformRandom(),
    social: uniformRandom(),
    natural: uniformRandom(),
  };
};

const generateMiscPreferences = (): MiscPreferences => {
  const randomPreference = (): PreferenceValue => {
    const rand = Math.random();
    if (rand < 0.7) return 'neutral'; // 70% neutral
    return rand < 0.85 ? 'positive' : 'negative'; // 15% positive, 15% negative
  };

  return {
    cats: randomPreference(),
    dogs: randomPreference(),
    smoking: randomPreference(),
    drinking: randomPreference(),
    travel: randomPreference(),
    cooking: randomPreference(),
    reading: randomPreference(),
    music: randomPreference(),
    movies: randomPreference(),
    outdoors: randomPreference(),
  };
};

const generateDisplayTraits = (
  coreTraits: CoreTraits,
  miscPreferences: MiscPreferences,
): string[] => {
  const traits: string[] = [];

  // Add core trait displays with 5 levels
  Object.entries(coreTraits).forEach(([traitName, value]) => {
    const traitKey = traitName as keyof typeof TRAIT_DISPLAY_WORDS;
    let level: 'veryLow' | 'low' | 'medium' | 'high' | 'veryHigh';

    if (value <= 2) level = 'veryLow';
    else if (value <= 4) level = 'low';
    else if (value <= 6) level = 'medium';
    else if (value <= 8) level = 'high';
    else level = 'veryHigh';

    const options = TRAIT_DISPLAY_WORDS[traitKey][level];
    traits.push(options[Math.floor(Math.random() * options.length)]);
  });

  // Add only 1-2 misc preference displays (not all of them)
  const nonNeutralPrefs = Object.entries(miscPreferences).filter(
    ([_, value]) => value !== 'neutral',
  );
  const numMiscTraits = Math.min(nonNeutralPrefs.length, Math.floor(Math.random() * 2) + 1); // 1-2 misc traits
  const selectedPrefs = nonNeutralPrefs.sort(() => Math.random() - 0.5).slice(0, numMiscTraits);

  selectedPrefs.forEach(([prefName, value]) => {
    const prefKey = prefName as keyof typeof MISC_DISPLAY_WORDS;
    const options = MISC_DISPLAY_WORDS[prefKey][value];
    traits.push(options[Math.floor(Math.random() * options.length)]);
  });

  // Sort traits by length (longest first, then shorter ones together)
  traits.sort((a, b) => b.length - a.length);

  return traits;
};

export const createPersonGenerator = () => {
  let personCount: number = 0;

  const generateRandomPerson = (): Person => {
    const gender = Math.random() < 0.5 ? 'male' : 'female';
    const name = gender === 'male' ? MALE_NAMES.sample()[0] : FEMALE_NAMES.sample()[0];
    const image = gender === 'male' ? MEN_IMAGES.sample()[0] : WOMEN_IMAGES.sample()[0];

    // Generate lookingFor preference (75% straight, 5% gay, 20% bi)
    const rand = Math.random();
    let lookingFor: 'male' | 'female' | 'both';
    if (rand < 0.75) {
      lookingFor = gender === 'male' ? 'female' : 'male'; // straight
    } else if (rand < 0.8) {
      lookingFor = gender; // gay
    } else {
      lookingFor = 'both'; // bi
    }

    // Generate personality traits
    const coreTraits = generateCoreTraits();
    const miscPreferences = generateMiscPreferences();
    const displayTraits = generateDisplayTraits(coreTraits, miscPreferences);

    const id = personCount;
    personCount = personCount + 1;

    return {
      id,
      name,
      image,
      gender,
      lookingFor,
      coreTraits,
      miscPreferences,
      displayTraits,
    };
  };

  return generateRandomPerson;
};

// Couple compatibility judging system
export const judgeCouple = (person1: Person, person2: Person): number => {
  let score = 0;

  // 1. Attraction compatibility (extremely important - 50% of score)
  let attractionScore = 0;

  // Check if they're attracted to each other
  const person1AttractedTo2 = person1.lookingFor === person2.gender || person1.lookingFor === 'both';
  const person2AttractedTo1 = person2.lookingFor === person1.gender || person2.lookingFor === 'both';

  if (person1AttractedTo2 && person2AttractedTo1) {
    attractionScore = 50; // Perfect mutual attraction
  } else if (person1AttractedTo2 || person2AttractedTo1) {
    attractionScore = 25; // One-way attraction
  } else {
    attractionScore = 0; // No attraction
  }

  score += attractionScore;

  // 2. Core traits compatibility (important - 35% of score)
  let traitsScore = 0;
  const traitKeys: (keyof CoreTraits)[] = ['openness', 'sportiness', 'social', 'natural'];

  traitKeys.forEach(trait => {
    const diff = Math.abs(person1.coreTraits[trait] - person2.coreTraits[trait]);
    // Score based on how close traits are (0 = identical, 10 = opposite)
    const traitScore = Math.max(0, 10 - diff); // 0-10 scale
    traitsScore += traitScore;
  });

  // Convert to percentage (max 40 points from 4 traits * 10)
  traitsScore = (traitsScore / 40) * 35;
  score += traitsScore;

  // 3. Misc preferences alignment (15% of score)
  let miscScore = 0;
  let sharedPreferences = 0;
  let conflictingPreferences = 0;

  const prefKeys: (keyof MiscPreferences)[] = Object.keys(person1.miscPreferences) as (keyof MiscPreferences)[];

  prefKeys.forEach(pref => {
    const pref1 = person1.miscPreferences[pref];
    const pref2 = person2.miscPreferences[pref];

    if (pref1 !== 'neutral' && pref2 !== 'neutral') {
      if (pref1 === pref2) {
        sharedPreferences += 1; // Both have same strong preference
      } else {
        conflictingPreferences += 1; // Conflicting strong preferences
      }
    }
  });

  // Bonus for shared preferences, penalty for conflicts
  miscScore = (sharedPreferences * 3) - (conflictingPreferences * 2);
  miscScore = Math.max(0, Math.min(15, miscScore)); // Cap at 15%
  score += miscScore;

  return Math.round(Math.max(0, Math.min(100, score)));
};

// News message generation for couples
export const generateNewsMessage = (couples: { person1: Person; person2: Person; matchScore: number }[], maxRecentCouples: number = 5): string => {
  if (couples.length === 0) {
    return '';
  }

  // Only use the last few couples (most recent)
  const recentCouples = couples.slice(-maxRecentCouples);
  const randomCouple = recentCouples[Math.floor(Math.random() * recentCouples.length)];
  const score = randomCouple.matchScore;

  // Add noise to score for message selection (even good couples have awkward moments)
  const noisyScore = score + (Math.random() - 0.5) * 30; // +-15 points of noise

  let messageCategory: 'veryPositive' | 'positive' | 'neutral' | 'negative' | 'veryNegative';
  if (noisyScore >= 80) messageCategory = 'veryPositive';
  else if (noisyScore >= 60) messageCategory = 'positive';
  else if (noisyScore >= 40) messageCategory = 'neutral';
  else if (noisyScore >= 20) messageCategory = 'negative';
  else messageCategory = 'veryNegative';

  const messages = COUPLE_MESSAGES[messageCategory];
  const template = messages[Math.floor(Math.random() * messages.length)];

  // Replace placeholders with actual names
  return template
    .replace(/{person1}/g, randomCouple.person1.name)
    .replace(/{person2}/g, randomCouple.person2.name);
};