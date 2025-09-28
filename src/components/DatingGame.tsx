import React, { useEffect, useRef, useState, useMemo } from 'react';
import { BaseComponentProps, now } from '@adriansteffan/reactive';
import { motion, AnimatePresence } from 'motion/react';
import { CgSearch } from 'react-icons/cg';
import { HelpModal } from './HelpModal';
import { Timer } from './Timer';
import {
  createPersonGenerator,
  judgeCouple,
  generateNewsMessage,
  type Person,
} from '../utils/datinggamelogic';

const ACTIONS = {
  INITIAL_HAND: 'INITIAL_HAND',
  PLACE_SLOT1: 'PLACE_SLOT1',
  PLACE_SLOT2: 'PLACE_SLOT2',
  REMOVE_SLOT1: 'REMOVE_SLOT1',
  REMOVE_SLOT2: 'REMOVE_SLOT2',
  MATCH: 'MATCH',
  CLEAR_SLOTS: 'CLEAR_SLOTS',
  GENERATE_NEW: 'GENERATE_NEW',
  EXCHANGE_PERSON: 'EXCHANGE_PERSON',
  ADD_TO_HAND: 'ADD_TO_HAND',
  GAME_END: 'GAME_END',
  HELP: 'HELP',
} as const;

interface Couple {
  person1: Person;
  person2: Person;
  matchTime: number;
  matchScore: number;
}

interface ActionLog {
  actionIndex: number;
  action: string;
  involvedPersonIds?: number[];
  timestamp: number;
}

interface MatchRecord {
  matchIndex: number;
  partner1: Person;
  partner2: Person;
  timestamp: number;
  assignedScore: number;
}

type DatingGameData = {
  peopleDatabase: Person[];
  matchDatabase: MatchRecord[];
  actionLog: ActionLog[];
  starttime: number;
};

const MAX_HAND_SIZE = 5;
const MAX_RECENT_COUPLES = 5;
const NEWS_TICKER_ANIMATION_SPEED_MS = 80;

const generateRandomPerson = createPersonGenerator();

