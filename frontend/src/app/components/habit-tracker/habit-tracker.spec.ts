import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HabitTracker } from './habit-tracker';

describe('HabitTracker', () => {
  let component: HabitTracker;
  let fixture: ComponentFixture<HabitTracker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabitTracker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HabitTracker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
