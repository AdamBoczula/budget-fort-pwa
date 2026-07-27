import { Component } from '@angular/core';
import { CategoriesQuickAddComponent } from '../categories-quick-add/categories-quick-add';
import { HeaderComponent } from '../header/header';
import { LastTransactionComponent } from '../last-transaction/last-transaction';

@Component({
  selector: 'transaction-home-page-screen',
  imports: [
    CategoriesQuickAddComponent,
    HeaderComponent,
    LastTransactionComponent,
  ],
  template: `
    <transaction-header />
    <transaction-categories-quick-add />
    <transaction-last-transaction />

    <!-- BOTTOM SHEET INITIALIZATION -->
    <!-- INSIDE BOTTOM SHEET BODY - <transaction-transaction-form /> -->
  `,
  styleUrl: './home-screen.css',
})
export class HomePageScreen {}
