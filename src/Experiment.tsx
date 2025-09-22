/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ExperimentRunner,
  ExperimentConfig,
  getParam,
  registerArrayExtensions,
  subsetExperimentByParam,
  TrialData,
} from '@adriansteffan/reactive';

import {
  TaskRanking,
  TaskRating,
  WordGame,
  NumberGame,
  DatingGame,
  SportsGame,
  ElementsGame,
  WheelOfFortune,
} from './components';

registerArrayExtensions();

const config: ExperimentConfig = { showProgressBar: false };

const TASK_TIME_LIMIT = getParam(
  'task_time_limit',
  240,
  'number',
  'Time limit for timed tasks in seconds',
);

const TASKS = ['WordGame', 'NumberGame', 'DatingGame', 'SportsGame']; // 'ElementsGame'
const TASK_NAMES = {
  WordGame: 'Words',
  NumberGame: 'Numbers',
  DatingGame: 'Matchmaker',
  SportsGame: 'FootballSim',
};

const TASK_DESCRIPTIONS = {
  WordGame:
    'Create words using sets of 7 letters. Test your vocabulary by finding as many valid words as possible.',
  NumberGame:
    'Test your numerical skills by finding different arithmetic operations to reach a set number.',
  DatingGame:
    'Play matchmaker by helping virtual characters find their perfect partners. Make decisions about compatibility and relationship dynamics.',
  SportsGame:
    'Manage footballs team through strategic decisions. Choose a lineup and formation and have the teams play each other.',
};

const groups = ['choice', 'anti-choice', 'random'];
const PARTICIPANT_GROUP =
  getParam(
    'group',
    '',
    'string',
    'Participant group (default picks one group randomly): choice, anti-choice, random',
  ) || groups.sample()[0];

const FORCE_TASK = getParam(
  'task',
  '',
  'string',
  'Force specific task: word, number, dating, sports, elements',
);
const FORCED_TASK = FORCE_TASK
  ? FORCE_TASK.charAt(0).toUpperCase() + FORCE_TASK.slice(1).toLowerCase() + 'Game'
  : '';

const USE_SIMPLIFIED_RANKING = getParam(
  'simplified_ranking',
  false,
  'boolean',
  'Use simplified drag-and-drop ranking instead of 1-10 rating system',
);

// TODO: create a decent flattener
const flatteners = {
  TaskRanking: (item: TrialData) => {
    const { index, trialNumber, start, end, duration, type, name } = item;
    const { rankings } = item.responseData;

    return [
      {
        trialIndex: index,
        trialNumber,
        trialStart: start,
        trialEnd: end,
        trialDuration: duration,
        trialType: type,
        trialName: name,
        rankings: rankings ? JSON.stringify(rankings) : '',
      },
    ];
  },
};

