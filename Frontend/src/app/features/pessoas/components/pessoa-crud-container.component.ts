import { Component, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PessoaService, PessoaListFilters, PessoaSortField, SortDirection } from '../services/pessoa.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { PessoaListItemDto, PessoaFormData } from '../../../shared/models/pessoa-models';
import { PagedResult } from '../../../shared/models/api-models';
import { BehaviorSubject, switchMap, map, catchError, of, debounceTime, distinctUntilChanged, take, EMPTY } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type PessoasQueryState = {
  pageNumber: number;
  pageSize: number;
  searchTerm: string;
  sortField: PessoaSortField;
  sortDirection: SortDirection;
  emailFilter: string;
  cpfCnpjFilter: string;
  createdFrom: string | null;
  createdTo: string | null;
};

type PessoaFiltersFormValue = {
  sortField: PessoaSortField;
  sortDirection: SortDirection;
  email: string;
  cpfCnpj: string;
  createdFrom: string;
  createdTo: string;
};

@Component({
  selector: 'app-pessoa-crud-container',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginationComponent],
  template: `
    <div class="pessoa-crud-container">
      <div class="header-section">
        <h2>Gestão de Clientes</h2>
        <button class="btn btn-primary" (click)="openCreateModal()">
          + Novo Cliente
        </button>
      </div>

      <!-- <div class="search-section">
        <label for="pessoa-search" class="sr-only">Buscar cliente</label>
        <input
          id="pessoa-search"
          type="search"
          placeholder="pesquisar por nome, email ou documento..."
          class="search-input"
          aria-label="Buscar cliente"
          [formControl]="searchControl"
        />
      </div> -->

      <div class="filters-section" [formGroup]="filtersForm">
        <div class="filters-grid">
          <div class="filter-group">
            <!-- <label for="pessoa-search" class="sr-only">Buscar cliente</label> -->
            <label for="pessoa-search">Pesquisa</label>
            <input
              id="pessoa-search"
              type="search"
              placeholder="pesquisar por nome, email ou documento..."
              class="search-input"
              aria-label="Buscar cliente"
              [formControl]="searchControl"
            />
          </div>


          <div class="filter-group">
            <label for="sortField">Ordenação</label>
            <select id="sortField" formControlName="sortField" class="form-control">
              <option value="dataCriacao">Criado em</option>
              <option value="nome">Nome</option>
              <option value="email">Email</option>
              <option value="cpfCnpj">CpfCnpj</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="sortDirection">Direção</label>
            <select id="sortDirection" formControlName="sortDirection" class="form-control">
              <option value="desc">Mais recentes</option>
              <option value="asc">Mais antigos</option>
            </select>
          </div>

          <!-- <div class="filter-group">
            <label for="emailFilter">Email</label>
            <input
              id="emailFilter"
              type="email"
              formControlName="email"
              placeholder="cliente@exemplo.com"
              class="form-control">
          </div> -->

          <!-- <div class="filter-group">
            <label for="cpfCnpjFilter">CpfCnpj</label>
            <input
              id="cpfCnpjFilter"
              type="text"
              formControlName="cpfCnpj"
              placeholder="Somente números"
              class="form-control">
          </div> -->

          <!-- <div class="filter-group">
            <label for="createdFrom">Criado a partir de</label>
            <input id="createdFrom" type="date" formControlName="createdFrom" class="form-control">
          </div> -->

          <!-- <div class="filter-group">
            <label for="createdTo">Criado até</label>
            <input id="createdTo" type="date" formControlName="createdTo" class="form-control">
          </div> -->
        </div>

        <div class="filters-actions">
          <button
            type="button"
            class="btn btn-link"
            (click)="clearFilters()"
            [disabled]="!hasActiveFilters()">
            Limpar filtros
          </button>
        </div>
      </div>

      <div *ngIf="dateRangeError()" class="filter-error">{{ dateRangeError() }}</div>

      <div *ngIf="loading()" class="loading">Carregando clientes...</div>
      <div *ngIf="error()" class="error">{{ error() }}</div>

      <div *ngIf="!loading() && pessoasResult()">
        <div class="results-summary">
          {{ pessoasResult()!.totalCount || 0 }}
          {{ (pessoasResult()!.totalCount || 0) === 1 ? 'cliente encontrado' : 'clientes encontrados' }}
        </div>
        <div class="table-wrapper">
          <table class="crud-table" role="table" aria-label="Lista de clientes">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Nome</th>
                <th scope="col">Email</th>
                <th scope="col">CpfCnpj</th>
                <th scope="col">Criado em</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let pessoa of pessoasResult()?.items">
                <td data-label="ID">{{ pessoa.id }}</td>
                <td data-label="Nome">{{ pessoa.nome }}</td>
                <td data-label="Email">{{ pessoa.email }}</td>
                <td data-label="cpfCnpj">{{ pessoa.cpfCnpj }}</td>
                <td data-label="Criado em">{{ pessoa.dataCriacao | date:'dd/MM/yyyy HH:mm' }}</td>
                <td class="actions" data-label="Ações">
                  <button
                    type="button"
                    class="action-button edit"
                    (click)="openEditModal(pessoa)"
                    [attr.aria-label]="'Editar cliente ' + pessoa.nome">
                    Editar
                  </button>
                  <button
                    type="button"
                    class="action-button delete"
                    (click)="deletePessoa(pessoa.id)"
                    [attr.aria-label]="'Excluir cliente ' + pessoa.nome">
                    Excluir
                  </button>
                </td>
              </tr>
              <tr *ngIf="(pessoasResult()?.items?.length ?? 0) === 0">
                <td colspan="6" class="empty-message">Nenhum cliente encontrado</td>
              </tr>
            </tbody>
          </table>
        </div>

        <app-pagination
          *ngIf="pessoasResult()"
          [totalPages]="pessoasResult()!.totalPages"
          [currentPage]="pessoasResult()!.pageNumber"
          (pageChange)="onPageChanged($event)">
        </app-pagination>
      </div>

      <div
        class="modal-overlay"
        *ngIf="showModal()"
        (click)="closeModal()"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="isEditMode() ? 'modal-edit-title' : 'modal-create-title'">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 [id]="isEditMode() ? 'modal-edit-title' : 'modal-create-title'">
              {{ isEditMode() ? 'Editar Cliente' : 'Novo Cliente' }}
            </h3>
            <button
              class="close-btn"
              type="button"
              aria-label="Fechar modal"
              (click)="closeModal()"
              (keydown.enter)="closeModal()"
              (keydown.space)="closeModal(); $event.preventDefault()">
              ×
            </button>
          </div>

          <form [formGroup]="pessoaForm" (ngSubmit)="savePessoa()">
            <div class="form-group">
              <label for="nome">Nome *</label>
              <input
                id="nome"
                type="text"
                formControlName="nome"
                class="form-control"
                aria-required="true"
                aria-describedby="nome-error"
                [class.invalid]="pessoaForm.get('nome')?.invalid && pessoaForm.get('nome')?.touched">
              <div
                id="nome-error"
                class="error-message"
                *ngIf="pessoaForm.get('nome')?.invalid && pessoaForm.get('nome')?.touched"
                role="alert">
                Nome é obrigatório
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email *</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-control"
                aria-required="true"
                aria-describedby="email-error"
                [class.invalid]="pessoaForm.get('email')?.invalid && pessoaForm.get('email')?.touched">
              <div
                id="email-error"
                class="error-message"
                *ngIf="pessoaForm.get('email')?.invalid && pessoaForm.get('email')?.touched"
                role="alert">
                Email válido é obrigatório
              </div>
            </div>

            <div class="form-group">
              <label for="cpfCnpj">Documento (CPF/CNPJ) *</label>
              <input
                id="cpfCnpj"
                type="text"
                formControlName="cpfCnpj"
                class="form-control"
                aria-required="true"
                aria-describedby="cpfCnpj-error"
                [class.invalid]="pessoaForm.get('cpfCnpj')?.invalid && pessoaForm.get('cpfCnpj')?.touched">
              <div
                id="cpfCnpj-error"
                class="error-message"
                *ngIf="pessoaForm.get('cpfCnpj')?.invalid && pessoaForm.get('cpfCnpj')?.touched"
                role="alert">
                Documento é obrigatório
              </div>
              <div
                class="error-message"
                *ngIf="documentDuplicateError()"
                role="alert">
                {{ documentDuplicateError() }}
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="pessoaForm.invalid || saving()">
                {{ saving() ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pessoa-crud-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h2 {
      color: #333;
      margin: 0;
      font-size: 1.75rem;
    }

    .search-section {
      margin-bottom: 2rem;
    }

    .search-input {
      width: 100%;
      max-width: 500px;
      padding: 0.75rem 1rem;
      border: 2px solid #dee2e6;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #0d6efd;
    }

    .filters-section {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .filters-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }

    .btn-link {
      background: none;
      border: none;
      color: #0d6efd;
      padding: 0.25rem 0.5rem;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-link:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .filter-error {
      margin: -0.5rem 0 1.5rem;
      color: #dc3545;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .filters-grid {
        grid-template-columns: 1fr;
      }
    }

    .results-summary {
      margin: 1rem 0 0.5rem;
      font-weight: 500;
      color: #495057;
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

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background-color: #0d6efd;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0b5ed7;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #5c636a;
    }

    .loading,
    .error {
      text-align: center;
      padding: 2rem;
      margin: 2rem 0;
    }

    .error {
      color: #dc3545;
      background-color: #f8d7da;
      border-radius: 4px;
    }

    .table-wrapper {
      overflow-x: auto;
      margin: 2rem 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .crud-table {
      width: 100%;
      border-collapse: collapse;
      background-color: white;
    }

    .crud-table thead {
      background-color: #f8f9fa;
      border-bottom: 2px solid #dee2e6;
    }

    .crud-table th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #495057;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .crud-table tbody tr {
      border-bottom: 1px solid #dee2e6;
      transition: background-color 0.2s ease;
    }

    .crud-table tbody tr:hover {
      background-color: #f8f9fa;
    }

    .crud-table td {
      padding: 1rem;
      color: #212529;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-button {
      padding: 0.4rem 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      color: #fff;
      min-width: 84px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    }

    .action-button:focus-visible {
      outline: 2px solid rgba(13, 110, 253, 0.4);
      outline-offset: 2px;
    }

    .action-button.edit {
      background-color: #0d6efd;
    }

    .action-button.edit:hover {
      background-color: #0b5ed7;
      transform: translateY(-1px);
    }

    .action-button.delete {
      background-color: #dc3545;
    }

    .action-button.delete:hover {
      background-color: #bb2d3b;
      transform: translateY(-1px);
    }

    .empty-message {
      text-align: center;
      color: #6c757d;
      font-style: italic;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background-color: white;
      border-radius: 8px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 2rem;
      cursor: pointer;
      color: #6c757d;
      line-height: 1;
      padding: 0;
    }

    .close-btn:hover {
      color: #000;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #495057;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #dee2e6;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.2s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #0d6efd;
    }

    .form-control.invalid {
      border-color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    textarea.form-control {
      resize: vertical;
    }

  `]
})
export class PessoaCrudContainerComponent implements OnInit {
  pessoasResult = signal<PagedResult<PessoaListItemDto> | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  showModal = signal(false);
  isEditMode = signal(false);
  saving = signal(false);
  documentDuplicateError = signal<string | null>(null);
  dateRangeError = signal<string | null>(null);

