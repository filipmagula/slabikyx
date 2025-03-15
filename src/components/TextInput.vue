<script setup lang="ts">
import { useTextStore } from '../stores/textStore';

const textStore = useTextStore();
</script>

<template>
  <div class="w-full max-w-2xl mx-auto p-4">
    <textarea
      v-model="textStore.originalText"
      class="w-full h-32 p-4 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      placeholder="Zadejte text pro čtení..."
    ></textarea>
  </div>
</template>