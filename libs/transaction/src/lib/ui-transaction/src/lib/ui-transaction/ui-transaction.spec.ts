import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiTransaction } from './ui-transaction';

describe('UiTransaction', () => {
  let component: UiTransaction;
  let fixture: ComponentFixture<UiTransaction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiTransaction],
    }).compileComponents();

    fixture = TestBed.createComponent(UiTransaction);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
