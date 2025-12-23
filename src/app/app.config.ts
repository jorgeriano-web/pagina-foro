import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { firebaseConfig } from './firebase.config';
import { connectFunctionsEmulator, getFunctions, provideFunctions } from '@angular/fire/functions';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),

    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    
    // b) Provee el servicio de la base de datos (Firestore) para inyectarlo en servicios y componentes
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions()),
  ]
};