const NewsTicker = React.memo(({ couples }: { couples: Couple[] }) => {
  const [displayText, setDisplayText] = useState('');
  const couplesRef = useRef(couples);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentMessageRef = useRef('');
  const phaseRef = useRef<'typing' | 'showing' | 'deleting' | 'idle'>('idle');
  const messageStartTime = useRef(0);

  // Update couples without triggering full re-render - only needed as data source
  useEffect(() => {
    couplesRef.current = couples;
  }, [couples]);

  // Main animation loop
  useEffect(() => {
    if (!intervalRef.current) {
      currentMessageRef.current = generateNewsMessage(couplesRef.current, MAX_RECENT_COUPLES);
      phaseRef.current = 'typing';
      messageStartTime.current = Date.now();

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - messageStartTime.current;

        if (phaseRef.current === 'typing') {
          const targetLength = Math.min(
            Math.floor(elapsed / NEWS_TICKER_ANIMATION_SPEED_MS),
            currentMessageRef.current.length,
          );
          const displayText = currentMessageRef.current.substring(0, targetLength);
          setDisplayText(displayText);

          if (targetLength >= currentMessageRef.current.length) {
            phaseRef.current = 'showing';
            messageStartTime.current = now;
          }
        } else if (phaseRef.current === 'showing') {
          // Show for 10 seconds
          if (elapsed >= 10000) {
            phaseRef.current = 'deleting';
            messageStartTime.current = now;
          }
        } else if (phaseRef.current === 'deleting') {
          const targetLength = Math.max(
            currentMessageRef.current.length - Math.floor(elapsed / NEWS_TICKER_ANIMATION_SPEED_MS),
            0,
          );
          const displayText = currentMessageRef.current.substring(0, targetLength);
          setDisplayText(displayText);

          if (targetLength === 0) {
            currentMessageRef.current = generateNewsMessage(couplesRef.current, MAX_RECENT_COUPLES);
            phaseRef.current = 'typing';
            messageStartTime.current = now;
          }
        }
      }, NEWS_TICKER_ANIMATION_SPEED_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return (
    <motion.div className='w-full mt-8' layout>
      <div className='bg-white border-2 border-black p-3 w-40 h-24 flex items-start overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,1)]'>
        <span className='text-sm font-medium leading-tight'>{displayText}</span>
      </div>
    </motion.div>
  );
});


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
      onDismiss: () => void;
      onEnlarge: () => void;
      onDragEnd: (person: Person, info: any) => void;
      onDrag: (person: Person, info: any) => void;
      roundOver: boolean;
    }
  >(({ person, onDismiss, onEnlarge, onDragEnd, onDrag, roundOver }, ref) => {

    return (
      <motion.div
        ref={ref}
        layout
        initial={roundOver ? false : { opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 35,
          layout: { type: 'spring', stiffness: 400, damping: 30 },
        }}
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
      className={`w-43 h-60 border-2 border-dashed rounded-3xl flex items-center justify-center bg-white ${
        person
          ? 'border-green-400 cursor-pointer'
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
        whileDrag={{ scale: 1.1, zIndex: 1000, rotate: 5, cursor: 'grabbing' }}
        onDrag={(_, info) => onDrag?.(person, info)}
        onDragEnd={(_, info) => onDragEnd?.(person, info)}
        className={`relative ${person.gender === 'female' ? 'bg-gradient-to-br from-pink-100 to-pink-200' : 'bg-gradient-to-br from-blue-100 to-blue-200'} border-2 border-black rounded-2xl ${!disableHover && !roundOver ? 'cursor-grab' : 'cursor-pointer'} select-none ${isInSlot ? 'w-36 h-54' : 'w-48 h-72'}`}
      >
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
        
        {/* Photo container */}
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
              {(person.lookingFor === 'male' || person.lookingFor === 'both') && (
                <div className='w-3 h-3 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border border-dashed border-black'></div>
              )}
              {(person.lookingFor === 'female' || person.lookingFor === 'both') && (
                <div className='w-3 h-3 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 border border-dashed border-black'></div>
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

// Helper function to check if click was on image/enlarge area
// We need these checks sinde stopPropagation is wonky for motion's onTaps
const isEnlargeAreaClick = (e: Event): boolean => {
  const target = e.target as HTMLElement;
  return !!(target.closest('.enlarge-area') || target.closest('img'));
};

export const DatingGame = ({
  next,
  timelimit,
}: {
  timelimit: number;
} & BaseComponentProps) => {
  const slot1Ref = useRef<HTMLDivElement>(null);
  const slot2Ref = useRef<HTMLDivElement>(null);

  const [hand, setHand] = useState<Person[]>([]);
  const [matchSlot1, setMatchSlot1] = useState<Person | null>(null);
  const [matchSlot2, setMatchSlot2] = useState<Person | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [couples, setCouples] = useState<Couple[]>([]);
  const [roundOver, setRoundOver] = useState(false);
  const [enlargedPerson, setEnlargedPerson] = useState<Person | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [data, setData] = useState<DatingGameData>(() => {
    const initialHand = Array.from({ length: MAX_HAND_SIZE }, () => generateRandomPerson());
    return {
      peopleDatabase: [...initialHand],
      matchDatabase: [],
      actionLog: [
        {
          actionIndex: 0,
          action: ACTIONS.INITIAL_HAND,
          involvedPersonIds: initialHand.map((p) => p.id),
          timestamp: now(),
        },
      ],
      starttime: now(),
    };
  });

  // Initialize hand from database on component mount (ensures parity)
  React.useEffect(() => {
    if (hand.length === 0 && data.peopleDatabase.length > 0) {
      setHand(data.peopleDatabase.slice(0, MAX_HAND_SIZE));
    }
  }, [data.peopleDatabase, hand.length]);

  const generateAndAddPerson = () => {
    const person = generateRandomPerson();
    setData((prev) => ({
      ...prev,
      peopleDatabase: [...prev.peopleDatabase, person],
    }));
    return person;
  };

  const pushAction = (action: string, involvedPersonIds: number[] = []) => {
    const actionLog: ActionLog = {
      actionIndex: data.actionLog.length,
      action,
      involvedPersonIds: involvedPersonIds.length > 0 ? involvedPersonIds : undefined,
      timestamp: now(),
    };

    setData((prev) => ({
      ...prev,
      actionLog: [...prev.actionLog, actionLog],
    }));
  };

  const findHoveredSlot = (info: any) => {
    const slots = [
      { ref: slot1Ref, currentSlot: matchSlot1, slotNumber: 1 },
      { ref: slot2Ref, currentSlot: matchSlot2, slotNumber: 2 },
    ];

    for (const { ref, currentSlot, slotNumber } of slots) {
      const element = ref.current;
      if (element && !currentSlot) {
        const rect = element.getBoundingClientRect();
        if (
          info.point.x >= rect.left &&
          info.point.x <= rect.right &&
          info.point.y >= rect.top &&
          info.point.y <= rect.bottom
        ) {
          return slotNumber as 1 | 2;
        }
      }
    }
    return null;
  };

  const handleCardDragEnd = (person: Person, info: any) => {
    setDragOverSlot(null);

    const hoveredSlot = findHoveredSlot(info);
    if (hoveredSlot) {
      const slotConfig = {
        1: { setter: setMatchSlot1, action: ACTIONS.PLACE_SLOT1 },
        2: { setter: setMatchSlot2, action: ACTIONS.PLACE_SLOT2 },
      }[hoveredSlot];

      pushAction(slotConfig.action, [person.id]);
      slotConfig.setter(person);
      setHand((prev) => prev.filter((p) => p.id !== person.id));
    }
  };


  const handleExchangePerson = (personId: number) => {
    if (roundOver) return;

    const newPerson = generateAndAddPerson();

    pushAction(ACTIONS.EXCHANGE_PERSON, [personId, newPerson.id]);

    setHand((prev) => [...prev.filter((p) => p.id !== personId), newPerson]);
  };

  const handleGenerateNew = () => {
    if (roundOver) return;

    const cardsInSlots = (matchSlot1 ? 1 : 0) + (matchSlot2 ? 1 : 0);
    const newHandSize = MAX_HAND_SIZE - cardsInSlots;

    const newHand = Array.from({ length: newHandSize }, () => generateAndAddPerson());

    pushAction(
      ACTIONS.GENERATE_NEW,
      newHand.map((p) => p.id),
    );

    setHand(newHand);
  };

  const handleMatch = () => {
    if (roundOver || !matchSlot1 || !matchSlot2) return;

    const matchScore = judgeCouple(matchSlot1, matchSlot2);
    const matchTime = now();
    const newCouple: Couple = {
      person1: matchSlot1,
      person2: matchSlot2,
      matchTime,
      matchScore,
    };

    const matchRecord: MatchRecord = {
      matchIndex: data.matchDatabase.length,
      partner1: matchSlot1,
      partner2: matchSlot2,
      timestamp: matchTime,
      assignedScore: matchScore,
    };

    setCouples((prev) => [...prev, newCouple]);
    setData((prev) => ({
      ...prev,
      matchDatabase: [...prev.matchDatabase, matchRecord],
    }));

    pushAction(ACTIONS.MATCH, [matchSlot1.id, matchSlot2.id]);

    const newPerson1 = generateAndAddPerson();
    const newPerson2 = generateAndAddPerson();

    pushAction(ACTIONS.ADD_TO_HAND, [newPerson1.id, newPerson2.id]);

    setHand((prev) => {
      const newHand = [...prev, newPerson1, newPerson2];
      return newHand.slice(0, MAX_HAND_SIZE); // just to be sure, should only ever be MAX_HAND_SIZE
    });

    setMatchSlot1(null);
    setMatchSlot2(null);
  };

  const handleClearSlots = () => {
    if (roundOver) return;

    const slots = [
      { person: matchSlot1, setter: setMatchSlot1 },
      { person: matchSlot2, setter: setMatchSlot2 },
    ];

    const returningIds: number[] = [];

    slots.forEach(({ person, setter }) => {
      if (person) {
        returningIds.push(person.id);
        setHand((prev) => [...prev, person]);
        setter(null);
      }
    });

    if (returningIds.length > 0) {
      pushAction(ACTIONS.CLEAR_SLOTS, returningIds);
    }
  };

  const handleNext = () => {
    pushAction(ACTIONS.GAME_END);
    next({ datingData: data });
  };


  const handleSlotTap = useMemo(
    () => (slotNumber: 1 | 2, e: Event) => {
      if (isEnlargeAreaClick(e)) return; // fix due to wonky propagation of onClick for motion.dev onTap

      const slotConfig = {
        1: { person: matchSlot1, setter: setMatchSlot1, action: ACTIONS.REMOVE_SLOT1 },
        2: { person: matchSlot2, setter: setMatchSlot2, action: ACTIONS.REMOVE_SLOT2 },
      }[slotNumber];

      if (slotConfig.person) {
        pushAction(slotConfig.action, [slotConfig.person.id]);
        setHand((prev) => [...prev, slotConfig.person!]);
        slotConfig.setter(null);
      }
    },
    [matchSlot1, matchSlot2],
  );

  return (
    <div className='min-h-screen w-full pt-10 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex flex-col overflow-hidden'>
      {/* Upper Section - Timer, Matching Area, and Recent Matches */}
      <div className='p-2 flex mt-8'>
        {/* Left Side - Timer */}
        <div className='w-56 flex flex-col items-center'>
          <Timer timelimit={timelimit || 300} roundOver={roundOver} onEnd={() => setRoundOver(true)} />
          <ControlButton
            onClick={() => {
              pushAction(ACTIONS.HELP);
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
                onTap={(e) => handleSlotTap(1, e)}
              />

              <div className='text-4xl'>💕</div>

              <DropZone
                ref={slot2Ref}
                person={matchSlot2}
                isHighlighted={dragOverSlot === 2}
                onEnlarge={setEnlargedPerson}
                onTap={(e) => handleSlotTap(2, e)}
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
                .slice(-MAX_RECENT_COUPLES)
                .reverse()
                .map((couple) => (
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

          {!roundOver && couples.length > 0 && <NewsTicker couples={couples} />}
        </div>
      </div>

      {/* Bottom Section - Hand */}
      <div className='flex mt-5 justify-center'>
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
                onDismiss={() => handleExchangePerson(person.id)}
                onEnlarge={() => setEnlargedPerson(person)}
                onDragEnd={handleCardDragEnd}
                onDrag={(_, info) => setDragOverSlot(findHoveredSlot(info))}
                roundOver={roundOver}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)}>
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
      </HelpModal>

      {enlargedPerson && (
        <EnlargedCardModal person={enlargedPerson} onClose={() => setEnlargedPerson(null)} />
      )}
    </div>
  );
};
