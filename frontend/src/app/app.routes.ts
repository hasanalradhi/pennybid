import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tenders/:id',
    loadComponent: () =>
      import('./components/tender-detail/tender-detail').then(
        ({ TenderDetail }) => TenderDetail,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./components/tender-dashboard/tender-dashboard').then(
        ({ TenderDashboard }) => TenderDashboard,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
