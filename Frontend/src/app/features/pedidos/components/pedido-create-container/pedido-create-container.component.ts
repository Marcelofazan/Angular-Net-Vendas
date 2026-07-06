import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PessoaListItemDto } from '../../../../shared/models/pessoa-models';
import { CreatePedidoRequest, ProdutoListItemDto } from '../../../../shared/models/api-models';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { PedidoService } from '../../services/pedido.service';
import { PessoaSearchTypeaheadComponent } from '../pessoa-search-typeahead/pessoa-search-typeahead.component';
import { ProdutoSearchTypeaheadComponent } from '../produto-search-typeahead/produto-search-typeahead.component';

@Component({
  selector: 'app-pedido-create-container',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PessoaSearchTypeaheadComponent, ProdutoSearchTypeaheadComponent],
  template: `
    <div class="pedido-create-container">
      <h2>Criar Novo Pedido</h2>

      <form [formGroup]="pedidoForm" novalidate>
        <section>
          <h3>Informações do Cliente</h3>
          <app-pessoa-search-typeahead
            (pessoaSelected)="onPessoaSelected($event)"
            (pessoaCleared)="onPessoaCleared()">
          </app-pessoa-search-typeahead>

          <div *ngIf="selectedPessoa" class="selected-pessoa">
            <div>
              <span class="pessoa-nome">{{ selectedPessoa.nome }}</span>
              <div class="pessoa-meta">
                <span>{{ selectedPessoa.cpfCnpj }}</span>
                <span>{{ selectedPessoa.email }}</span>
              </div>
            </div>
            <button type="button" class="btn-link" (click)="clearSelectedPessoa()">Trocar cliente</button>
          </div>

          <div *ngIf="formSubmitted && pedidoForm.get('pessoaId')?.invalid" class="field-error">
            Selecione um cliente válido.
          </div>
        </section>

        <section>
          <h3>Adicionar Itens</h3>

          <app-produto-search-typeahead
            (produtoSelected)="onProdutoSelected($event)">
          </app-produto-search-typeahead>

          <p class="section-hint">Selecione produtos para compor o pedido. Quantidades respeitam o estoque atual.</p>

          <div class="pedido-items" *ngIf="items.length > 0; else emptyItems">
            <table class="items-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>SKU</th>
                  <th>Preço Unit.</th>
                  <th>Quantidade</th>
                  <th>Total</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody formArrayName="items">
                <tr *ngFor="let item of items.controls; let i = index" [formGroupName]="i">
                  <td>
                    <div class="produto-nome">{{ item.get('produtoNome')?.value }}</div>
                    <div class="stock-helper">Disponível: {{ item.get('availableStock')?.value }}</div>
                  </td>
                  <td>{{ item.get('sku')?.value }}</td>
                  <td>{{ item.get('precoUnitario')?.value | currency:'BRL' }}</td>
                  <td>
                    <input
                      type="number"
                      formControlName="quantidade"
                      min="1"
                      [max]="item.get('availableStock')?.value || null"
                      class="quantidade-input"
                      (change)="onQuantityBlur(i)"
                      (blur)="onQuantityBlur(i)">
                    <div *ngIf="formSubmitted && item.get('quantidade')?.invalid" class="field-error">
                      Quantidade deve estar entre 1 e {{ item.get('availableStock')?.value }}.
                    </div>
                  </td>
                  <td>{{ getItemTotal(i) | currency:'BRL' }}</td>
                  <td>
                    <button type="button" (click)="removeItem(i)" class="btn-remove">Remover</button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="pedido-total">
              <strong>Total do Pedido: {{ getPedidoTotal() | currency:'BRL' }}</strong>
            </div>
          </div>

          <ng-template #emptyItems>
            <div class="empty-items">
              Nenhum produto selecionado até o momento.
            </div>
          </ng-template>
        </section>

        <div class="form-actions">
          <button
            type="button"
            (click)="submitPedido()"
            [disabled]="isSubmitting || items.length === 0 || pedidoForm.invalid"
            class="btn-primary">
            {{ isSubmitting ? 'Processando...' : 'Criar Pedido' }}
          </button>
          <button type="button" (click)="cancelPedido()" class="btn-secondary">
            Limpar
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .pedido-create-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h2 {
      margin-bottom: 2rem;
      color: #333;
    }

    h3 {
      margin-top: 2rem;
      margin-bottom: 1rem;
      color: #555;
    }

    section {
      margin-bottom: 2rem;
    }

    .btn-link {
      background: none;
      border: none;
      color: #0d6efd;
      cursor: pointer;
      padding: 0;
      font-weight: 600;
    }

    .btn-link:hover {
      text-decoration: underline;
    }

    .selected-pessoa {
      margin-top: 1rem;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .pessoa-nome {
      font-weight: 600;
      color: #212529;
    }

    .pessoa-meta {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      font-size: 0.875rem;
      color: #6c757d;
      margin-top: 0.25rem;
    }

    .section-hint {
      margin: 0.75rem 0 0;
      color: #6c757d;
      font-size: 0.9375rem;
    }

    .pedido-items {
      margin-top: 1.5rem;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
      background-color: #fff;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    }

    .items-table th,
    .items-table td {
      padding: 0.85rem;
      text-align: left;
      border-bottom: 1px solid #e9ecef;
      vertical-align: top;
    }

    .items-table th {
      background-color: #f1f3f5;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.8125rem;
      letter-spacing: 0.02em;
    }

    .produto-nome {
      font-weight: 500;
      color: #212529;
    }

    .stock-helper {
      margin-top: 0.35rem;
      font-size: 0.8125rem;
      color: #6c757d;
    }

    .quantidade-input {
      width: 90px;
      padding: 0.4rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
    }

    .btn-remove {
      padding: 0.45rem 0.9rem;
      background-color: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .btn-remove:hover {
      background-color: #c82333;
    }

    .pedido-total {
      text-align: right;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 6px;
      font-size: 1.05rem;
      font-weight: 600;
      color: #212529;
    }

    .empty-items {
      margin-top: 1.5rem;
      padding: 1.5rem;
      border: 2px dashed #ced4da;
      border-radius: 6px;
      text-align: center;
      color: #6c757d;
      font-style: italic;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn-primary {
      padding: 0.85rem 1.75rem;
      background-color: #0d6efd;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0b5ed7;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      padding: 0.85rem 1.5rem;
      background-color: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
    }

    .field-error {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #b02a37;
    }

    @media (max-width: 768px) {
      .form-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .items-table {
        font-size: 0.875rem;
      }
    }
  `]
})
export class PedidoCreateContainerComponent implements OnInit {
  pedidoForm!: FormGroup;
  formSubmitted = false;
  isSubmitting = false;
  selectedPessoa: PessoaListItemDto | null = null;

