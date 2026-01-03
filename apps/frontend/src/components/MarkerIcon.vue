<template>
  <!-- Non-visual utility component: exposes a prebuilt Leaflet Icon instance via ref exposure -->
  <!-- Usage: <MarkerIcon ref="iconRef" color="green" size="medium" /> then use iconRef.icon -->
</template>

<script setup lang="ts">
import { createMarkerIcon } from '../lib/marker';

const props = withDefaults(
  defineProps<{
    color?: string;
    size?: 'small' | 'medium' | 'large';
  }>(),
  {
    color: 'green',
    size: 'medium',
  },
);

const icon = createMarkerIcon(props.color, props.size);

defineExpose({ icon });
</script>
