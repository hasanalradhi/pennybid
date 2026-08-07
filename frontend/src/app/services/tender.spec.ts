import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CreateTenderRequest, SubmitBidRequest, Tender } from '../models/tender';
import { TenderService } from './tender';

describe('TenderService', () => {
  let service: TenderService;
  let httpTesting: HttpTestingController;

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
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TenderService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('fetches all tenders', () => {
    service.getTenders().subscribe((result) => expect(result).toEqual([tender]));

    const request = httpTesting.expectOne('http://localhost:3000/api/tenders');
    expect(request.request.method).toBe('GET');
    request.flush([tender]);
  });

  it('fetches one tender', () => {
    service.getTender(tender.id).subscribe((result) => expect(result).toEqual(tender));

    const request = httpTesting.expectOne(
      'http://localhost:3000/api/tenders/507f1f77bcf86cd799439011',
    );
    expect(request.request.method).toBe('GET');
    request.flush(tender);
  });

  it('creates a tender', () => {
    const payload: CreateTenderRequest = {
      title: tender.title,
      description: tender.description,
      quantity: tender.quantity,
      deadline: tender.deadline,
    };

    service.createTender(payload).subscribe((result) => expect(result).toEqual(tender));

    const request = httpTesting.expectOne('http://localhost:3000/api/tenders');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(tender);
  });

  it('submits a bid', () => {
    const payload: SubmitBidRequest = { amount: 119000, vendorName: 'Acme' };
    const bid = {
      id: '507f191e810c19729de860ea',
      tenderId: tender.id,
      ...payload,
      submittedAt: '2026-08-03T09:00:00.000Z',
    };

    service
      .submitBid(tender.id, payload)
      .subscribe((result) => expect(result).toEqual({ message: 'Success', bid, tender }));

    const request = httpTesting.expectOne(
      'http://localhost:3000/api/tenders/507f1f77bcf86cd799439011/bids',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ message: 'Success', bid, tender });
  });
});
