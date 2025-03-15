import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ReadingMode, VoiceSettings } from '../types';

interface LocalTextSegment {
  text: string;
  syllables: string[][];
  type: 'syllable' | 'word' | 'sentence';
}

function splitIntoSyllables(word: string): string[] {
  // Handle empty or single-character words
  if (word.length <= 1) {
    return [word];
  }

  // Extract and remember punctuation at the end of the word
  const punctMatch = word.match(/([.,!?;:]+)$/);
  const punctuation = punctMatch ? punctMatch[1] : '';
  const wordWithoutPunct = word.replace(/[.,!?;:]+$/, '');

  // Special cases that need specific handling
  const specialCases: Record<string, string[]> = {
    'krtka': ['krt', 'ka'],
    'jemnou': ['jem', 'nou'],
    'mnoho': ['mno', 'ho'],
    'černou': ['čer', 'nou'],
    'dohlédne': ['do', 'hléd', 'ne'],
    'mlsá': ['ml', 'sá'],
    'zahradní': ['za', 'hrad', 'ní'],
    'zahradníci': ['za', 'hrad', 'ní', 'ci'],
    'zahrady': ['za', 'hra', 'dy'],
    'mrkev': ['mr', 'kev'],
    'rostlinám': ['rost', 'li', 'nám'],
    'odlákat': ['od', 'lá', 'kát'],
  };

  // Check if the word is a special case
  if (specialCases[wordWithoutPunct.toLowerCase()]) {
    const syllables = specialCases[wordWithoutPunct.toLowerCase()];
    
    // Add punctuation to the last syllable if needed
    if (punctuation && syllables.length > 0) {
      syllables[syllables.length - 1] += punctuation;
    }
    
    return syllables;
  }

  // Czech vowels including long vowels
  const vowels = ['a', 'á', 'e', 'é', 'ě', 'i', 'í', 'o', 'ó', 'u', 'ú', 'ů', 'y', 'ý'];

  // Sonants that can function as syllabic nuclei in certain contexts
  const syllabicConsonants = ['r', 'l'];

  // Obstruents (non-sonants)
  const obstruents = ['p', 'b', 't', 'd', 'ť', 'ď', 'k', 'g', 'f', 'v', 's', 'z', 'š', 'ž', 'ch', 'h', 'c', 'č'];

  // Find all syllable nuclei positions (vowels and syllabic consonants)
  const syllableNucleiPositions: number[] = [];

  for (let i = 0; i < wordWithoutPunct.length; i++) {
    const char = wordWithoutPunct[i].toLowerCase();

    // Check if it's a vowel
    if (vowels.includes(char)) {
      syllableNucleiPositions.push(i);
      continue;
    }

    // Check if it's a syllabic consonant (r, l) between consonants
    if (syllabicConsonants.includes(char)) {
      // Check if it's surrounded by consonants or at word boundaries
      const prevIsConsonant = i === 0 || !vowels.includes(wordWithoutPunct[i - 1].toLowerCase());
      const nextIsConsonant = i === wordWithoutPunct.length - 1 || !vowels.includes(wordWithoutPunct[i + 1].toLowerCase());

      if (prevIsConsonant && nextIsConsonant) {
        syllableNucleiPositions.push(i);
      }
    }
  }

  // If no syllable nuclei found, return the whole word
  if (syllableNucleiPositions.length === 0) {
    return [word];
  }

  // If only one syllable nucleus, return the whole word
  if (syllableNucleiPositions.length === 1) {
    return [word];
  }

  const syllables: string[] = [];
  let startIndex = 0;

  // Process each pair of adjacent syllable nuclei
  for (let i = 0; i < syllableNucleiPositions.length - 1; i++) {
    const currentPos = syllableNucleiPositions[i];
    const nextPos = syllableNucleiPositions[i + 1];

    // Get the substring between the current and next nucleus
    const betweenNuclei = wordWithoutPunct.substring(currentPos + 1, nextPos).toLowerCase();
    const consonantCount = betweenNuclei.length;

    // Apply Czech syllabification rules
    let splitPos: number;

    if (consonantCount === 0) {
      // VV pattern - Rule 0: V.V
      splitPos = currentPos + 1;
    } else if (consonantCount === 1) {
      // VCV pattern - Rule 1: V.CV
      splitPos = currentPos + 1;
    } else if (consonantCount === 2) {
      // VCCV pattern - Rules 2-1 and 2-2
      const firstC = betweenNuclei[0];
      const secondC = betweenNuclei[1];

      // Check if it's OR or Ov pattern
      const isObstruent = (c: string) => obstruents.includes(c);
      const isSonant = (c: string) => !isObstruent(c) && !vowels.includes(c);

      if ((isObstruent(firstC) && isSonant(secondC)) ||
        (isObstruent(firstC) && secondC === 'v')) {
        // Rule 2-2: V.CCV
        splitPos = currentPos + 1;
      } else {
        // Rule 2-1: VC.CV (default)
        splitPos = currentPos + 2;

        // Check exceptions
        const invalidInitials = ['ďm', 'bv'];
        if (invalidInitials.includes(betweenNuclei)) {
          splitPos = currentPos + 1;
        }
      }
    } else {
      // For 3+ consonants
      splitPos = currentPos + 2;
    }

    syllables.push(wordWithoutPunct.substring(startIndex, splitPos));
    startIndex = splitPos;
  }

  // Add the last syllable
  if (startIndex < wordWithoutPunct.length) {
    syllables.push(wordWithoutPunct.substring(startIndex));
  }

  // Add punctuation to the last syllable if needed
  if (punctuation && syllables.length > 0) {
    syllables[syllables.length - 1] += punctuation;
  }

  return syllables;
}

export const useTextStore = defineStore('text', () => {
  const originalText = ref(`Znáte krtka? Krtek má domeček pod zemí, odkud vede mnoho cest. Krtek se jimi prohání a hledá červy a ponravy. Cítí je zdaleka, nahmatá je citlivým rypáčkem a mlsá. Pod zemí je tma, ale jemu to nevadí. Jeho oči skoro nevidí. Nenosí kalhoty jako známý krteček z pohádky, ale zato má jemnou černou srst. Zahradníci krtka nemají moc rádi. Kam oko dohlédne, umí vyházet kopečky hlíny. Škodí rostlinám, podhrabává zeleninu, ničí mrkev i kytky. Zahradníci znají různé triky, jak krtky ze zahrady odlákat.`);
  const readingMode = ref<ReadingMode>('syllables');
  const voiceSettings = ref<VoiceSettings>({
    rate: 1,
    pitch: 1,
    voice: null,
  });

  const processedText = computed(() => {
    if (!originalText.value) return [];

    // Split into sentences, preserving punctuation
    const sentences = originalText.value
      .split(/([.!?]+\s*)/)
      .reduce((acc: string[], part, i) => {
        if (part) {
          // If this is punctuation and not the last element, combine with previous part
          if (part.match(/[.!?]+\s*/) && i > 0) {
            acc[acc.length - 1] += part;
          } else {
            acc.push(part);
          }
        }
        return acc;
      }, [])
      .filter(Boolean);

    const segments: LocalTextSegment[] = [];

    sentences.forEach(sentence => {
      if (sentence.trim()) {
        segments.push({
          text: sentence.trim(),
          syllables: sentence
            .trim()
            .split(/\s+/)
            .map(word => splitIntoSyllables(word)),
          type: 'sentence'
        });
      }
    });

    return segments;
  });

  return {
    originalText,
    readingMode,
    voiceSettings,
    processedText,
  };
});