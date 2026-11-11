// spec: (Firebase SDK integration for deployment & backend services)

/**
 * Development Firebase configuration.
 * Used for development / staging builds (nx build --configuration=development).
 */
export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyCf4ha6NwoZsba0XZqaiycvRmNCDRdv0OE',
    authDomain: 'budget-fort-pwa.firebaseapp.com',
    projectId: 'budget-fort-pwa',
    storageBucket: 'budget-fort-pwa.firebasestorage.app',
    messagingSenderId: '490159735458',
    appId: '1:490159735458:web:51eb5955831739c8974dfb',
    measurementId: 'G-JK30Z36SB3',
  },
};
