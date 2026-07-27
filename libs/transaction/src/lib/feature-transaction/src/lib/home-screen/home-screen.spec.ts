import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePageScreen } from './home-screen';

describe('HomePageScreen', () => {
  let component: HomePageScreen;
  let fixture: ComponentFixture<HomePageScreen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageScreen],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageScreen);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
