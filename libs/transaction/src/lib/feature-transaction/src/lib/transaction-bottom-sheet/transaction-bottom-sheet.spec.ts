import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionBottomSheetComponent } from './transaction-bottom-sheet';

describe('TransactionBottomSheetComponent', () => {
  let component: TransactionBottomSheetComponent;
  let fixture: ComponentFixture<TransactionBottomSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionBottomSheetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionBottomSheetComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
