import App from './App.vue';
import { createApp } from 'vue';
import { createPinia as PiniaStorePlugin } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import '@/styles/map.styles.css';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const app = createApp(App);

app.use(VueQueryPlugin);
app.use(PiniaStorePlugin());

app.mount('#app');
