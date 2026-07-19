import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataAccessTransaction } from './data-access-transaction';

describe('DataAccessTransaction', () => {
  let component: DataAccessTransaction;
  let fixture: ComponentFixture<DataAccessTransaction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataAccessTransaction],
    }).compileComponents();

    fixture = TestBed.createComponent(DataAccessTransaction);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
