import { TransactionHeaderToolbarComponent } from './transaction-header-toolbar.component';
import { TransactionNavigationDrawerComponent } from './transaction-navigation-drawer.component';

describe('@ui-transaction exports', () => {
  it('should export TransactionHeaderToolbarComponent', () => {
    expect(TransactionHeaderToolbarComponent).toBeDefined();
  });

  it('should export TransactionNavigationDrawerComponent', () => {
    expect(TransactionNavigationDrawerComponent).toBeDefined();
  });
});