const experiment = subsetExperimentByParam([
  {
    name: 'CheckDevice',
    type: 'CheckDevice',
    props: {
      check: (deviceInfo: any) => {
        return !deviceInfo.isMobile;
      },
    },
  },
  {
    name: 'introduction',
    type: 'Text',
    props: {
      buttonText: "Let's Begin",
      animate: true,
      containerClass: '',
      content: (
        <div className='bg-white p-8 rounded-lg'>
          <h1>
            <strong className='font-atkinson'>Welcome to our study!</strong>
          </h1>
          Thank you for participating in our research. In this study, we examine how people's
          engagement differs between various little games we have developed. Over the next 15
          minutes, you will answer a handful of survey questions and play one of these games
          yourself. Press the button below to continue to the participat information and guidelines.
          <br />
        </div>
      ),
    },
  },

  {
    name: 'consenttext',
    type: 'Text',
    props: {
      buttonText: 'Accept',
      animate: true,

      content: (
        <div>
          <h1>Participant Information</h1>
          <p>
            Enclosed you will find information about the research project, the conditions of
            participation and the handling of the collected data. Please read everything carefully.
            If you agree and want to participate in the experiment, please confirm by giving your
            consent below.
          </p>
          <p>
            <br />
            No special stress or harm is expected as a result of participating in this research
            project. Participation in the study is remunerated at the rate specified on Prolific.
            Even if you decide to withdraw from the study, you are still entitled to receive the
            corresponding remuneration for the time spent up to that point, provided that this can
            be clearly demonstrated (see section Voluntary participation).
          </p>
          <p>
            <strong>Voluntary participation:</strong> <br />
            Your participation in this research project is voluntary. You can withdraw your consent
            to participate at any time and without giving reasons, without receiving any
            disadvantages. Even if you decide to withdraw from the study, you are still entitled to
            receive the corresponding remuneration for the time spent up to that point, provided
            that this can be clearly demonstrated.
          </p>
          <p>
            <strong>Participation requirements:</strong> <br />
            The only participation requirement is a minimum age of 18 years. Those who have already
            participated in this study are excluded from participation.
          </p>
          <p>
            <strong>Data protection and anonymity:</strong> <br />
            Apart from age and TODO, no personal data are collected as part of this study. It is
            therefore not possible for us to personally identify you. As a user of Prolific, you
            have entered into a separate{' '}
            <a target='_blank' href='https://participant-help.prolific.com/en/article/498241'>
              personal data processing agreement with Prolific
            </a>
            . This agreement is independent of your consent related to this study and the personal
            data collected by Prolific will not be made available to the research team of this study
            at any point.
          </p>
          <p>
            <strong>Use of data:</strong> <br />
            The results of this study may be published for teaching and research purposes (e.g.
            theses, scientific publications or conference papers). These results will be presented
            in anonymized form, i.e. without the data being able to be connected to a specific
            person. The fully anonymized data of this study will be made available as "open data" in
            an internet-based repository, if applicable. Thus, this study follows the
            recommendations of the German Research Foundation (DFG) for quality assurance with
            regard to verifiability and reproducibility of scientific results, as well as optimal
            data re-use.
          </p>
          <p>
            <strong>Legal basis and revocation:</strong> <br />
            The legal basis for processing the aforementioned personal data is the consent pursuant
            to Art. 6 (1) letter a EU-DSGVO at the end of this document. You have the right to
            revoke the data protection consent at any time. The revocation does not affect the
            lawfulness of the processing carried out on the basis of the consent until the
            revocation. You can request an obligatory deletion of your data at any time - as long as
            you can provide sufficient information that allows us to identify your data. To do so,
            please contact the research project managers. You will not suffer any disadvantages as a
            result of the revocation.
          </p>
          <p>
            <strong>Research project managers:</strong> <br />
            If you have any questions about the research project or if you want to exercise your
            right to withdraw your consent, please contact the research project managers:
          </p>
          <p>
            Prof. Dr. Christopher Donkin
            <br />
          </p>
          <p>
            Ludwig-Maximilians-Universität München
            <br />
            Department Psychologie
            <br />
            Lehrstuhl für Computational Modeling in Psychology
            <br />
            Akademiestr. 7<br />
            80799 München
            <br />
          </p>
          <p>chair@psy.lmu.de</p>
          <p>
            <strong>Further contact addresses:</strong> <br />
            You can also contact the data protection officer of the research institution or the
            competent supervisory authority if you have any data protection concerns in connection
            with this study and/or wish to lodge a complaint.
          </p>
          <p>
            {' '}
            <br />
            Ludwig-Maximilians-Universität München <br />
            Behördlicher Datenschutzbeauftragter <br />
            Geschwister-Scholl-Platz 1 <br />
            D-80539 München <br />
            Bayerisches Landesamt für Datenschutzaufsicht <br />
            Promenade 27 <br />
            91522 Ansbach <br />
            <br />
            <br />
            <strong>Declaration of consent.</strong> I hereby certify that I have read and
            understood the participant information described above and that I agree to the
            conditions stated. I agree in accordance with Art. 6 (1) letter a EU-DSGVO. I have been
            informed about my right to revoke my data protection consent.
            <br />
            <br />
            <strong>Declaration of fulfillment inclusion criteria.</strong> I hereby confirm that I
            meet the above conditions for participation (18+ years old, first-time participation).
          </p>
        </div>
      ),
    },
  },
  {
    name: 'InitialQuestionnaire',
    type: 'Quest',
    props: {
      surveyJson: {
        pages: [
          {
            name: 'demographics',
            title: "Let's start with some questions!",
            elements: [
              {
                type: 'rating',
                name: 'computer_experience',
                title: 'How experienced are you with using computers?',
                // based on bug: https://surveyjs.answerdesk.io/ticket/details/t17582/rating-scale-is-displayed-as-drop-down-regardless-of-the-available-page-size
                displayMode: window.innerWidth > 768 ? 'buttons' : 'dropdown',
                isRequired: true,
                rateMin: 1,
                rateMax: 6,
                minRateDescription: 'Not experienced',
                maxRateDescription: 'Very experienced',
              },
            ],
          },
        ],
      },
    },
  },

  {
    type: 'IF_BLOCK',
    cond: () => PARTICIPANT_GROUP === 'choice' || PARTICIPANT_GROUP === 'anti-choice',
    timeline: [
      {
        name: 'GameDescriptions',
        type: 'Text',
        props: {
          buttonText: 'Continue',
          containerClass:
            'bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]',
          animate: false,
          content: (
            <div className='bg-white p-8 rounded-lg'>
              <h1 className='text-4xl mb-4'>
                <strong>Meet our Games!</strong>
              </h1>
              <p>
                On this page you will find descriptions of the games we are testing out. Please read
                through each one carefully before proceeding to the next step.
              </p>
              <br/>

              {TASKS.map((task) => (
                <section key={task}>
                  <h3 className='text-xl'>
                    <strong>{TASK_NAMES[task]}</strong>
                  </h3>
                  <p>{TASK_DESCRIPTIONS[task]}</p>
                  <br/>
                </section>
              ))}
            </div>
          ),
        },
      },
      USE_SIMPLIFIED_RANKING
        ? {
            name: 'TaskRanking',
            type: 'TaskRanking',
            props: {
              tasks: TASKS,
              taskNames: TASK_NAMES,
              taskDescriptions: TASK_DESCRIPTIONS,
            },
          }
        : {
            name: 'TaskRating',
            type: 'TaskRating',
            props: {
              tasks: TASKS,
              taskNames: TASK_NAMES,
              taskDescriptions: TASK_DESCRIPTIONS,
            },
          },
    ],
  },

  {
    name: 'TaskSelection',
    type: 'UPDATE_STORE',
    fun: (data: any) => {
      let selectedTask: string | undefined;
      let taskRankings = null;

      if (PARTICIPANT_GROUP === 'choice' || PARTICIPANT_GROUP === 'anti-choice') {
        const trialName = USE_SIMPLIFIED_RANKING ? 'TaskRanking' : 'TaskRating';
        const taskRankingTrial = data.find((trial: any) => trial.name === trialName);
        const rankings = taskRankingTrial?.responseData?.rankings;
        if (rankings) {
          const targetRank = PARTICIPANT_GROUP === 'choice' ? 1 : TASKS.length;
          selectedTask = Object.keys(rankings).find((task) => rankings[task] === targetRank);
          taskRankings = rankings;
        }
      } else {
        // random group
        selectedTask = TASKS.sample()[0];
      }

      return {
        selectedTask: TASKS.includes(FORCED_TASK) ? FORCED_TASK : selectedTask,
        taskRankings,
      };
    },
  },

  {
    name: 'WheelOfFortune',
    type: 'WheelOfFortune',
    props: (_data: any, store: any) => ({
      segments: Object.values(TASK_NAMES),
      segColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7'], // '#96CEB4'
      winningSegment: TASK_NAMES[store.selectedTask],
      size: 250,
      buttonText: 'SPIN!',
    }),
  },

  {
    type: 'IF_BLOCK',
    cond: (_data: any, store: any) => store.selectedTask === 'WordGame',
    timeline: [
      {
        name: 'WordGameInstructions',
        type: 'Text',
        props: {
          buttonText: "Let's Play!",
          containerClass:
            'bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]',
          content: (
            <div className='bg-white p-8 rounded-lg'>
              <h1 className='text-4xl'>
                <strong>{TASK_NAMES['WordGame']}</strong>
              </h1>
              <p>
                Let's play a round of {TASK_NAMES['WordGame']}! Your goal is to create as many valid
                words as possible using the given set of 7 letters. Once you think you are done with
                a given set of letters, you can request a new one. Try to find as many words as you
                can within the time limit of 4 minutes. Good luck!
              </p>
              <p>
                <strong>How to play:</strong>
              </p>
              <ul className='pl-5 mb-4'>
                <li>Click the letter buttons to spell out words</li>
                <li>Press ENTER to submit a word</li>
                <li>Press DELETE to remove the last letter</li>
                <li>Press SHUFFLE to change the order of the letter-buttons</li>
                <li>Press CLEAR to start over with a new word</li>
                <li>Press NEW SET to get a different set of 7 letters</li>
              </ul>
            </div>
          ),
        },
      },
      {
        name: 'WordGameTrial',
        type: 'WordGame',
        props: {
          timelimit: TASK_TIME_LIMIT,
          showCorrectness: false,
        },
      },
    ],
  },

  {
    type: 'IF_BLOCK',
    cond: (_data: any, store: any) => store.selectedTask === 'NumberGame',
    timeline: [
      {
        name: 'NumberGameInstructions',
        type: 'Text',
        props: {
          buttonText: "Let's Play",
          containerClass:
            'bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]',
          content: (
            <div className='bg-white p-8 rounded-lg'>
              <h1 className='text-4xl'>
                <strong>{TASK_NAMES['NumberGame']}</strong>
              </h1>
              <p>
                Let's play a round of {TASK_NAMES['NumberGame']}! Your goal is to use the numbers
                and operations given to you to create a specific target number. There might be
                multiple combinations that reach the same target, so be sure to find them! Once you
                think you are done with a given set of numbers and operations, or want to take a
                stab at a new one, you can request a new one. Try to find as many combinations as
                you can within the time limit of 4 minutes. Good luck!
              </p>
              <p>
                <strong>How to play:</strong>
              </p>
              <ul className='pl-5 mb-4'>
                <li>Create terms resulting in the target using the given numbers and operators</li>
                <li>Operations are evaluated left to right, e.g. 5 + 5 x 7 = 70</li>
                <li>Each number and operator can be used multiple times</li>
                <li>Press ENTER to submit your solution</li>
                <li>Press DELETE undo the last operation</li>
                <li>Press CLEAR to delete the entire current solution</li>
                <li>Press NEW SET for a new pair of numbers and target</li>
              </ul>
            </div>
          ),
        },
      },
      {
        name: 'NumberGameTrial',
        type: 'NumberGame',
        props: {
          timelimit: TASK_TIME_LIMIT,
        },
      },
    ],
  },

  {
    type: 'IF_BLOCK',
    cond: (_data: any, store: any) => store.selectedTask === 'DatingGame',
    timeline: [
      {
        name: 'DatingGameInstructions',
        type: 'Text',
        props: {
          buttonText: "Let's Play",
          containerClass:
            'bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]',
          content: (
            <div className='bg-white p-8 rounded-lg'>
              <h1 className='text-4xl'>
                <strong>{TASK_NAMES['DatingGame']}</strong>
              </h1>
              <p>
                Let's play a round of {TASK_NAMES['DatingGame']}! In this matchmaking sandbox, it is
                your task to set up blind dates between singles. Each person is represented by a
                card that contains information about their likes, dislikes, and dating preferences.
                You can generate new singles from a deck of cards and drag a pair onto the table on
                your screen in order to set up a date. You have 4 minutes in total, so have fun
                playing cupid! Keep in mind, it's just like in real life: Some couples work out
                better than others, but you won't find out for now.
              </p>
              <p>
                <strong>How to play:</strong>
              </p>
              <ul className='pl-5 mb-4'>
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
          ),
        },
      },
      {
        name: 'DatingGame',
        type: 'DatingGame',
        props: {
          timelimit: TASK_TIME_LIMIT,
        },
      },
    ],
  },

  {
    type: 'IF_BLOCK',
    cond: (_data: any, store: any) => store.selectedTask === 'SportsGame',
    timeline: [
      {
        name: 'SportsGameInstructions',
        type: 'Text',
        props: {
          buttonText: "Let's Play",
          containerClass:
            'bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]',
          content: (
            <div className='bg-white p-8 rounded-lg'>
              <h1 className='text-4xl'>
                <strong>{TASK_NAMES['SportsGame']}</strong>
              </h1>
              <p>
                Let's play a round of {TASK_NAMES['SportsGame']}! In this management sandbox, you
                will be presented with cards of virtual football players, each having different
                strenghts and weaknesses. Your task is to create teams and have them play each other
                by assigning players of both teams to positions "Attack", "Defense", and "Middle".
                Feel free to experiment with multiple matches within the time limit of 4 minutes.
              </p>
              <p>
                <strong>How to play:</strong>
              </p>
              <ul className='pl-5 mb-4'>
                <li>Drag a player card to do X</li>
              </ul>
            </div>
          ),
        },
      },
      {
        name: 'SportsGame',
        type: 'SportsGame',
        props: {
          // Sports Game specific props
        },
      },
    ],
  },

  {
    type: 'IF_BLOCK',
    cond: (_data: any, store: any) => store.selectedTask === 'ElementsGame',
    timeline: [
      {
        name: 'ElementsGameInstructions',
        type: 'Text',
        props: {
          buttonText: "Let's Play",
          containerClass:
            'bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]',
          content: (
            <div className='bg-white p-8 rounded-lg'>
              <h1 className='text-4xl'>
                <strong>{TASK_NAMES['ElementsGame']}</strong>
              </h1>
              <br />
              <p>
                Let's play a round of {TASK_NAMES['ElementsGame']}! Your goal is to create as many
                valid words as possible using the given set of 7 letters. As this game is a bit more
                involved, we will play a short tutorial round.
              </p>
              <br />
            </div>
          ),
        },
      },
      {
        name: 'ElementsGame',
        type: 'ElementsGame',
        props: {
          // Elements Game specific props
        },
      },
    ],
  },

  {
    name: 'ExitQuestionnaire',
    type: 'Quest',
    props: {
      surveyJson: {
        pages: [
          {
            name: 'experience',
            title: 'Your Experience',
            elements: [
              {
                type: 'rating',
                name: 'task_enjoyment',
                title: 'How much did you enjoy the game?',
                isRequired: true,
                rateMin: 1,
                rateMax: 7,
                displayMode: window.innerWidth > 768 ? 'buttons' : 'dropdown', // same fix as above
                minRateDescription: 'Not at all',
                maxRateDescription: 'Very much',
              },
              {
                type: 'comment',
                name: 'feedback',
                title: 'How sad are you that there are no other questions yet?',
                isRequired: false,
              },
            ],
          },
        ],
      },
    },
  },

  {
    name: 'Upload',
    type: 'Upload',
    props: {
      sessionCSVBuilder: {
        filename: '',
        trials: ['CheckDevice'],
        fun: (sessionInfo: Record<string, any>) => {
          return sessionInfo;
        },
      },
      trialCSVBuilder: {
        flatteners: flatteners,
        builders: [
          {
            filename: `_DEMOGRAPHICS_${Date.now()}`,
            trials: ['InitialQuestionnaire'],
          },
          {
            filename: `_TASK_RANKING_${Date.now()}`,
            trials: ['TaskRanking'],
          },
          {
            filename: `_TASK_TRIALS_${Date.now()}`,
            trials: [
              'WordGameTrial',
              'NumberGameTrial',
              'DatingGame',
              'SportsGame',
              'ElementsGame',
            ],
          },
          {
            filename: `_EXIT_QUESTIONNAIRE_${Date.now()}`,
            trials: ['ExitQuestionnaire'],
          },
        ],
      },
    },
  },
  {
    type: 'ProlificEnding',
    hideSettings: true,
    props: { prolificCode: import.meta.env.VITE_PROLIFIC_CODE },
  },
]);

export default function Experiment() {
  return (
    <ExperimentRunner
      config={config}
      timeline={experiment}
      components={{
        TaskRanking,
        TaskRating,
        WordGame,
        NumberGame,
        DatingGame,
        SportsGame,
        ElementsGame,
        WheelOfFortune,
      }}
    />
  );
}
