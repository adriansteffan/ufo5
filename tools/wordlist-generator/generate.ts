// use scowl and 600 games of nyt spelling bee to generate our word list

import { writeFileSync } from 'fs';
import { join } from 'path';

import wordlist from 'wordlist-english';

const words = wordlist['english'];


const gameWords = words.filter((word: string) =>
  word.length >= 1 &&
  word.length <= 20 &&
  /^[A-Z]+$/i.test(word)
).map((word: string) => word.toUpperCase());

console.log(`Filtered to ${gameWords.length} game-suitable words`);


interface LetterSet {
  letters: string[];
  validWords: string[];
}

const puzzleSequences = [
  "wAHORTY", "iCFMNOR", "cEFHILY", "tABDGIR", "iEGHLTW", "rFLMNOU", "aCEHKNY", "tBEHILM", "oCFILMR", "aGHOPRT",
  "tCEHNUY", "gADILMR", "tAGHNUY", "oACHPRY", "nACEGHL", "kABCELM", "mAENPTY", "cAINPRT", "rCDIKOP", "kEILNTW",
  "tFGHIOR", "dCMNORU", "cEHKLMO", "bALORTY", "eACGHNX", "gDIOPRY", "nCEGLOY", "aCDILTW", "rDGHNOU", "uEFLNTV",
  "yACDIMN", "aCILRYZ", "nDHIMOT", "hFGLOTU", "oKNPRTY", "yADILPV", "rABLMNO", "rACDHUY", "fBCEINT", "dABHLOT",
  "aCIMNTY", "nBHKMOY", "lEFKMNO", "rACDILW", "mCEHINY", "tADMORY", "tCGHILY", "yACMNOR", "pADFLMU", "bAEHLPT",
  "nDORTUW", "oACFKLR", "lBCORTU", "rADHINT", "tFHLOUY", "cABEKLN", "oBCIKRW", "lCGHIOR", "aCFILRY", "aBILTVY",
  "oAFHLTY", "dALNRUY", "hACDNOW", "tHILMNO", "mADGIPR", "bACIKRT", "aBEGMTY", "mACHNOR", "cAILMNR", "lBDFINO",
  "fACELPT", "eACLTYZ", "lBIMOTY", "nCEHIKT", "bAMNRTU", "lDGNOUY", "tABDMOR", "tIMPRUY", "tIKLNWY", "rAFHKOY",
  "yABELNZ", "lACFINY", "nCEGKLO", "iAMNPRZ", "mACGIKR", "tEGHILM", "cAILMNY", "lABKOPY", "hACMNTW", "aBDHILN",
  "cEMNOPT", "aEHLNVY", "bEFILNX", "dABIJRY", "pACMNOY", "aMNOTXY", "hACLNTU", "rLMOPTY", "tACINPY", "yADKORW",
  "rGNOTUW", "cAEHKMT", "tCFINOR", "oDNPRUW", "nCEIPTV", "mBELNOT", "rBDHIMO", "oCNRTUY", "nEHOPTY", "tAFMNOR",
  "hAEMPTY", "nAHLMUY", "kACLORW", "yACEHNT", "bACDKOR", "yAGLMOP", "dAIMPRY", "pFILORT", "cAHNOVY", "cADILRT",
  "dHIORTY", "nEHLMOT", "aDFHLNU", "rBGHOTU", "bADHINR", "iBCEHTW", "bAHMORT", "pEILMNT", "vACILNR", "uFGLNOR",
  "yEILMNT", "cAFLNTU", "oAGHRTW", "fGILORY", "eXPICTL", "wDIMNOT", "nBEHOPX", "mABDJOR", "eLNOPTY", "iDKLNUY",
  "eABCHLW", "lACFITY", "dABLOPR", "tCHIPRY", "kACFORT", "iCLNTVY", "dCNORTU", "nAEMPTV", "tFHLMOU", "iHLNORT",
  "oGHILPY", "gADLNRU", "oDGHNTU", "oDHIKNW", "yCENOPT", "oACJKPT", "cAHMORT", "tADMNOR", "tAILMRY", "tACKOPR",
  "aFGLRUY", "yALORTV", "pCEHILN", "tBELMNZ", "iABCLNR", "mCILOPT", "uACLRTY", "lEHKNOT", "cAGILRT", "rCIMOPY",
  "rACFOTY", "iDHLNOP", "tEFILMX", "yABDGNR", "mADINRT", "lCIPRTU", "nBEGMOY", "yALMNOR", "oEGKLNW", "tILMPUY",
  "pLORTUY", "oBHIPRT", "uGHORTW", "bACLNOY", "cBELNOV", "hAGILRT", "tEFLNUY", "oELMNTX", "fAGIRTY", "oBIKLNT",
  "cAENPTX", "hACNRUY", "eCFINTV", "lBFIKOP", "tACFLRU", "nADHOPR", "tACINVY", "yABGLRU", "rADNQTU", "cABKLPU",
  "uDGMOPR", "nBELMOW", "nDIMOPT", "cDOPRTU", "rADIPTY", "yACIPRT", "oDGHRTU", "wEHILNP", "dACIMRT", "aDHNRTY",
  "yACKRTW", "tAFILRY", "oHLMNTY", "oABGNRZ", "mACILTY", "rADHOPT", "mAHLNOR", "aLNRTUY", "pACILNR", "vABEGLT",
  "lADKORW", "lAFIMPY", "gDHLORY", "pAGHMOR", "iDHLOTW", "lACHIRV", "nMOPRTY", "aKLNOPT", "aBCIKLM", "rADINTY",
  "rIMNOTY", "oABCKLR", "yACHMPR", "rABCLOT", "oCILRTV", "lABDIJR", "cAHLNOY", "mAHIRTY", "aBCKORZ", "mEHNPTU",
  "eCLNTXY", "mADKLNR", "nABCMOT", "hGLOTUY", "fCEILTY", "nABCLOR", "tAILRVY", "wAEHLTY", "yCELNOT", "oBGILMR",
  "tABCJKO", "aFILNPT", "yAEGLMP", "tABDHIR", "hACIMRT", "oAHMNRY", "rALMNOP", "rABCHNY", "aCHNPUY", "yACELNP",
  "eBHINTV", "aBCHILN", "lBGITUY", "pBCIORT", "oDHILNW", "iACFNRT", "mDIORTY", "iCKLNRY", "iBLNOTY", "rABCDHK",
  "nAIMPRZ", "hCEGLOW", "aBLMNOR", "oDLPRUY", "kABCLOW", "oCDGHIL", "lABCGKO", "tACHINY", "nABELMY", "uCEFLNY",
  "tCDNOUW", "tBELOPY", "mAHNOPT", "rACNTUY", "hACIRTY", "tEFLNUV", "rABDJMO", "aBCIKLW", "lACIMNT", "bDFLOTU",
  "mACKOPR", "yAGLNRT", "oAGLMPY", "rALNOWY", "tAFGIRY", "nABILPT", "pDHILNO", "oGLNTUY", "tBIOPRY", "eACHLNV",
  // Puzzles 301-400
  "gAFLNRT", "yABILTV", "cADHINP", "aDNQRUY", "iACGHLR", "uFLMNOR", "cBHKOTU", "lDHMOTU", "tEMNOPX", "uCDFILT",
  "lBHIORY", "lCEMOPT", "aHRTUWY", "dFNORUY", "iCHMNOP", "rBGIOTY", "rDGHLOY", "eGHLNTY", "iACNPRT", "iCKNPTY",
  "cEHLOPT", "tACFLUY", "rACDKOY", "bAEGLMN", "aCKRTWY", "gAHNOPR", "mAELNPT", "cABLORT", "uDFILTY", "rABDFOT",
  "tABLNOY", "eCHINPY", "tACILNY", "tACDLOR", "eCLNPTU", "rABDHIT", "yADLNRU", "nDGHOTU", "lAHMNOR", "iALRTVY",
  "lEIPTVX", "tAFLNOR", "nEFLTUY", "tADGHIW", "pCILMOT", "mAEGLPX", "yCDILTU", "bACEHLY", "cEFILTY", "yLOPRTU",
  "gABNORZ", "cAEFLPT", "iAFHLTW", "gHILOPY", "lACDIRW", "rAFILMY", "cAINTVY", "rDGMOPU", "uGNORTW", "rCNOTUY",
  "lFGNORU", "mACEHNT", "mADHNOW", "iCELMNY", "pBCEKOT", "lAFINTY", "lAIMPRY", "nACEHKY", "aCLQRTU", "tABEGMY",
  "tFILNRU", "iAMNRTV", "tHLMNOY", "lABKRUW", "bADLORY", "gFILORY", "eGHILMT", "oCEHKLM", "fACDIRT", "tACJKOP",
  "hAGOPRT", "eGHLOTY", "aBDIJLR", "uCFLORY", "nABLMTU", "oGNPRUW", "cHIKOPT", "hCFINOR", "uBFGLOR", "oCHIKRY",
  "iACHMNR", "aFHKORY", "eAHNPTY", "rAFLTUY", "tEGHILW", "oCEMNPT", "lFHMOTU", "oCDIKPR", "bADGNOV", "nAEHLPT",
  // Puzzles 401-500
  "nAMOTXY", "nCHMOTU", "mAILRTY", "eFGLNUV", "iCKLPRY", "fINOPRT", "tADIPRY", "lADGHNO", "lACINPR", "nADGLRU",
  "eCLMOPX", "lAFMORY", "nABELPT", "lEFHNPU", "oEGHMNY", "iADLPVY", "cAFKORT", "hAMNORT", "dAGILTY", "aCFJKLP",
  "pEKMNTU", "rACGHIL", "aBCLNOY", "oFGHIPR", "nACHOVY", "aDFILNW", "lAGHMPU", "pMNORTY", "rAHILTY", "nADILTW",
  "bADILRZ", "uDNOPRW", "rACHILV", "bADHKNO", "tAHKMOW", "eCHKPTU", "eCLMOPT", "cBIKORW", "cABILNR", "aFGHRTU",
  "tCIORVY", "oBCIPRT", "fCELNUY", "uBFILMR", "oALNRWY", "tAEHLPY", "lACGIRT", "lABCFKU", "gAELMPY", "oCFHLMR",
  "lEFNTUV", "hABCELW", "lACEGNY", "iBELNTZ", "cFILNOT", "tALNRUY", "aGHNTUY", "iCHNTYZ", "tCEIMNX", "iEGLMTZ",
  "oBELPTY", "nAEHLVY", "hAMNORY", "cADKLOP", "lADGHRY", "tACEFPY", "lADFOTW", "hAELTWY", "oBIPRTY", "aDFHMNR",
  "cADILRY", "nBDFMOU", "nEFKLMO", "bADGLNO", "nADHRTY", "eBCKOPT", "yAHINPT", "iDFLMNU", "oBGIRTY", "lACKMOR",
  "gCEKLNO", "bALMNOR", "aCEJKLP", "aDIRWYZ", "hACDKRT", "tABDHLO", "aGHORTW", "iCENTVZ", "aBCKLOW", "cELMOPT",
  "wEHMNOT", "iABDHLN", "rACIPVY", "nAGLRTY", "oCILMNT", "dILORWY", "oEGNPTY", "lBIKNOT", "lABORTY", "lAFIRTY",
  // Puzzles 501-600
  "tABILNP", "rACFINT", "aBCDHKR", "dABFLOR", "pIMNORT", "wADKLRY", "dABHINR", "cAEHKPY", "nAFIRTY", "yEHNOPT",
  "hCMNOTU", "pCHLORY", "lAMNORY", "rCGHOUY", "gFHLOTU", "oBDHLNU", "cABJKOT", "oFIKLRT", "nCEILMT", "cEGLNOY",
  "cDNORTU", "tACDIMR", "pEHILNW", "dHILNOW", "hACINTY", "tACFORY", "aBDGLUY", "aCKLORW", "aCHNRUY", "mALNOWY",
  "aCDIMNY", "lBEFIXY", "lHIOPRW", "pAGHNOR", "bAILNRT", "aDHILNR", "bILMOTY", "lADFMPU", "aDFPRTU", "lBCENOV",
  "oFINPRT", "rAFIMNY", "tCILMOP", "oCFHINR", "dBILNOW", "pCELMOX", "gAHNTUY", "kABCGLO", "gALRUVY", "oGHILTW",
  "cEHILNP", "lCDITUY", "rBNOTUW", "aCDHINR", "tAEHNPY", "pACENTX", "lAHIRTY", "nACITVY", "wEGHILT", "oBDFLTU",
  "yADGHLR", "uBGILTY", "mILPTUY", "tCEHINY", "oCEGHLW", "dGHLORY", "rABCDKW", "uCNORTY", "cAEHKNY", "pACINRT",
  "rABGNOZ", "aDILPVY", "oBHKMNY", "aCHMPRY", "aCDHLNP", "oACKMPR", "tAEMNPV", "uDNOPTW", "oCKLPTU", "dAGLRUY",
  "aFKLNRY", "hACEMNT", "oGILMXY", "yAILRTV", "uABCFKL", "aEMNPTY", "nGORTUW", "oAJLMRY", "oCLMNUY", "mCENOPT",
  "tDGHORU", "pCDORTU", "nAHMORY", "hCGILTY", "gAELMPX", "nDIMOTW", "lEHMNOT", "cGHILOR", "dAGLNRU", "nAKLMOW"
];

