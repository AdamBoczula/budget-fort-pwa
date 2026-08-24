import { appConfig } from './app.config';

describe('appConfig', () => {
  it('should configure application providers', () => {
    expect(appConfig.providers).toBeDefined();
    expect(appConfig.providers?.length).toBeGreaterThan(0);
  });
});