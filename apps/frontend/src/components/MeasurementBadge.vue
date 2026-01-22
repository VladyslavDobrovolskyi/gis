<template>
  <Transition name="measurement-fade">
    <div v-if="text" class="measurement-badge" role="status" aria-live="polite">
      <Transition name="measurement-text" mode="out-in">
        <span :key="text">{{ text }}</span>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMapStore } from '../stores/map.store';
const mapStore = useMapStore();
const text = computed(() => mapStore.measurementText ?? '');
</script>

<style scoped>
/* reuse the same small styles from App.vue but scoped */
.measurement-badge {
  position: fixed;
  right: 12px;
  top: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 14px;
  border-radius: 8px;
  font-weight: 600;
  z-index: 2000;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  transform-origin: center top;
}
</style>
