import React, { useEffect, useRef, useState } from 'react';
import { BaseComponentProps, now } from '@adriansteffan/reactive';
import { motion, AnimatePresence } from 'motion/react';
import { CgSearch } from 'react-icons/cg';
import { MALE_NAMES, FEMALE_NAMES, TRAIT_DISPLAY_WORDS, MISC_DISPLAY_WORDS } from '../utils/datinggamelist';

/**
 * TODOs:
 *
 * general refactoring
 *
 * drop animation is buggy
 *
 * data piping - have a dedicated character database that gets saved
 *
 * judge mechanic: produce emojis from recent matches ()
 *
 */

interface Person {
  id: number; // autoincrementing from 0, so safe for ids unless we play this game for millions of years
  name: string;
  image: string;
  gender: 'male' | 'female';
  lookingFor: 'male' | 'female' | 'both';
  coreTraits: CoreTraits;
  miscPreferences: MiscPreferences;
  displayTraits: string[]; // Generated from core traits and preferences
}

interface Couple {
  person1: Person;
  person2: Person;
  matchTime: number;
}

interface ActionData {
  actionIndex: number;
  action: string;
  personId?: number;
  timestamp: number;
}

interface MatchData {
  matchIndex: number;
  person1: Person | null;
  person2: Person | null;
  matchTime: number | null;
  actions: ActionData[];
}

type DatingGameData = {
  roundIndex: number;
  starttime: number;
  matches: MatchData[];
}[];

const MAX_HAND_SIZE = 5;


// Core personality scales (0-10, 5 is average)
interface CoreTraits {
  openness: number; // 0=traditional, 10=very open to new experiences
  sportiness: number; // 0=sedentary, 10=very athletic
  social: number; // 0=introverted, 10=very social
  natural: number; // 0=glamorous/makeup, 10=natural/low-maintenance
}

// Binary preferences (neutral, positive, or negative)
type PreferenceValue = 'neutral' | 'positive' | 'negative';

