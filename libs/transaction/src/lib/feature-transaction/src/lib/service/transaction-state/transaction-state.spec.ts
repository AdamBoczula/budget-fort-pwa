import { TestBed } from '@angular/core/testing';
import { TransactionService } from '@data-access-transaction';
import { of } from 'rxjs';

import { TransactionState } from './transaction-state';

describe('TransactionState', () => {
  let service: TransactionState;

  const transactionServiceMock = {
    getTransactions: () => of([]),
    addTransaction: () => of(),
    editTransaction: () => of(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TransactionService,
          useValue: transactionServiceMock,
        },
      ],
    });

    service = TestBed.inject(TransactionState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
