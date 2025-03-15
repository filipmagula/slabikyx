<script setup lang="ts">
import { ref } from 'vue';
import { useTextStore } from '../stores/textStore';

const textStore = useTextStore();
const activeSegment = ref<number | null>(null);
const activeWord = ref<number | null>(null);
const activeSyllable = ref<number | null>(null);

// Funkce pro úpravu textu pro správné čtení
function prepareTextForSpeech(text: string): string {
  // Seznam problematických slabik a jejich úprav
  const fixMap: Record<string, string> = {
    'ml': ' ml', // přidání zero-width space mezi znaky
    'me': ' mee',
    'z': ' zz',
    'km': 'k\u200Bm',
    'kg': 'k\u200Bg',
    'há': 'háá',
    'rá': 'ráá',
    'tá': 'táá',
    'dá': 'dáá',
    'ná': 'náá',
    'bá': 'báá',
    'vá': 'váá',
    'di.': 'ďi',
    'oči': ' oči',
    'i': ' i ',
    // Přidejte další problematické případy podle potřeby
  };
  
  // Kontrola, zda celý text odpovídá některé problematické slabice
  if (fixMap[text.toLowerCase()]) {
    return fixMap[text.toLowerCase()];
  }
  
  return text;
}

function speak(text: string, index: number, wordIndex: number | null = null, syllableIndex: number | null = null) {
  if (!('speechSynthesis' in window)) {
    console.error('Text-to-speech není podporován');
    return;
  }

  activeSegment.value = index;
  activeWord.value = wordIndex;
  activeSyllable.value = syllableIndex;
  
  // Upravit text pro správné čtení
  const preparedText = prepareTextForSpeech(text);
  
  const utterance = new SpeechSynthesisUtterance(preparedText);
  utterance.lang = 'cs-CZ'; // Nastavení jazyka na češtinu
  utterance.rate = textStore.voiceSettings.rate;
  utterance.pitch = textStore.voiceSettings.pitch;
  if (textStore.voiceSettings.voice) {
    utterance.voice = textStore.voiceSettings.voice;
  }

  utterance.onend = () => {
    activeSegment.value = null;
    activeWord.value = null;
    activeSyllable.value = null;
  };

  window.speechSynthesis.speak(utterance);
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
    <div class="text-2xl leading-relaxed space-y-4">
      <template v-if="textStore.readingMode === 'syllables'">
        <span
          v-for="(segment, index) in textStore.processedText"
          :key="index"
          class="inline-block"
        >
          <span
            v-for="(wordSyllables, wordIndex) in segment.syllables"
            :key="wordIndex"
            class="inline-block"
          >
            <span
              v-for="(syllable, syllableIndex) in wordSyllables"
              :key="syllableIndex"
              class="inline-block"
            >
              <span
                @click="speak(syllable, index, wordIndex, syllableIndex)"
                :class="[
                  'cursor-pointer px-1 rounded transition-colors',
                  activeSegment === index && activeWord === wordIndex && activeSyllable === syllableIndex ? 'bg-yellow-200' : 'hover:bg-blue-100'
                ]"
              >
                {{ syllable }}
              </span>
              <span v-if="syllableIndex < wordSyllables.length - 1">-</span>
            </span>
            <span v-if="wordIndex < segment.syllables.length - 1">&nbsp;</span>
          </span>
          <span v-if="index < textStore.processedText.length - 1">&nbsp;</span>
        </span>
      </template>

      <template v-else-if="textStore.readingMode === 'words'">
        <span
          v-for="(segment, index) in textStore.processedText"
          :key="index"
        >
          <span
            v-for="(wordSyllables, wordIndex) in segment.syllables"
            :key="wordIndex"
            @click="speak(wordSyllables.join(''), index, wordIndex)"
            :class="[
              'cursor-pointer mx-1 px-2 py-1 rounded inline-block transition-colors',
              activeSegment === index && activeWord === wordIndex ? 'bg-yellow-200' : 'hover:bg-blue-100'
            ]"
          >
            {{ wordSyllables.join('') }}
          </span>
        </span>
      </template>

      <template v-else>
        <p
          v-for="(segment, index) in textStore.processedText"
          :key="index"
          @click="speak(segment.text, index)"
          :class="[
            'cursor-pointer p-2 rounded transition-colors',
            activeSegment === index ? 'bg-yellow-200' : 'hover:bg-blue-100'
          ]"
        >
          {{ segment.text }}
        </p>
      </template>
    </div>
  </div>
</template>