function canBuildWord(word: string, availableLetters: string[]): boolean {
  const letterCount: { [key: string]: number } = {};

  for (const letter of availableLetters) {
    letterCount[letter] = (letterCount[letter] || 0) + 1;
  }

  for (const letter of word) {
    if (!letterCount[letter] || letterCount[letter] === 0) {
      return false;
    }
    letterCount[letter]--;
  }

  return true;
}

function generateLetterSets(): LetterSet[] {
  const letterSets: LetterSet[] = [];

  for (const sequence of puzzleSequences) {
    const letters = sequence.split('').map(letter => letter.toUpperCase());
    const validWords = gameWords.filter((word: string) =>
      word.length >= 3 &&
      word.length <= 7 &&
      canBuildWord(word, letters)
    );

    if (validWords.length > 0) {
      letterSets.push({
        letters,
        validWords
      });
    }
  }

  return letterSets;
}

const letterSets = generateLetterSets();


const tsContent = `export const LETTER_SETS = ${JSON.stringify(letterSets, null, 2)};
`;

const outputPath = join(__dirname, '../../src/utils/wordgamelist.tsx');
writeFileSync(outputPath, tsContent);

console.log(`\nGenerated ${letterSets.length} letter sets and saved to src/utils/wordgamelist.tsx`);
console.log('Each set contains 7 letters and 8-20 valid words.');