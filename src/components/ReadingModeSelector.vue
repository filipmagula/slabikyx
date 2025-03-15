<script setup lang="ts">
import { useTextStore } from '../stores/textStore';
import type { ReadingMode } from '../types';

const textStore = useTextStore();

const modes: { value: ReadingMode; label: string }[] = [
  { value: 'syllables', label: 'Čtení po slabikách' },
  { value: 'words', label: 'Čtení po slovech' },
  { value: 'sentences', label: 'Čtení po větách' },
];
</script>

<template>
  <div class="flex justify-center gap-4 my-6 w-full max-w-4xl mx-auto">
    <button
      v-for="mode in modes"
      :key="mode.value"
      @click="textStore.readingMode = mode.value"
      :class="[
        'px-6 py-3 rounded-lg text-lg font-semibold transition-colors',
        textStore.readingMode === mode.value
          ? 'bg-pink-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      ]"
    >
      {{ mode.label }}
    </button>
  </div>
</template>