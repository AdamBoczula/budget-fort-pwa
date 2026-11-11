// spec: (Firebase SDK integration for deployment & backend services)

/**
 * Production Firebase configuration.
 * Used for production builds (nx build --configuration=production).
 */
export const environment = {
  production: true,
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