  private readonly defaultSortField: PessoaSortField = 'dataCriacao';
  private readonly defaultSortDirection: SortDirection = 'desc';
  private readonly defaultPageSize = 10;

  pessoaForm: FormGroup;
  searchControl = new FormControl('');
  filtersForm: FormGroup;
  private querySubject = new BehaviorSubject<PessoasQueryState>({
    pageNumber: 1,
    pageSize: this.defaultPageSize,
    searchTerm: '',
    sortField: this.defaultSortField,
    sortDirection: this.defaultSortDirection,
    emailFilter: '',
    cpfCnpjFilter: '',
    createdFrom: null,
    createdTo: null
  });

  constructor(
    private pessoaService: PessoaService,
    private fb: FormBuilder,
    private destroyRef: DestroyRef
  ) {
    this.pessoaForm = this.fb.group({
      id: [null],
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cpfCnpj: ['', Validators.required]
    });

    this.filtersForm = this.fb.group({
      sortField: [this.defaultSortField],
      sortDirection: [this.defaultSortDirection],
      email: [''],
      cpfCnpj: [''],
      createdFrom: [''],
      createdTo: ['']
    });

    this.pessoaForm.get('cpfCnpj')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.documentDuplicateError()) {
          this.clearDocumentDuplicateError();
        }
      });
  }

  ngOnInit(): void {
    this.searchControl.setValue(this.querySubject.value.searchTerm, { emitEvent: false });

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(searchTerm => {
        this.querySubject.next({
          ...this.querySubject.value,
          searchTerm: searchTerm ?? '',
          pageNumber: 1
        });
      });

    this.filtersForm.valueChanges
      .pipe(
        debounceTime(200),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(values => {
        this.applyFilterChanges(values as Partial<PessoaFiltersFormValue>);
      });

    this.querySubject.pipe(
      switchMap(query => {
        this.loading.set(true);
        this.error.set(null);
        return this.pessoaService.listPessoas(
          query.pageNumber,
          query.pageSize,
          query.searchTerm,
          this.buildFiltersFromQuery(query)
        ).pipe(
          map(result => ({ result, error: null })),
          catchError(err => of({ result: null, error: err.message || 'Erro ao carregar clientes' }))
        );
      })
    ).subscribe(({ result, error }) => {
      this.loading.set(false);
      if (error) {
        this.error.set(error);
      } else {
        this.pessoasResult.set(result);
      }
    });
  }

  onPageChanged(pageNumber: number): void {
    this.querySubject.next({
      ...this.querySubject.value,
      pageNumber
    });
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.pessoaForm.reset({
      id: null,
      nome: '',
      email: '',
      cpfCnpj: ''
    });
    this.clearDocumentDuplicateError();
    this.showModal.set(true);
  }

  openEditModal(pessoa: PessoaListItemDto): void {
    this.isEditMode.set(true);
    this.pessoaService.getPessoaById(pessoa.id).subscribe({
      next: (data) => {
        this.pessoaForm.patchValue({
          ...data,
          document: this.normalizeDocument(data.cpfCnpj)
        });
        this.clearDocumentDuplicateError();
        this.showModal.set(true);
      },
      error: (err) => {
        this.error.set(err.message || 'Erro ao carregar cliente');
      }
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.pessoaForm.reset({
      id: null,
      nome: '',
      email: '',
      cpfCnpj: ''
    });
    this.clearDocumentDuplicateError();
  }

  savePessoa(): void {
    if (this.pessoaForm.invalid) {
      return;
    }

    this.saving.set(true);
    this.clearDocumentDuplicateError();
    this.error.set(null);
    const formData = this.sanitizePessoaData({ ...this.pessoaForm.value });
    const payload: PessoaFormData = {
      nome: formData.nome,
      email: formData.email,
      cpfCnpj: formData.cpfCnpj
    };

    if (!this.isEditMode()) {
      delete formData.id;
    } else if (!formData.id || !formData.id.trim()) {
      this.error.set('Cliente selecionado inválido. Tente novamente.');
      this.saving.set(false);
      return;
    }

    const excludeId = this.isEditMode() ? formData.id : undefined;

    this.pessoaService.isDocumentAvailable(formData.cpfCnpj, excludeId).pipe(
      take(1),
      switchMap(isAvailable => {
        if (!isAvailable) {
          this.setDocumentDuplicateError();
          this.saving.set(false);
          return EMPTY;
        }

        return this.isEditMode()
          ? this.pessoaService.updatePessoa(formData.id!, payload).pipe(map(() => ({ mode: 'update' as const, id: formData.id! })))
          : this.pessoaService.createPessoa(payload).pipe(map(id => ({ mode: 'create' as const, id })));
      })
    ).subscribe({
      next: ({ id }) => {
        this.saving.set(false);
        this.closeModal();
        const fallbackData: PessoaFormData = { ...payload, id };
        this.syncPessoaLocally(id, fallbackData);
        this.refreshList();
      },
      error: (err: any) => {
        this.saving.set(false);
        if (!this.tryHandleServerDuplicate(err)) {
          this.error.set(err?.message || 'Erro ao salvar cliente');
        }
      }
    });
  }

  deletePessoa(id: string): void {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
      return;
    }

    this.pessoaService.deletePessoa(id).subscribe({
      next: () => this.refreshList(),
      error: (err) => this.error.set(err.message || 'Erro ao excluir cliente')
    });
  }

  clearFilters(): void {
    this.filtersForm.reset({
      sortField: this.defaultSortField,
      sortDirection: this.defaultSortDirection,
      email: '',
      cpfCnpj: '',
      createdFrom: '',
      createdTo: ''
    });
    this.dateRangeError.set(null);
  }

  hasActiveFilters(): boolean {
    const query = this.querySubject.value;
    return Boolean(
      query.emailFilter ||
      query.cpfCnpjFilter ||
      query.createdFrom ||
      query.createdTo ||
      query.sortField !== this.defaultSortField ||
      query.sortDirection !== this.defaultSortDirection
    );
  }

  private refreshList(): void {
    this.querySubject.next({ ...this.querySubject.value });
  }

  private applyFilterChanges(filters: Partial<PessoaFiltersFormValue>): void {
    const sortField = (filters.sortField as PessoaSortField) ?? this.defaultSortField;
    const sortDirection = (filters.sortDirection as SortDirection) ?? this.defaultSortDirection;
    const email = (filters.email ?? '').trim();
    const cpfCnpj = this.normalizeDocument(filters.cpfCnpj ?? '');
    const createdFrom = filters.createdFrom || null;
    const createdTo = filters.createdTo || null;

    if (createdFrom && createdTo && createdFrom > createdTo) {
      this.dateRangeError.set('A data inicial não pode ser maior que a data final.');
      return;
    }

    this.dateRangeError.set(null);

    this.querySubject.next({
      ...this.querySubject.value,
      pageNumber: 1,
      sortField,
      sortDirection,
      emailFilter: email,
      cpfCnpjFilter: cpfCnpj,
      createdFrom,
      createdTo
    });
  }

  private buildFiltersFromQuery(query: PessoasQueryState): PessoaListFilters {
    return {
      sortField: query.sortField,
      sortDirection: query.sortDirection,
      email: query.emailFilter || undefined,
      cpfCnpj: query.cpfCnpjFilter || undefined,
      createdFrom: this.normalizeDateBoundary(query.createdFrom, false),
      createdTo: this.normalizeDateBoundary(query.createdTo, true)
    };
  }

  private normalizeDateBoundary(value?: string | null, endOfDay = false): string | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }

    return date.toISOString();
  }

  private sanitizePessoaData(data: PessoaFormData): PessoaFormData {
    const sanitizedName = (data.nome ?? '').trim();
    const sanitizedEmail = (data.email ?? '').trim().toLowerCase();
    const sanitizedDocument = this.normalizeDocument(data.cpfCnpj);
    const sanitizedId = this.normalizeId(data.id);

    return {
      ...data,
      id: sanitizedId,
      nome: sanitizedName,
      email: sanitizedEmail,
      cpfCnpj: sanitizedDocument
    };
  }

  private normalizeId(value?: string | null): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    const normalized = String(value).trim();
    if (!normalized) {
      return undefined;
    }

    const lower = normalized.toLowerCase();
    return lower === 'null' || lower === 'undefined' ? undefined : normalized;
  }

  private normalizeDocument(value: string): string {
    return (value ?? '').replace(/\D+/g, '');
  }

  private setDocumentDuplicateError(): void {
    const message = 'Já existe um cliente com este CPF/CNPJ.';
    this.documentDuplicateError.set(message);
    const control = this.pessoaForm.get('cpfCnpj');
    if (control) {
      const errors = { ...(control.errors ?? {}), duplicate: true };
      control.setErrors(errors);
      control.markAsTouched();
    }
  }

  private clearDocumentDuplicateError(): void {
    if (this.documentDuplicateError()) {
      this.documentDuplicateError.set(null);
    }
    const control = this.pessoaForm.get('cpfCnpj');
    if (control && control.errors) {
      const { duplicate, ...others } = control.errors;
      control.setErrors(Object.keys(others).length ? others : null);
    }
  }

  private tryHandleServerDuplicate(err: any): boolean {
    if (!err) {
      return false;
    }

    const httpError = err as HttpErrorResponse;
    const apiMessage = typeof httpError.error?.mensagem === 'string' ? httpError.error.mensagem : '';
    const normalized = `${apiMessage} ${httpError.message ?? ''}`.toLowerCase();
    const looksLikeDuplicate = httpError.status === 409
      || (httpError.status === 500 && normalized.includes('cpfCnpj'))
      || normalized.includes('duplic')
      || normalized.includes('cpf')
      || normalized.includes('cnpj');

    if (looksLikeDuplicate) {
      this.setDocumentDuplicateError();
      return true;
    }

    return false;
  }

  private syncPessoaLocally(id: string, fallback: PessoaFormData): void {
    this.pessoaService.getPessoaById(id).pipe(take(1)).subscribe({
      next: (data) => {
        const pessoa: PessoaListItemDto = {
          id: data.id ?? id,
          nome: data.nome,
          email: data.email,
          cpfCnpj: data.cpfCnpj,
          dataCriacao: data.dataCriacao ?? new Date().toISOString()
        };
        this.upsertPessoaLocally(pessoa);
      },
      error: () => {
        this.upsertPessoaLocally(this.buildListItemFromForm(id, fallback));
      }
    });
  }

  private buildListItemFromForm(id: string, data: PessoaFormData): PessoaListItemDto {
    return {
      id,
      nome: data.nome,
      email: data.email,
      cpfCnpj: data.cpfCnpj,
      dataCriacao: new Date().toISOString()
    };
  }

  private upsertPessoaLocally(pessoa: PessoaListItemDto): void {
    const current = this.pessoasResult();
    const pageSize = current?.pageSize ?? this.querySubject.value.pageSize;

    if (!current) {
      this.pessoasResult.set({
        items: [pessoa],
        totalCount: 1,
        pageNumber: 1,
        pageSize,
        totalPages: 1
      });
      return;
    }

    const exists = current.items.some(item => item.id === pessoa.id);
    const updatedItems = [pessoa, ...current.items.filter(item => item.id !== pessoa.id)];
    const trimmedItems = updatedItems.slice(0, pageSize || updatedItems.length);
    const totalCount = exists ? current.totalCount : current.totalCount + 1;
    const totalPages = Math.max(1, Math.ceil(totalCount / (pageSize || 1)));

    this.pessoasResult.set({
      ...current,
      items: trimmedItems,
      totalCount,
      totalPages
    });
  }
}
