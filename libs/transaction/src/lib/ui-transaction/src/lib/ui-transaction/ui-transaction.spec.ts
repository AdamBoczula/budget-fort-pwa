import { TestBed } from '@angular/core/testing';
import { UiTransaction } from './ui-transaction';

describe('UiTransaction', () => {
  it('should create', () => {
    TestBed.configureTestingModule({
      imports: [UiTransaction],
    });
    const fixture = TestBed.createComponent(UiTransaction);
    expect(fixture.componentInstance).toBeTruthy();
  });
});