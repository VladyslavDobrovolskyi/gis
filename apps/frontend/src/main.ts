import App from './App.vue';
import { createApp } from 'vue';
import { createPinia as PiniaStorePlugin } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';

import '@/styles/map.styles.css';
import '@/styles/tailwind.css';
import '@/styles/leaflet.css';

const app = createApp(App);

app.use(VueQueryPlugin);
app.use(PiniaStorePlugin());

app.mount('#app');