interface MiscPreferences {
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

const createPersonGenerator = () => {
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

const generateRandomPerson = createPersonGenerator();

const Timer = React.memo(({ timeLeft }: { timeLeft: number }) => (
  <div className='p-2 pt-4 flex justify-center'>
    <div className='text-2xl font-bold text-center'>
      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
    </div>
  </div>
));

const EnlargedCardModal = React.memo(
  ({ person, onClose }: { person: Person; onClose: () => void }) => {
    return (
      <div
        className='fixed inset-0 bg-black/70 flex items-center justify-center z-50'
        onClick={onClose}
      >
        <motion.div
          className='relative transform scale-[1.4]'
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1.4 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <PersonCard
            person={person}
            isInSlot={false}
            disableHover={true}
            disableDrag={true}
            isEnlarged={true}
            onClick={onClose}
          />
        </motion.div>
      </div>
    );
  },
);

const ControlButton = React.memo(
  ({
    children,
    onClick,
    disabled = false,
    className = '',
  }: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer bg-white w-32 border-2 border-black font-bold text-black rounded-full shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed select-none ${className}`}
    >
      {children}
    </button>
  ),
);

const AnimatedPersonCard = React.memo(
  React.forwardRef<
    HTMLDivElement,
    {
      person: Person;
      isNew: boolean;
      onDismiss: () => void;
      onEnlarge: () => void;
      onDragEnd: (person: Person, info: any) => void;
      onDrag: (person: Person, info: any) => void;
      roundOver: boolean;
    }
  >(({ person, isNew, onDismiss, onEnlarge, onDragEnd, onDrag, roundOver }, ref) => {
    const [hasAnimated, setHasAnimated] = React.useState(!isNew);

    return (
      <motion.div
        ref={ref}
        layout
        initial={hasAnimated ? false : { opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 35,
          layout: { type: 'spring', stiffness: 400, damping: 30 },
        }}
        onAnimationComplete={() => setHasAnimated(true)}
      >
        <PersonCard
          person={person}
          onDismiss={onDismiss}
          onEnlarge={onEnlarge}
          onDragEnd={onDragEnd}
          onDrag={onDrag}
          roundOver={roundOver}
        />
      </motion.div>
    );
  }),
);

export const DropZone = React.memo(
  React.forwardRef<
    HTMLDivElement,
    {
      person: Person | null;
      isHighlighted: boolean;
      onTap: (e: Event) => void;
      onEnlarge?: (person: Person) => void;
    }
  >(({ person, isHighlighted, onTap, onEnlarge }, ref) => (
    <motion.div
      ref={ref}
      className={`w-43 h-60 border-2 border-dashed rounded-3xl flex items-center justify-center cursor-pointer bg-white ${
        person
          ? 'border-green-400'
          : isHighlighted
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-400'
      }`}
      onTap={onTap}
    >
      {person ? (
        <PersonCard
          person={person}
          isInSlot={true}
          disableHover={true}
          onEnlarge={onEnlarge ? () => onEnlarge(person) : undefined}
        />
      ) : (
        <div className='text-center px-10 leading-2'>
          <span className='text-gray-300 text-sm'>Place single here!</span>
        </div>
      )}
    </motion.div>
  )),
);

const PersonCard = React.memo(
  ({
    person,
    isInSlot = false,
    disableHover = false,
    disableDrag = false,
    isEnlarged = false,
    onClick,
    onDismiss,
    onEnlarge,
    isDragging,
    onDragEnd,
    onDrag,
    roundOver,
  }: {
    person: Person;
    isInSlot?: boolean;
    disableHover?: boolean;
    disableDrag?: boolean;
    isEnlarged?: boolean;
    onClick?: () => void;
    onDismiss?: () => void;
    onEnlarge?: () => void;
    isDragging?: boolean;
    onDragEnd?: (person: Person, info: any) => void;
    onDrag?: (person: Person, info: any) => void;
    roundOver?: boolean;
  }) => {
    const iconVariants = {
      initial: { opacity: 0, scale: 0.8 },
      hover: { opacity: 1, scale: 1 },
    };

    return (
      <motion.div
        onTap={onClick}
        drag={!disableDrag && !isInSlot && !roundOver}
        dragSnapToOrigin={true}
        dragElastic={0.1}
        whileHover={!disableHover && !roundOver ? { scale: 1.05 } : {}}
        whileDrag={{ scale: 1.1, zIndex: 1000, rotate: 5 }}
        onDrag={(_, info) => onDrag?.(person, info)}
        onDragEnd={(_, info) => onDragEnd?.(person, info)}
        className={`relative ${person.gender === 'female' ? 'bg-gradient-to-br from-pink-100 to-pink-200' : 'bg-gradient-to-br from-blue-100 to-blue-200'} border-2 border-black rounded-2xl ${!disableHover && !roundOver ? 'cursor-grab' : 'cursor-pointer'} select-none ${isInSlot ? 'w-36 h-54' : 'w-48 h-72'}`}
        style={{
          zIndex: isDragging ? 1000 : 1,
          pointerEvents: 'auto',
          cursor: isDragging ? 'grabbing' : undefined,
        }}
      >
        {/* Exchange button for hand cards */}
        {!isInSlot && onDismiss && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className='absolute top-2 left-2 w-6 h-6 bg-red-500 border-2 border-black rounded-full flex items-center justify-center text-white font-bold text-xs hover:bg-red-600 cursor-pointer z-20'
          >
            ✕
          </button>
        )}

        <motion.div
          className={`relative mt-3 mb-2 enlarge-area ${isInSlot ? 'mx-2' : 'mx-3'}`}
          initial='initial'
          whileHover='hover'
          onTap={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onEnlarge) onEnlarge();
          }}
        >
          {onEnlarge && (
            <motion.div
              variants={iconVariants}
              transition={{ duration: 0.2 }}
              className='absolute top-1 right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs cursor-pointer z-10'
            >
              <CgSearch className='pr-[2px]' size={16} />
            </motion.div>
          )}

          {/* Photo placeholder */}
          <div
            className={`cursor-pointer bg-white rounded-2xl border-2 border-black overflow-hidden ${isInSlot ? 'h-16' : 'h-20'}`}
          >
            <motion.img
              src={person.image}
              alt={person.name}
              className='w-full h-full object-contain'
              draggable={false}
            />
          </div>
        </motion.div>

        {/* Name */}
        <div className='px-3 mb-2'>
          <h3 className='font-bold text-lg leading-tight'>{person.name}</h3>
          <div className='flex items-center gap-2 mt-1'>
            <span className='text-xs text-gray-600'>attracted to:</span>
            <div className='flex gap-1'>
              {person.lookingFor === 'male' && (
                <div className='w-3 h-3 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border border-dashed border-black'></div>
              )}
              {person.lookingFor === 'female' && (
                <div className='w-3 h-3 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 border border-dashed border-black'></div>
              )}
              {person.lookingFor === 'both' && (
                <>
                  <div className='w-3 h-3 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border border-dashed border-black'></div>
                  <div className='w-3 h-3 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 border border-dashed border-black'></div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Traits */}
        <div className='px-3 pb-3'>
          <div className='flex flex-wrap gap-1'>
            {isEnlarged
              ? // Enlarged view: show all traits with smaller font
                person.displayTraits.map((trait, index) => (
                  <span
                    key={index}
                    className='bg-white px-1 py-0.5 rounded-full text-xs font-medium border border-black whitespace-nowrap overflow-hidden text-ellipsis max-w-full'
                    style={{ fontSize: '10px' }}
                    title={trait}
                  >
                    {trait}
                  </span>
                ))
              : // Normal view: show limited traits with overflow indicator
                (() => {
                  const maxTraits = isInSlot ? 2 : 5;
                  const visibleTraits = person.displayTraits.slice(0, maxTraits);
                  const hiddenCount = person.displayTraits.length - maxTraits;

                  return (
                    <>
                      {visibleTraits.map((trait, index) => (
                        <span
                          key={index}
                          className='bg-white px-1.5 py-0.5 rounded-full text-xs font-medium border border-black whitespace-nowrap overflow-hidden text-ellipsis max-w-full'
                          title={trait}
                        >
                          {trait}
                        </span>
                      ))}
                      {hiddenCount > 0 && (
                        <span className='bg-gray-100 px-1.5 py-0.5 rounded-full text-xs font-medium border border-black text-gray-600'>
                          +{hiddenCount}
                        </span>
                      )}
                    </>
                  );
                })()}
          </div>
        </div>
      </motion.div>
    );
  },
);

interface DatingGameProps extends BaseComponentProps {
  timelimit: number;
}

// Helper function to check if click was on image/enlarge area
// We need these checks sinde stopPropagation is wonky for motion's onTaps
const isEnlargeAreaClick = (e: Event): boolean => {
  const target = e.target as HTMLElement;
  return !!(target.closest('.enlarge-area') || target.closest('img'));
};

export const DatingGame = ({ next, timelimit }: DatingGameProps) => {
  const slot1Ref = useRef<HTMLDivElement>(null);
  const slot2Ref = useRef<HTMLDivElement>(null);

  const [hand, setHand] = useState<Person[]>(() =>
    Array.from({ length: MAX_HAND_SIZE }, () => generateRandomPerson()),
  );
  const [newCardIds, setNewCardIds] = useState<Set<number>>(new Set());
  const [matchSlot1, setMatchSlot1] = useState<Person | null>(null);
  const [matchSlot2, setMatchSlot2] = useState<Person | null>(null);
  const [couples, setCouples] = useState<Couple[]>([]);
  const [timeLeft, setTimeLeft] = useState(timelimit || 300);
  const [roundOver, setRoundOver] = useState(false);
  const [currentActionList, setCurrentActionList] = useState<ActionData[]>([]);
  const [enlargedPerson, setEnlargedPerson] = useState<Person | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [data, setData] = useState<DatingGameData>(() => [
    {
      roundIndex: 0,
      starttime: now(),
      matches: [] as MatchData[],
    },
  ]);

  const pushAction = (action: string, personId?: number) => {
    const actionData: ActionData = {
      actionIndex: currentActionList.length,
      action,
      personId,
      timestamp: now(),
    };
    setCurrentActionList((prev) => [...prev, actionData]);
  };

  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const handleCardDragEnd = (person: Person, info: any) => {
    setDragOverSlot(null);

    const slot1Element = slot1Ref.current;
    const slot2Element = slot2Ref.current;

    if (slot1Element) {
      const rect1 = slot1Element.getBoundingClientRect();
      if (
        info.point.x >= rect1.left &&
        info.point.x <= rect1.right &&
        info.point.y >= rect1.top &&
        info.point.y <= rect1.bottom &&
        !matchSlot1
      ) {
        pushAction('PLACE_SLOT1', person.id);
        setMatchSlot1(person);
        // Remove from hand immediately without animation
        setHand((prev) => prev.filter((p) => p.id !== person.id));
        return;
      }
    }

    if (slot2Element) {
      const rect2 = slot2Element.getBoundingClientRect();
      if (
        info.point.x >= rect2.left &&
        info.point.x <= rect2.right &&
        info.point.y >= rect2.top &&
        info.point.y <= rect2.bottom &&
        !matchSlot2
      ) {
        pushAction('PLACE_SLOT2', person.id);
        setMatchSlot2(person);
        // Remove from hand immediately without animation
        setHand((prev) => prev.filter((p) => p.id !== person.id));
        return;
      }
    }
  };

  const handleCardDrag = (person: Person, info: any) => {
    // Check which slot we're hovering over for visual feedback
    const slot1Element = slot1Ref.current;
    const slot2Element = slot2Ref.current;

    let newDragOverSlot: 1 | 2 | null = null;

    if (slot1Element && !matchSlot1) {
      const rect1 = slot1Element.getBoundingClientRect();
      if (
        info.point.x >= rect1.left &&
        info.point.x <= rect1.right &&
        info.point.y >= rect1.top &&
        info.point.y <= rect1.bottom
      ) {
        newDragOverSlot = 1;
      }
    }

    if (slot2Element && !matchSlot2) {
      const rect2 = slot2Element.getBoundingClientRect();
      if (
        info.point.x >= rect2.left &&
        info.point.x <= rect2.right &&
        info.point.y >= rect2.top &&
        info.point.y <= rect2.bottom
      ) {
        newDragOverSlot = 2;
      }
    }

    setDragOverSlot(newDragOverSlot);
  };

  const handleExchangePerson = (personId: number) => {
    if (roundOver) return;
    pushAction('EXCHANGE', personId);
    const newPerson = generateRandomPerson();
    // Mark new person for animation
    setNewCardIds((prev) => new Set([...prev, newPerson.id]));
    // Remove old card and add new card to the right end
    setHand((prev) => [...prev.filter((p) => p.id !== personId), newPerson]);
    // Clear new card status after animation
    setTimeout(() => {
      setNewCardIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(newPerson.id);
        return newSet;
      });
    }, 500);
  };

  const handleGenerateNew = () => {
    if (roundOver) return;
    pushAction('GENERATE_NEW');

    // Calculate how many cards are in the matching slots
    const cardsInSlots = (matchSlot1 ? 1 : 0) + (matchSlot2 ? 1 : 0);
    const newHandSize = MAX_HAND_SIZE - cardsInSlots;

    // Clear any ongoing new card animations first
    setNewCardIds(new Set());

    // First clear current hand - use immediate replacement instead of clearing
    const newHand = Array.from({ length: newHandSize }, () => generateRandomPerson());
    setNewCardIds(new Set(newHand.map((p) => p.id)));
    setHand(newHand);

    // Clear new card status after animation
    setTimeout(() => {
      setNewCardIds(new Set());
    }, 500);
  };

  const handleMatch = () => {
    if (roundOver || !matchSlot1 || !matchSlot2) return;

    pushAction('MATCH');
    const newCouple: Couple = {
      person1: matchSlot1,
      person2: matchSlot2,
      matchTime: now(),
    };

    setCouples((prev) => [...prev, newCouple]);

    // Update data
    setData((prev) => {
      const updatedData = [...prev];
      const currentRound = prev[prev.length - 1];
      currentRound.matches.push({
        matchIndex: currentRound.matches.length,
        person1: matchSlot1,
        person2: matchSlot2,
        matchTime: now(),
        actions: currentActionList,
      });
      return updatedData;
    });

    const newPerson1 = generateRandomPerson();
    const newPerson2 = generateRandomPerson();
    setNewCardIds((prev) => new Set([...prev, newPerson1.id, newPerson2.id]));
    setHand((prev) => {
      const newHand = [...prev, newPerson1, newPerson2];
      return newHand.slice(0, MAX_HAND_SIZE); // Limit to max hand size
    });

    // Clear new card status after animation
    setTimeout(() => {
      setNewCardIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(newPerson1.id);
        newSet.delete(newPerson2.id);
        return newSet;
      });
    }, 500);

    setMatchSlot1(null);
    setMatchSlot2(null);
    setCurrentActionList([]);
  };

  const handleClearSlots = () => {
    if (roundOver) return;
    pushAction('CLEAR_SLOTS');

    if (matchSlot1) {
      setHand((prev) => [...prev, matchSlot1]);
      setMatchSlot1(null);
    }
    if (matchSlot2) {
      setHand((prev) => [...prev, matchSlot2]);
      setMatchSlot2(null);
    }
  };

  const handleNext = () => {
    const finalData = [...data];
    const currentRound = finalData[finalData.length - 1];
    currentRound.matches.push({
      matchIndex: currentRound.matches.length,
      person1: null,
      person2: null,
      matchTime: null,
      actions: currentActionList,
    });

    next({ datingData: finalData, completed: true });
  };

  // Timer countdown
  useEffect(() => {
    if (roundOver || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setRoundOver(true);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [roundOver, timeLeft]);

  return (
    <div className='min-h-screen w-full pt-10 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex flex-col overflow-hidden'>
      {/* Main Section - Timer, Matching Area, and Recent Matches */}
      <div className='p-2 flex'>
        {/* Left Side - Timer */}
        <div className='w-56 flex flex-col items-center'>
          <Timer timeLeft={timeLeft} />
          <ControlButton
            onClick={() => {
              pushAction('HELP');
              setShowHelp(true);
            }}
            className='px-6 py-3 text-sm mt-4'
          >
            HELP
          </ControlButton>
        </div>

        {/* Center - Matching Area */}
        <div className='flex-1 flex mt-5 mb-10 flex-col items-center justify-center'>
          <div className='space-y-3 flex flex-col items-center'>
            {/* Matching Slots */}
            <div className='flex gap-6 items-center'>
              <DropZone
                ref={slot1Ref}
                person={matchSlot1}
                isHighlighted={dragOverSlot === 1}
                onEnlarge={setEnlargedPerson}
                onTap={(e) => {
                  if (isEnlargeAreaClick(e)) return;

                  if (matchSlot1) {
                    pushAction('REMOVE_SLOT1', matchSlot1.id);
                    setHand((prev) => [...prev, matchSlot1]);
                    setMatchSlot1(null);
                  }
                }}
              />

              <div className='text-4xl'>💕</div>

              <DropZone
                ref={slot2Ref}
                person={matchSlot2}
                isHighlighted={dragOverSlot === 2}
                onEnlarge={setEnlargedPerson}
                onTap={(e) => {
                  if (isEnlargeAreaClick(e)) return;

                  if (matchSlot2) {
                    pushAction('REMOVE_SLOT2', matchSlot2.id);
                    setHand((prev) => [...prev, matchSlot2]);
                    setMatchSlot2(null);
                  }
                }}
              />
            </div>

            {/* Control Buttons */}
            {!roundOver && (
              <div className='flex gap-4 mt-5'>
                <ControlButton onClick={handleClearSlots} className='px-4 py-3 text-lg'>
                  CLEAR
                </ControlButton>
                <ControlButton
                  onClick={handleMatch}
                  disabled={!matchSlot1 || !matchSlot2}
                  className='px-8 py-3 text-lg flex items-center justify-center'
                >
                  MATCH!
                </ControlButton>
                <ControlButton onClick={handleGenerateNew} className='px-4 py-3 text-base'>
                  NEW HAND
                </ControlButton>
              </div>
            )}

            {roundOver && (
              <ControlButton
                onClick={handleNext}
                className='px-6 mt-5 py-3 text-lg flex items-center justify-center'
              >
                END
              </ControlButton>
            )}
          </div>
        </div>

        {/* Right Side - Recent Matches */}
        <div className='w-56 px-8 p-2 flex flex-col items-center gap-2'>
          <div className='text-lg font-bold'>Recent Matches</div>
          <div className='flex flex-col gap-2 max-h-96 overflow-visible'>
            <AnimatePresence mode='popLayout'>
              {couples
                .slice(-5)
                .reverse()
                .map((couple, index) => (
                  <motion.div
                    key={couple.matchTime}
                    className='flex items-center gap-2'
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    layout
                  >
                    <div className='w-8 h-8 rounded-lg overflow-hidden border border-black'>
                      <img
                        src={couple.person1.image}
                        alt={couple.person1.name}
                        className='w-full h-full object-contain'
                        draggable={false}
                      />
                    </div>
                    <span className='text-sm'>💕</span>
                    <div className='w-8 h-8 rounded-lg overflow-hidden border border-black'>
                      <img
                        src={couple.person2.image}
                        alt={couple.person2.name}
                        className='w-full h-full object-contain'
                        draggable={false}
                      />
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom Section - Hand */}
      <div className='flex justify-center'>
        {/* Hand - Centered */}
        <motion.div
          className='flex gap-3 justify-center'
          layout
          transition={{ type: 'spring', stiffness: 250, damping: 50 }}
        >
          <AnimatePresence>
            {hand.map((person) => (
              <AnimatedPersonCard
                key={person.id}
                person={person}
                isNew={newCardIds.has(person.id)}
                onDismiss={() => handleExchangePerson(person.id)}
                onEnlarge={() => setEnlargedPerson(person)}
                onDragEnd={handleCardDragEnd}
                onDrag={handleCardDrag}
                roundOver={roundOver}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            className='fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              className='bg-white border-4 border-black rounded-lg shadow-[5px_5px_0px_rgba(0,0,0,1)] p-6 max-w-md mx-4'
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-bold'>How to Play</h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className='w-8 h-8 rounded-full bg-red-300 border-2 border-black flex items-center justify-center font-bold text-lg hover:bg-red-400 leading-none'
                >
                  ×
                </button>
              </div>

              <div className='space-y-4'>
                <div>
                  <h3 className='font-bold mb-2'>Goal:</h3>
                  <p className='text-sm'>
                    Match compatible people by dragging them into the matching slots and creating
                    couples before time runs out!
                  </p>
                </div>

                <div>
                  <h3 className='font-bold mb-2'>Controls:</h3>
                  <ul className='text-sm space-y-1 list-disc list-outside pl-4'>
                    <li>Drag people from your hand to the matching slots</li>
                    <li>Click "MATCH" to create a blind date from the two slots</li>
                    <li>Click the red ✕ to send a person home an get a new one</li>
                    <li>Click the profile picture to view a person in detail</li>
                    <li>Use "NEW HAND" to replace your whole hand people</li>
                    <li>
                      Clicking on cards in the slots will return them to your hand, "CLEAR" will
                      return both
                    </li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className='w-full cursor-pointer bg-white px-4 py-2 border-2 border-black font-bold text-black rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-150 mt-6'
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {enlargedPerson && (
        <EnlargedCardModal person={enlargedPerson} onClose={() => setEnlargedPerson(null)} />
      )}
    </div>
  );
};
