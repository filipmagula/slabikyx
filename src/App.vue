<script setup lang="ts">
import TextInput from './components/TextInput.vue';
import ReadingModeSelector from './components/ReadingModeSelector.vue';
import ReadingDisplay from './components/ReadingDisplay.vue';
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4">
      <h1 class="text-4xl font-bold text-center text-blue-600 mb-8">
        Čtení a slabiky
      </h1>
      
      <TextInput />
      <ReadingModeSelector />
      <ReadingDisplay />
    </div>
  </div>
</template>