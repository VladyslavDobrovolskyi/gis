import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import App from './App.vue';

import './style.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

L.Icon.Default.mergeOptions({
  iconUrl: icon,
  shadowUrl: iconShadow,
});
const pinia = createPinia();

const app = createApp(App);
app.use(pinia);
app.use(VueQueryPlugin);

app.mount('#app');
