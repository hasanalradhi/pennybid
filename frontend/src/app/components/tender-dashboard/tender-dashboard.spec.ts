import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { of } from 'rxjs';

import { Tender } from '../../models/tender';
import { TenderService } from '../../services/tender';
import { TenderDashboard } from './tender-dashboard';

describe('TenderDashboard', () => {
  let fixture: ComponentFixture<TenderDashboard>;

  const tenders: Tender[] = [
    {
      id: '507f1f77bcf86cd799439011',
      title: '500 Corporate Laptops',
      description: 'Business laptops',
      quantity: 500,
      deadline: '2026-08-15T15:00:00.000Z',
      status: 'Open',
      lowestBid: 120000,
      bidsCount: 4,
      createdAt: '2026-08-01T09:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenderDashboard],
      providers: [
        provideRouter([]),
        {
          provide: TenderService,
          useValue: { getTenders: () => of(tenders) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenderDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders tenders returned by the API service', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.tender-title')?.textContent).toContain(
      '500 Corporate Laptops',
    );
    expect(compiled.querySelector('.status-badge')?.textContent).toContain('Open');
    expect(compiled.querySelector('.bid-count')?.textContent).toContain('4');
  });

  it('opens the create tender form', () => {
    const button = fixture.nativeElement.querySelector('.primary-action') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#create-tender-title')).toBeTruthy();
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('has no automatically detectable accessibility violations', async () => {
    const results = await axe.run(fixture.nativeElement as HTMLElement);

    expect(results.violations).toEqual([]);
  });
});
