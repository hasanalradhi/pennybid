import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { filter, finalize, interval } from 'rxjs';

import { Bid, Tender } from '../../models/tender';
import { TenderService } from '../../services/tender';

function apiErrorMessage(error: HttpErrorResponse, fallback: string): string {
  const body: unknown = error.error;

  if (typeof body === 'object' && body !== null) {
    const response = body as { error?: unknown; details?: unknown };

    if (Array.isArray(response.details) && typeof response.details[0] === 'string') {
      return response.details[0];
    }

    if (typeof response.error === 'string') {
      return response.error;
    }
  }

  return fallback;
}

@Component({
  selector: 'app-tender-detail',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './tender-detail.html',
  styleUrl: './tender-detail.css',
})
export class TenderDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tenderService = inject(TenderService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly tenderId = this.route.snapshot.paramMap.get('id')?.trim() ?? '';

  protected readonly tender = signal<Tender | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly isRefreshing = signal(false);
  protected readonly refreshWarning = signal<string | null>(null);
  protected readonly lastUpdated = signal<Date | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly pendingBidId = signal<string | null>(null);
  protected readonly submissionError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly sortedBids = computed(() =>
    [...(this.tender()?.bids ?? [])].sort((first, second) => first.amount - second.amount),
  );
  protected readonly bidForm = this.formBuilder.group({
    vendorName: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100),
    ]),
    amount: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
  });

  ngOnInit(): void {
    this.loadTender();
    this.startPolling();
  }

  protected loadTender(): void {
    if (!this.tenderId) {
      this.isLoading.set(false);
      this.loadError.set('The tender address is invalid.');
      return;
    }

    this.fetchTender(this.tender() === null);
  }

  protected isPendingBid(bid: Bid): boolean {
    return bid.id === this.pendingBidId();
  }

  private startPolling(): void {
    if (!this.tenderId) {
      return;
    }

    interval(3000)
      .pipe(
        filter(() => !this.isLoading() && !this.isRefreshing() && !this.isSubmitting()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.fetchTender(false));
  }

  private fetchTender(isInitialLoad: boolean): void {
    if (isInitialLoad) {
      this.isLoading.set(true);
      this.loadError.set(null);
    } else {
      this.isRefreshing.set(true);
      this.refreshWarning.set(null);
    }

    this.tenderService
      .getTender(this.tenderId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading.set(false);
          this.isRefreshing.set(false);
        }),
      )
      .subscribe({
        next: (tender) => {
          this.tender.set(tender);
          this.lastUpdated.set(new Date());
          this.loadError.set(null);
          this.refreshWarning.set(null);
        },
        error: (error: HttpErrorResponse) => {
          const message = apiErrorMessage(error, 'The tender could not be refreshed.');

          if (this.tender() === null) {
            this.loadError.set(message);
          } else {
            this.refreshWarning.set(`${message} We will try again automatically.`);
          }
        },
      });
  }

  protected submitBid(): void {
    const tender = this.tender();

    if (!tender || tender.status !== 'Open') {
      return;
    }

    if (this.bidForm.invalid) {
      this.bidForm.markAllAsTouched();
      return;
    }

    const value = this.bidForm.getRawValue();
    if (value.amount === null) {
      return;
    }

    this.isSubmitting.set(true);
    this.submissionError.set(null);
    this.successMessage.set(null);

    const pendingBid: Bid = {
      id: `pending-${Date.now()}`,
      tenderId: tender.id,
      vendorName: value.vendorName.trim(),
      amount: value.amount,
      submittedAt: new Date().toISOString(),
    };
    const previousTender = tender;

    this.pendingBidId.set(pendingBid.id);
    this.tender.set({
      ...tender,
      lowestBid:
        tender.lowestBid === null ? pendingBid.amount : Math.min(tender.lowestBid, pendingBid.amount),
      bidsCount: tender.bidsCount + 1,
      bids: [pendingBid, ...(tender.bids ?? [])],
    });

    this.tenderService
      .submitBid(tender.id, {
        vendorName: pendingBid.vendorName,
        amount: value.amount,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSubmitting.set(false);
          this.pendingBidId.set(null);
        }),
      )
      .subscribe({
        next: ({ bid, tender: updatedTender }) => {
          const currentBids = this.tender()?.bids ?? [];
          this.tender.set({
            ...updatedTender,
            bids: [
              bid,
              ...currentBids.filter(
                (existingBid) => existingBid.id !== pendingBid.id && existingBid.id !== bid.id,
              ),
            ],
          });
          this.lastUpdated.set(new Date());
          this.successMessage.set('Your bid was submitted successfully.');
          this.bidForm.controls.amount.reset();
        },
        error: (error: HttpErrorResponse) => {
          this.tender.set(previousTender);
          this.submissionError.set(
            apiErrorMessage(error, 'Your bid could not be submitted. Please try again.'),
          );
        },
      });
  }
}
