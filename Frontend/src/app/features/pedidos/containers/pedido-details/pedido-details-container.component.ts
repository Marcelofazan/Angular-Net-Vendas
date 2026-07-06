import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PedidoDetailsDto } from '../../../../shared/models/api-models';
import { PedidoService } from '../../services/pedido.service';
import { PedidoDetailsComponent } from '../../components/pedido-details/pedido-details.component';
import { FeedbackService } from '../../../../core/services/feedback.service';

@Component({
  selector: 'app-pedido-details-container',
  standalone: true,
  imports: [CommonModule, RouterModule, PedidoDetailsComponent],
  template: `
    <div class="details-container">
      <a routerLink="/pedidos" class="back-link">&larr; Voltar para lista</a>

      <ng-container *ngIf="isLoading()">
        <div class="loading" role="status" aria-live="polite">Carregando detalhes do pedido...</div>
      </ng-container>

      <ng-container *ngIf="errorMessage() as message">
        <div class="error" role="alert">
          {{ message }}
        </div>
      </ng-container>

      <ng-container *ngIf="pedido() as loadedPedido">
        <app-pedido-details [pedido]="loadedPedido"></app-pedido-details>
      </ng-container>
    </div>
  `,
  styles: [`
    .details-container {
      max-width: 1100px;
      margin: 0 auto;
      display: grid;
      gap: 1.5rem;
    }

    .back-link {
      color: #0d6efd;
      text-decoration: none;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .back-link:hover,
    .back-link:focus {
      text-decoration: underline;
      outline: none;
    }

    .loading {
      background: #fff3cd;
      border: 1px solid #ffecb5;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      color: #664d03;
    }

    .error {
      background: #f8d7da;
      border: 1px solid #f5c2c7;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      color: #842029;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PedidoDetailsContainerComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly pedidoService = inject(PedidoService);
  private readonly feedback = inject(FeedbackService);

  // Simple signal-based state to avoid unnecessary templates logic
  state = signal<
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'loaded'; pedido: PedidoDetailsDto }
  >({ status: 'loading' });

  private readonly vm = computed(() => this.state());
  readonly isLoading = computed(() => {
    const snapshot = this.vm();
    return snapshot.status === 'loading';
  });

  readonly errorMessage = computed(() => {
    const snapshot = this.vm();
    return snapshot.status === 'error' ? snapshot.message : null;
  });

  readonly pedido = computed(() => {
    const snapshot = this.vm();
    return snapshot.status === 'loaded' ? snapshot.pedido : null;
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map(params => params.get('id')),
        tap(() => this.state.set({ status: 'loading' })),
        switchMap(pedidoId => {
          if (!pedidoId) {
            return of<PedidoDetailsDto | null>(null);
          }
          return this.pedidoService.getPedidoById(pedidoId).pipe(
            catchError(() => {
              this.state.set({ status: 'error', message: 'Não foi possível carregar os detalhes do pedido.' });
              this.feedback.error('Não foi possível carregar os detalhes do pedido.');
              return of(null);
            })
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe(pedido => {
        if (pedido) {
          this.state.set({ status: 'loaded', pedido });
        } else if (this.state().status === 'loading') {
          this.state.set({ status: 'error', message: 'Pedido não encontrado.' });
          this.feedback.error('Pedido não encontrado.');
        }
      });
  }
}