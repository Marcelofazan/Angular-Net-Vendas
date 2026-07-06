import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PedidoDetailsDto } from '../../../../shared/models/api-models';

@Component({
  selector: 'app-pedido-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section *ngIf="pedido" class="pedido-details" aria-labelledby="pedido-details-heading">
      <h2 id="pedido-details-heading">Pedido {{ pedido.id }}</h2>

      <div class="summary">
        <div>
          <span class="label">Cliente:</span>
          <strong>{{ pedido.pessoaNome }}</strong>
        </div>
        <div>
          <span class="label">CpfCnpj:</span>
          <span>{{ pedido.pessoaCpfCnpj }}</span>
        </div>
        <div>
          <span class="label">Status:</span>
          <span class="status-badge" [class]="'status-' + pedido.status.toLowerCase()">{{ pedido.status }}</span>
        </div>
        <div>
          <span class="label">Criado em:</span>
          <span>{{ pedido.dataCriacao | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
        <div>
          <span class="label">Total:</span>
          <strong>{{ pedido.valorTotalPedido | currency:'BRL' }}</strong>
        </div>
      </div>

      <table class="items-table" aria-label="Itens do pedido">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Preço Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of pedido.items">
            <td>
              <div class="produto-nome">{{ item.produtoNome }}</div>
              <div class="produto-meta">Código: {{ item.produtoId }}</div>
            </td>
            <td>{{ item.quantidade }}</td>
            <td>{{ item.precoUnitario | currency:'BRL' }}</td>
            <td>{{ item.valorTotalUnitario | currency:'BRL' }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  `,
  styles: [`
    .pedido-details {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      padding: 2rem;
      display: grid;
      gap: 2rem;
    }

    h2 {
      margin: 0;
      color: #212529;
      font-size: 1.5rem;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .label {
      color: #6c757d;
      font-size: 0.875rem;
      display: block;
      margin-bottom: 0.25rem;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.875rem;
      text-transform: capitalize;
    }

    .status-created {
      background-color: #d0ebff;
      color: #0b7285;
    }

    .status-paid {
      background-color: #d1e7dd;
      color: #0f5132;
    }

    .status-cancelled {
      background-color: #ffe3e3;
      color: #c92a2a;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      background-color: #fff;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .items-table th,
    .items-table td {
      text-align: left;
      padding: 0.85rem;
      border-bottom: 1px solid #dee2e6;
    }

    .items-table th {
      background-color: #f8f9fa;
      font-size: 0.875rem;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .produto-nome {
      font-weight: 600;
      color: #212529;
    }

    .produto-meta {
      margin-top: 0.25rem;
      font-size: 0.8125rem;
      color: #6c757d;
    }

    @media (max-width: 768px) {
      .order-details {
        padding: 1.5rem;
      }

      .items-table {
        font-size: 0.875rem;
      }
    }
  `]
})
export class PedidoDetailsComponent {
  @Input() pedido: PedidoDetailsDto | null = null;
}