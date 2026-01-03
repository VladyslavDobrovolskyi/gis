<template>
  <div
    v-if="bubble.visible"
    class="delete-bubble"
    :class="{ fading: bubble.fading }"
    :style="{ left: (bubble.clientX ?? 0) + 'px', top: (bubble.clientY ?? 0) + 'px' }"
    @click.stop
    role="dialog"
    aria-label="Удалить объект"
  >
    <div class="btn-bubble" role="button" @click.prevent="confirm">✖</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMapStore } from '../stores/map.store';
const mapStore = useMapStore();
const bubble = computed(() => mapStore.deleteBubble);

// Emit confirm via global event so parent can perform deletion (keeps component simple)
function confirm() {
  // set fading state immediately to match previous UX
  mapStore.deleteBubble.fading = true;
  // dispatch a custom event for the app to handle actual deletion logic
  window.dispatchEvent(
    new CustomEvent('map:delete-confirm', { detail: { layer: mapStore.deleteBubble.layer } }),
  );
}
</script>

<style scoped>
.delete-bubble {
  position: fixed;
  transform: translate(-50%, -50%);
  background: transparent;
  padding: 0;
  box-shadow: none;
  z-index: 99999;
  pointer-events: none;
}
.delete-bubble > .btn-bubble {
  pointer-events: auto;
}
.btn-bubble {
  background: #d93f3f;
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border: none;
  cursor: pointer;
}
.delete-bubble .btn-bubble {
  transition:
    opacity 160ms cubic-bezier(0.2, 0.9, 0.2, 1),
    transform 160ms cubic-bezier(0.2, 0.9, 0.2, 1);
  transform-origin: center center;
  transform: scale(1);
}
.delete-bubble.fading .btn-bubble {
  opacity: 0;
  transform: scale(1.6);
}
</style>
