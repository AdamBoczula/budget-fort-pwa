import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoriesQuickAddComponent } from './categories-quick-add';

describe('CategoriesQuickAddComponent', () => {
  let component: CategoriesQuickAddComponent;
  let fixture: ComponentFixture<CategoriesQuickAddComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriesQuickAddComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriesQuickAddComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