  @ViewChild(PessoaSearchTypeaheadComponent) private pessoaLookup?: PessoaSearchTypeaheadComponent;

  constructor(
    private readonly fb: FormBuilder,
    private readonly pedidoService: PedidoService,
    private readonly router: Router,
    private readonly feedback: FeedbackService
  ) {}

  ngOnInit(): void {
    this.pedidoForm = this.fb.group({
      pessoaId: ['', Validators.required],
      items: this.fb.array([])
    });
  }

  get items(): FormArray<FormGroup> {
    return this.pedidoForm.get('items') as FormArray<FormGroup>;
  }

  onPessoaSelected(pessoa: PessoaListItemDto): void {
    this.selectedPessoa = pessoa;
    this.pedidoForm.patchValue({ pessoaId: pessoa.id });
    this.feedback.clear();
  }

  onPessoaCleared(): void {
    if (!this.selectedPessoa && !this.pedidoForm.get('pessoaId')?.value) {
      return;
    }
    this.selectedPessoa = null;
    this.pedidoForm.patchValue({ pessoaId: '' });
  }

  clearSelectedPessoa(): void {
    this.selectedPessoa = null;
    this.pedidoForm.patchValue({ pessoaId: '' });
    this.pessoaLookup?.clearSelection();
  }

  onProdutoSelected(produto: ProdutoListItemDto): void {
    this.feedback.clear();

    const availableStockRaw = Number(produto.estoque ?? 0);
    const availableStock = Number.isFinite(availableStockRaw) ? Math.max(0, Math.floor(availableStockRaw)) : 0;

    if (availableStock <= 0) {
      this.feedback.error('Produto selecionado está sem estoque disponível.');
      return;
    }

    const existingIndex = this.items.controls.findIndex(ctrl => ctrl.get('produtoId')?.value === produto.id);

    if (existingIndex >= 0) {
      const itemGroup = this.items.at(existingIndex);
      const currentQty = Number(itemGroup.get('quantidade')?.value ?? 0);
      const newQty = Math.min(currentQty + 1, availableStock);
      itemGroup.patchValue({ quantidade: newQty });
      return;
    }

    const quantidadeValidators = [Validators.required, Validators.min(1), Validators.max(availableStock)];

    const itemGroup = this.fb.group({
      produtoId: [produto.id, Validators.required],
      produtoNome: [produto.nome],
      sku: [produto.sku],
      precoUnitario: [Number(produto.preco ?? 0)],
      quantidade: [1, quantidadeValidators],
      availableStock: [availableStock]
    });

    this.items.push(itemGroup);
  }

