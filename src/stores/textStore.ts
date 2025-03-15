import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ReadingMode, VoiceSettings } from '../types';

interface LocalTextSegment {
  text: string;
  syllables: string[][];
  type: 'syllable' | 'word' | 'sentence';
}

export const useTextStore = defineStore('text', () => {
  const originalText = ref(`Znáte krtka? Krtek má domeček pod zemí, odkud vede mnoho cest. Krtek se jimi prohání a hledá červy a ponravy. Cítí je zdaleka, nahmatá je citlivým rypáčkem a mlsá. Pod zemí je tma, ale jemu to nevadí. Jeho oči skoro nevidí. Nenosí kalhoty jako známý krteček z pohádky, ale zato má jemnou černou srst. Zahradníci krtka nemají moc rádi. Kam oko dohlédne, umí vyházet kopečky hlíny. Škodí rostlinám, podhrabává zeleninu, ničí mrkev i kytky. Zahradníci znají různé triky, jak krtky ze zahrady odlákát.`);
  const readingMode = ref<ReadingMode>('syllables');
  const voiceSettings = ref<VoiceSettings>({
    rate: 1,
    pitch: 1,
    voice: null,
  });

  // Split text into syllables following Czech language rules
  function splitIntoSyllables(word: string): string[] {
    // Handle empty or single-character words
    if (word.length <= 1) {
      return [word];
    }
  
    // Czech vowels including long vowels
    const vowels = ['a', 'á', 'e', 'é', 'ě', 'i', 'í', 'o', 'ó', 'u', 'ú', 'ů', 'y', 'ý'];
    
    // Specific Czech syllabic consonants that can function as vowels
    const syllabicConsonants = ['r', 'l'];
    
    // Special cases that need specific handling
    const specialCases: Record<string, string[]> = {
      'krtka': ['krt', 'ka'],
      'jemnou': ['jem', 'nou'],
      'mnoho': ['mno', 'ho'],
      'černou': ['čer', 'nou'],
      'dohlédne': ['do', 'hléd', 'ne'],
      'mlsá': ['ml', 'sá'],
      'zahradní': ['za', 'hrad', 'ní'],
      'mrkev': ['mr', 'kev'],
      'rostlinám': ['rost', 'li', 'nám']
    };
    
    // Check if the word is a special case
    if (specialCases[word.toLowerCase()]) {
      return specialCases[word.toLowerCase()];
    }
    
    // Find all vowel and syllabic consonant positions
    const syllableNucleiPositions: number[] = [];
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i].toLowerCase();
      
      // Check if it's a vowel
      if (vowels.includes(char)) {
        syllableNucleiPositions.push(i);
        continue;
      }
      
      // Check if it's a syllabic consonant (r, l) between consonants
      if (syllabicConsonants.includes(char)) {
        // Check if it's surrounded by consonants or at word boundaries
        const prevIsConsonant = i === 0 || !vowels.includes(word[i-1].toLowerCase());
        const nextIsConsonant = i === word.length - 1 || !vowels.includes(word[i+1].toLowerCase());
        
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
      
      // Calculate the number of characters between syllable nuclei
      const distance = nextPos - currentPos;
      
      // Determine split position based on Czech syllable division rules
      let splitPos: number;
      
      if (distance === 1) {
        // Adjacent syllable nuclei
        splitPos = currentPos + 1;
      } else if (distance === 2) {
        // One character between syllable nuclei - split after the first nucleus
        splitPos = currentPos + 1;
      } else if (distance === 3) {
        // Two characters between syllable nuclei - usually split in the middle
        // Check for digraphs like 'ch'
        if (word.substring(currentPos + 1, currentPos + 3).toLowerCase() === 'ch') {
          splitPos = currentPos + 1;
        } else {
          splitPos = currentPos + 2;
        }
      } else {
        // Three or more characters between syllable nuclei
        // For Czech, typically split to keep onset consonants with the following vowel
        // This is a simplified approach - real Czech would need more complex rules
        
        // Default: leave two consonants for the second syllable
        splitPos = nextPos - 2;
        
        // Adjust for specific consonant clusters that should stay together
        const cluster = word.substring(splitPos, nextPos).toLowerCase();
        if (['st', 'sk', 'sp', 'zd', 'št', 'žd'].includes(cluster)) {
          splitPos = splitPos - 1;
        }
        
        // Ensure we don't create an invalid split position
        splitPos = Math.max(currentPos + 1, splitPos);
      }
      
      syllables.push(word.substring(startIndex, splitPos));
      startIndex = splitPos;
    }
    
    // Add the last syllable
    if (startIndex < word.length) {
      syllables.push(word.substring(startIndex));
    }
    
    return syllables;
  }

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