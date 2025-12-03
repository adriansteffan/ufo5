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


const generateCoreTraits = (): CoreTraits => {
  // Generate traits using uniform distribution
  const uniformRandom = () => Math.floor(Math.random() * 11);

  return {
    openness: uniformRandom(),
    sportiness: uniformRandom(),
    social: uniformRandom(),
    natural: uniformRandom(),
  };
};

const generateMiscPreferences = (): MiscPreferences => {
 
  const preferences: MiscPreferences = {
    cats: 'neutral',
    dogs: 'neutral',
    smoking: 'neutral',
    drinking: 'neutral',
    travel: 'neutral',
    cooking: 'neutral',
    reading: 'neutral',
    music: 'neutral',
    movies: 'neutral',
    outdoors: 'neutral',
  };

  const prefKeys = Object.keys(preferences) as (keyof MiscPreferences)[];

  // Pick 1-2 random traits to be non-neutral
  const numTraits = Math.random() < 0.5 ? 1 : 2;
  const selectedTraits = prefKeys.sort(() => Math.random() - 0.5).slice(0, numTraits);

  // Set selected traits to either positive or negative (50/50)
  selectedTraits.forEach(trait => {
    preferences[trait] = Math.random() < 0.5 ? 'positive' : 'negative';
  });

  return preferences;
};

const generateDisplayTraits = (
  coreTraits: CoreTraits,
  miscPreferences: MiscPreferences,
): string[] => {
  const traits: string[] = [];

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

  const nonNeutralPrefs = Object.entries(miscPreferences).filter(
    ([_, value]) => value !== 'neutral',
  );

  nonNeutralPrefs.forEach(([prefName, value]) => {
    const prefKey = prefName as keyof typeof MISC_DISPLAY_WORDS;
    const options = MISC_DISPLAY_WORDS[prefKey][value];
    traits.push(options[Math.floor(Math.random() * options.length)]);
  });

  // Sort traits by length for layouting
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


export const judgeCouple = (person1: Person, person2: Person): number => {
  let score = 0;

  // 1. Core traits compatibility - each trait can give 0-25 points (max 100 total)
  const traitKeys: (keyof CoreTraits)[] = ['openness', 'sportiness', 'social', 'natural'];

  traitKeys.forEach(trait => {
    const diff = Math.abs(person1.coreTraits[trait] - person2.coreTraits[trait]);

    let traitScore: number;
    if (diff === 0 || diff === 1) {
      traitScore = 25;
    } else if (diff === 2) {
      traitScore = 18;
    } else if (diff === 3) {
      traitScore = 12;
    } else if (diff === 4) {
      traitScore = 7;
    } else if (diff === 5) {
      traitScore = 3;
    } else if (diff === 6) {
      traitScore = 1;
    } else {
      traitScore = 0;
    }

    score += traitScore;
  });

  // 2. Misc preferences - +20 for same sign, -20 for opposite sign
  const prefKeys: (keyof MiscPreferences)[] = Object.keys(person1.miscPreferences) as (keyof MiscPreferences)[];

  prefKeys.forEach(pref => {
    const pref1 = person1.miscPreferences[pref];
    const pref2 = person2.miscPreferences[pref];

    // Only apply bonus/penalty if both have non-neutral preferences
    if (pref1 !== 'neutral' && pref2 !== 'neutral') {
      if (pref1 === pref2) {
        score += 20; // Same preference
      } else {
        score -= 20; // Conflicting preferences
      }
    }
  });

  // 3. Clamp final score between 0 and 100
  score = Math.round(Math.max(0, Math.min(100, score)));

  // 4. Check mutual attraction and apply penalty after clamping
  const person1AttractedTo2 = person1.lookingFor === person2.gender || person1.lookingFor === 'both';
  const person2AttractedTo1 = person2.lookingFor === person1.gender || person2.lookingFor === 'both';
  const hasMutualAttraction = person1AttractedTo2 && person2AttractedTo1;

  if (!hasMutualAttraction) {
    score -= 100;
  }

  return score;
};

export const areRomanticallyCompatible = (person1: Person, person2: Person): boolean => {
  const person1AttractedTo2 = person1.lookingFor === person2.gender || person1.lookingFor === 'both';
  const person2AttractedTo1 = person2.lookingFor === person1.gender || person2.lookingFor === 'both';
  return person1AttractedTo2 && person2AttractedTo1;
};

export const generateNewsMessage = (couples: { person1: Person; person2: Person; matchScore: number }[], maxRecentCouples: number = 5): string => {
  if (couples.length === 0) {
    return '';
  }

  const recentCouples = couples.slice(-maxRecentCouples);
  const randomCouple = recentCouples[Math.floor(Math.random() * recentCouples.length)];
  const score = randomCouple.matchScore;

  // Add noise to score for message selection (even good couples have awkward moments, even bad ones have some fun)
  const noisyScore = score + (Math.random() - 0.5) * 40; // +-20 points of noise

  let messageCategory: 'veryPositive' | 'positive' | 'neutral' | 'negative' | 'veryNegative';
  if (noisyScore >= 80) messageCategory = 'veryPositive';
  else if (noisyScore >= 60) messageCategory = 'positive';
  else if (noisyScore >= 40) messageCategory = 'neutral';
  else if (noisyScore >= 20) messageCategory = 'negative';
  else messageCategory = 'veryNegative';

  const messages = COUPLE_MESSAGES[messageCategory];
  const template = messages[Math.floor(Math.random() * messages.length)];

  return template
    .replace(/{person1}/g, randomCouple.person1.name)
    .replace(/{person2}/g, randomCouple.person2.name);
};