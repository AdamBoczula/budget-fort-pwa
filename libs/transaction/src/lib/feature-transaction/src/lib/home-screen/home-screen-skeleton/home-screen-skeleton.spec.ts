import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HomeScreenSkeletonComponent } from './home-screen-skeleton';

describe('HomeScreenSkeletonComponent', () => {
  let fixture: ComponentFixture<HomeScreenSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeScreenSkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeScreenSkeletonComponent);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render 4 skeleton cards', () => {
    const cards = fixture.debugElement.queryAll(By.css('.card'));
    expect(cards.length).toBe(4);
  });

  it('should render 3 skeleton list items', () => {
    const items = fixture.debugElement.queryAll(By.css('.list-item'));
    expect(items.length).toBe(3);
  });

  it('should render skeleton title', () => {
    const title = fixture.debugElement.query(By.css('.title'));
    expect(title).toBeTruthy();
  });

  it('should add shimmer class to animated elements', () => {
    const shimmerElements = fixture.debugElement.queryAll(By.css('.shimmer'));
    expect(shimmerElements.length).toBeGreaterThan(0);
  });
});