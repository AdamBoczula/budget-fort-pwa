import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LastTransactionComponent } from './last-transaction';

describe('LastTransactionComponent', () => {
  let component: LastTransactionComponent;
  let fixture: ComponentFixture<LastTransactionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LastTransactionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LastTransactionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
