import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  BidSubmissionResponse,
  CreateTenderRequest,
  SubmitBidRequest,
  Tender,
} from '../models/tender';

@Service()
export class TenderService {
  private readonly http = inject(HttpClient);
  private readonly tendersUrl = `${environment.apiUrl}/tenders`;

  getTenders(): Observable<Tender[]> {
    return this.http.get<Tender[]>(this.tendersUrl);
  }

  getTender(id: string): Observable<Tender> {
    return this.http.get<Tender>(`${this.tendersUrl}/${id}`);
  }

  createTender(request: CreateTenderRequest): Observable<Tender> {
    return this.http.post<Tender>(this.tendersUrl, request);
  }

  submitBid(tenderId: string, request: SubmitBidRequest): Observable<BidSubmissionResponse> {
    return this.http.post<BidSubmissionResponse>(`${this.tendersUrl}/${tenderId}/bids`, request);
  }
}
