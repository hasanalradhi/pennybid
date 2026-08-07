import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Tender } from '../../models/tender';
import { TenderService } from '../../services/tender';
import { CreateTenderForm } from '../create-tender-form/create-tender-form';

@Component({
  selector: 'app-tender-dashboard',
  imports: [CreateTenderForm, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './tender-dashboard.html',
  styleUrl: './tender-dashboard.css',
})
export class TenderDashboard implements OnInit {
  private readonly tenderService = inject(TenderService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tenders = signal<Tender[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isCreateFormOpen = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly openCount = computed(
    () => this.tenders().filter((tender) => tender.status === 'Open').length,
  );
  protected readonly totalBids = computed(() =>
    this.tenders().reduce((total, tender) => total + tender.bidsCount, 0),
  );
  protected readonly lowestActiveBid = computed(() => {
    const activeBids = this.tenders()
      .filter((tender) => tender.status === 'Open' && tender.lowestBid !== null)
      .map((tender) => tender.lowestBid as number);

    return activeBids.length > 0 ? Math.min(...activeBids) : null;
  });

  ngOnInit(): void {
    this.loadTenders();
  }

  protected loadTenders(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.tenderService
      .getTenders()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (tenders) => this.tenders.set(tenders),
        error: () => {
          this.errorMessage.set(
            'We could not load the tenders. Make sure the backend is running and try again.',
          );
        },
      });
  }

  protected toggleCreateForm(): void {
    this.isCreateFormOpen.update((isOpen) => !isOpen);
    this.successMessage.set(null);
  }

  protected handleTenderCreated(tender: Tender): void {
    this.tenders.update((tenders) => [tender, ...tenders]);
    this.isCreateFormOpen.set(false);
    this.successMessage.set(`“${tender.title}” was created and is now open for bidding.`);
  }
}
