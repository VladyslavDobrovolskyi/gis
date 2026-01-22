<template>
  <div class="loader-overlay" role="status" aria-live="polite">
    <div class="loader-spinner" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.loader-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  pointer-events: none;
}
.loader-spinner {
  width: 56px;
  height: 56px;
  border: 8px solid #ffa500;
  border-top: 8px solid #8bd061;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
