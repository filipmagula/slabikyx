<script setup lang="ts">
import { useTextStore } from '../stores/textStore';

const textStore = useTextStore();
</script>

<template>
  <div class="w-full max-w-4xl mx-auto">
    <textarea
      v-model="textStore.originalText"
      class="w-full h-32 p-4 border-2 border-pink-300 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
      placeholder="Zadejte text pro čtení..."
    ></textarea>
  </div>
</template>