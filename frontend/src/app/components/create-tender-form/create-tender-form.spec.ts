import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';

import { CreateTenderRequest, Tender } from '../../models/tender';
import { TenderService } from '../../services/tender';
import { CreateTenderForm } from './create-tender-form';

describe('CreateTenderForm', () => {
  let fixture: ComponentFixture<CreateTenderForm>;
  let createResult: Subject<Tender>;
  let submittedRequest: CreateTenderRequest | undefined;

  const createdTender: Tender = {
    id: '507f1f77bcf86cd799439011',
    title: '80 Ergonomic Chairs',
    description: 'Adjustable office chairs',
    quantity: 80,
    deadline: '2026-09-01T12:00:00.000Z',
    status: 'Open',
    lowestBid: null,
    bidsCount: 0,
    createdAt: '2026-08-05T08:00:00.000Z',
  };

  beforeEach(async () => {
    createResult = new Subject<Tender>();
    submittedRequest = undefined;

    await TestBed.configureTestingModule({
      imports: [CreateTenderForm],
      providers: [
        {
          provide: TenderService,
          useValue: {
            createTender: (request: CreateTenderRequest): Observable<Tender> => {
              submittedRequest = request;
              return createResult.asObservable();
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateTenderForm);
    fixture.detectChanges();
  });

  it('shows validation feedback instead of submitting an empty form', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const submitButton = compiled.querySelector('.submit-button') as HTMLButtonElement;

    submitButton.click();
    fixture.detectChanges();

    expect(submittedRequest).toBeUndefined();
    expect(compiled.querySelector('#title-error')?.textContent).toContain('Enter a tender title');
    expect(compiled.querySelector('#deadline-error')?.textContent).toContain(
      'Choose a submission deadline',
    );
  });

  it('submits valid values and emits the created tender', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const emittedTenders: Tender[] = [];
    fixture.componentInstance.tenderCreated.subscribe((tender) => emittedTenders.push(tender));

    setInputValue(compiled, '#tender-title', createdTender.title);
    setInputValue(compiled, '#tender-description', createdTender.description);
    setInputValue(compiled, '#tender-quantity', String(createdTender.quantity));
    setInputValue(compiled, '#tender-deadline', localDateTimeDaysFromNow(7));

    (compiled.querySelector('.submit-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(submittedRequest?.title).toBe(createdTender.title);
    expect(submittedRequest?.quantity).toBe(createdTender.quantity);
    expect(Date.parse(submittedRequest?.deadline ?? '')).not.toBeNaN();
    expect((compiled.querySelector('.submit-button') as HTMLButtonElement).disabled).toBe(true);

    createResult.next(createdTender);
    createResult.complete();
    fixture.detectChanges();

    expect(emittedTenders).toEqual([createdTender]);
  });
});

function setInputValue(container: HTMLElement, selector: string, value: string): void {
  const input = container.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function localDateTimeDaysFromNow(days: number): string {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}
