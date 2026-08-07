import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';

import { BidSubmissionResponse, Tender } from '../../models/tender';
import { TenderService } from '../../services/tender';
import { TenderDetail } from './tender-detail';

describe('TenderDetail', () => {
  let fixture: ComponentFixture<TenderDetail>;
  let bidResult: Subject<BidSubmissionResponse>;

  const tender: Tender = {
    id: '507f1f77bcf86cd799439011',
    title: '500 Corporate Laptops',
    description: 'Business laptops',
    quantity: 500,
    deadline: '2026-08-15T15:00:00.000Z',
    status: 'Open',
    lowestBid: 120000,
    bidsCount: 4,
    createdAt: '2026-08-01T09:00:00.000Z',
    bids: [],
  };

  beforeEach(async () => {
    bidResult = new Subject<BidSubmissionResponse>();

    await TestBed.configureTestingModule({
      imports: [TenderDetail],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => tender.id } } },
        },
        {
          provide: TenderService,
          useValue: {
            getTender: () => of(tender),
            submitBid: () => bidResult.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenderDetail);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders the tender and requested quantity', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain(tender.title);
    expect(compiled.textContent).toContain('500 units');
    expect(compiled.querySelector('#submit-bid-title')).toBeTruthy();
  });

  it('shows an optimistic bid and rolls it back when submission fails', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const vendorInput = compiled.querySelector('#vendor-name') as HTMLInputElement;
    const amountInput = compiled.querySelector('#bid-amount') as HTMLInputElement;
    const submitButton = compiled.querySelector('.submit-button') as HTMLButtonElement;

    vendorInput.value = 'Optimistic Vendor';
    vendorInput.dispatchEvent(new Event('input'));
    amountInput.value = '119000';
    amountInput.dispatchEvent(new Event('input'));
    submitButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.pending-bid')?.textContent).toContain('Optimistic Vendor');
    expect(compiled.querySelector('.pending-bid')?.textContent).toContain('Submitting');
    expect(submitButton.disabled).toBe(true);

    bidResult.error(new HttpErrorResponse({ status: 500 }));
    fixture.detectChanges();

    expect(compiled.querySelector('.pending-bid')).toBeNull();
    expect(compiled.querySelector('.submission-error')?.textContent).toContain(
      'could not be submitted',
    );
  });
});