  onQuantityBlur(index: number): void {
    const itemGroup = this.items.at(index);
    const quantidadeControl = itemGroup.get('quantidade');
    const maxStock = Number(itemGroup.get('availableStock')?.value ?? 0);

    if (!quantidadeControl) {
      return;
    }

    let value = Number(quantidadeControl.value ?? 0);

    if (!Number.isFinite(value) || value < 1) {
      value = 1;
    }

    if (maxStock > 0 && value > maxStock) {
      value = maxStock;
    }

    quantidadeControl.setValue(value, { emitEvent: false });
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  getItemTotal(index: number): number {
    const item = this.items.at(index);
    const quantidade = Number(item.get('quantidade')?.value ?? 0);
    const precoUnitario = Number(item.get('precoUnitario')?.value ?? 0);
    return quantidade * precoUnitario;
  }

  getPedidoTotal(): number {
    return this.items.controls.reduce((total, _, index) => total + this.getItemTotal(index), 0);
  }

  submitPedido(): void {
    this.formSubmitted = true;
    this.feedback.clear();

    if (this.pedidoForm.invalid || this.items.length === 0) {
      return;
    }

    const pessoaId = (this.pedidoForm.get('pessoaId')?.value as string)?.trim();
    if (!pessoaId) {
      return;
    }

    const payload: CreatePedidoRequest = {
      pessoaId,
      items: this.items.controls.map(control => ({
        produtoId: control.get('produtoId')?.value,
        quantidade: Number(control.get('quantidade')?.value ?? 0)
      }))
    };

    this.isSubmitting = true;

    this.pedidoService.createPedido(payload).subscribe({
      next: pedidoId => {
        this.isSubmitting = false;
        this.feedback.success(`Pedido criado com sucesso. Código: ${pedidoId}`);
        this.resetForm();
        this.router.navigate(['/pedidos', pedidoId]);
      },
      error: error => {
        this.isSubmitting = false;
        const message = error?.message ?? 'Falha ao criar pedido.';
        this.feedback.error(message);
      }
    });
  }

  cancelPedido(): void {
    this.feedback.clear();
    this.resetForm();
  }

  private resetForm(): void {
    this.formSubmitted = false;
    this.pedidoForm.reset({ pessoaId: '' });
    while (this.items.length) {
      this.items.removeAt(0);
    }
    this.selectedPessoa = null;
    this.pessoaLookup?.clearSelection();
  }
}
