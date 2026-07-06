import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoListItemDto } from '../../models/api-models';

@Component({
  selector: 'app-pedido-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container">
      <table class="pedido-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Data</th>
            <th>Status</th>
            <th>Total</th>
            <th class="sr-only">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let pedido of pedidos">
            <td>{{ pedido.id }}</td>
            <td>{{ pedido.pessoaNome }}</td>
            <td>{{ pedido.dataCriacao | date:'dd/MM/yyyy HH:mm' }}</td>
            <td>
              <span class="status-badge" [class]="'status-' + pedido.status.toLowerCase()">
                {{ pedido.status }}
              </span>
            </td>
            <td>{{ pedido.valorTotalPedido | currency:'BRL' }}</td>
            <td>
              <button
                type="button"
                class="btn-link"
                (click)="view.emit(pedido.id)"
                [attr.aria-label]="'Visualizar pedido ' + pedido.id"
              >
                Ver detalhes
              </button>
            </td>
          </tr>
          <tr *ngIf="!pedidos || pedidos.length === 0">
            <td colspan="6" class="empty-message">Nenhum pedido encontrado</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-container {
      overflow-x: auto;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .pedido-table {
      width: 100%;
      border-collapse: collapse;
      background-color: white;
    }

    .pedido-table thead {
      background-color: #f8f9fa;
      border-bottom: 2px solid #dee2e6;
    }

    .pedido-table th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #495057;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .pedido-table tbody tr {
      border-bottom: 1px solid #dee2e6;
      transition: background-color 0.2s ease;
    }

    .pedido-table tbody tr:hover {
      background-color: #f8f9fa;
    }

    .pedido-table tbody tr:last-child {
      border-bottom: none;
    }

    .pedido-table td {
      padding: 1rem;
      color: #212529;
      font-size: 0.9375rem;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8125rem;
      font-weight: 500;
      text-transform: capitalize;
    }

    .btn-link {
      background: none;
      border: none;
      color: #0d6efd;
      cursor: pointer;
      padding: 0;
      font-weight: 600;
    }

    .btn-link:hover,
    .btn-link:focus {
      text-decoration: underline;
      outline: none;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }

    .status-created {
      background-color: #cfe2ff;
      color: #084298;
    }

    .status-paid {
      background-color: #d1e7dd;
      color: #0f5132;
    }

    .status-cancelled {
      background-color: #f8d7da;
      color: #842029;
    }

    .empty-message {
      text-align: center;
      color: #6c757d;
      font-style: italic;
      padding: 2rem !important;
    }

    @media (max-width: 768px) {
      .pedido-table th,
      .pedido-table td {
        padding: 0.75rem 0.5rem;
        font-size: 0.875rem;
      }

      .status-badge {
        font-size: 0.75rem;
        padding: 0.2rem 0.5rem;
      }
    }
  `]
})
export class PedidoTableComponent {
  @Input() pedidos: PedidoListItemDto[] = [];
  @Output() view = new EventEmitter<string>();
}
