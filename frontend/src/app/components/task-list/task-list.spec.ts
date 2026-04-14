import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskListComponent } from './task-list';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskListComponent, HttpClientTestingModule]
    })
        .compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    await fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});