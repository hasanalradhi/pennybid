import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { CreateTenderRequest, Tender } from '../../models/tender';
import { TenderService } from '../../services/tender';

function futureDateValidator(control: AbstractControl<string>): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const deadline = new Date(control.value);
  return Number.isNaN(deadline.getTime()) || deadline.getTime() <= Date.now()
    ? { futureDate: true }
    : null;
}

function isApiError(value: unknown): value is { error?: string; details?: string[] } {
  return typeof value === 'object' && value !== null;
}

@Component({
  selector: 'app-create-tender-form',
  imports: [ReactiveFormsModule],
  templateUrl: './create-tender-form.html',
  styleUrl: './create-tender-form.css',
})
export class CreateTenderForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly tenderService = inject(TenderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly tenderCreated = output<Tender>();
  readonly cancelled = output<void>();

  protected readonly isSubmitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly minimumDeadline = this.formatLocalDateTime(new Date());
  protected readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(1000)]],
    quantity: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    deadline: ['', [Validators.required, futureDateValidator]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    this.isSubmitting.set(true);
    this.serverError.set(null);

    const value = this.form.getRawValue();
    const request: CreateTenderRequest = {
      ...value,
      deadline: new Date(value.deadline).toISOString(),
    };

    this.tenderService
      .createTender(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (tender) => this.tenderCreated.emit(tender),
        error: (error: HttpErrorResponse) => {
          const body: unknown = error.error;
          const details = isApiError(body) && Array.isArray(body.details) ? body.details : [];
          this.serverError.set(
            details[0] ||
              (isApiError(body) && typeof body.error === 'string' ? body.error : null) ||
              'The tender could not be created. Please try again.',
          );
        },
      });
  }

  protected cancel(): void {
    if (!this.isSubmitting()) {
      this.cancelled.emit();
    }
  }

  private formatLocalDateTime(date: Date): string {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 16);
  }
}
