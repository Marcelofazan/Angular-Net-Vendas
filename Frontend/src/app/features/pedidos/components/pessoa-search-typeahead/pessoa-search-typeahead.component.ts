import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject, catchError, distinctUntilChanged, finalize, map, of, shareReplay, startWith, switchMap, takeUntil, debounceTime, tap } from 'rxjs';
import { PessoaListItemDto } from '../../../../shared/models/pessoa-models';
import { PessoaService } from '../../../pessoas/services/pessoa.service';

@Component({
  selector: 'app-pessoa-search-typeahead',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="search-container">
      <label for="pessoa-search" class="sr-only">Buscar cliente</label>
      <input
        id="pessoa-search"
        type="text"
        [formControl]="searchControl"
        placeholder="Buscar cliente por nome ou documento..."
        class="form-control"
        autocomplete="off">

      <ng-container *ngIf="pessoas$ | async as pessoas">
        <ul *ngIf="showDropdown" class="suggestions-list">
          <li *ngIf="isLoading" class="suggestion-item loading">Carregando clientes...</li>
          <li *ngIf="!isLoading && pessoas.length === 0 && (searchControl.value ?? '').trim().length >= 3" class="suggestion-item no-results">
            Nenhum cliente encontrado.
          </li>
          <li *ngFor="let pessoa of pessoas" (click)="selectPessoa(pessoa)" class="suggestion-item">
            <span class="pessoa-nome">{{ pessoa.nome }}</span>
            <span class="pessoa-meta">{{ pessoa.cpfCnpj }} · {{ pessoa.email }}</span>
          </li>
        </ul>
      </ng-container>
    </div>
  `,
  styleUrls: ['./pessoa-search-typeahead.component.css']
})
export class PessoaSearchTypeaheadComponent implements OnInit, OnDestroy {
  searchControl = new FormControl('');
  pessoas$!: Observable<PessoaListItemDto[]>;
  isLoading = false;
  showDropdown = false;

  private destroy$ = new Subject<void>();
  private selectedPessoaId: string | null = null;
  private selectedPessoaName = '';

  @Output() pessoaSelected = new EventEmitter<PessoaListItemDto>();
  @Output() pessoaCleared = new EventEmitter<void>();

  constructor(private pessoaService: PessoaService) {}

  ngOnInit(): void {
    const inputChanges$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      takeUntil(this.destroy$)
    );

    inputChanges$.subscribe(value => {
      const typed = (value ?? '').toString();
      if (this.selectedPessoaId && typed !== this.selectedPessoaName) {
        this.selectedPessoaId = null;
        this.selectedPessoaName = '';
        this.pessoaCleared.emit();
      }
    });

    this.pessoas$ = inputChanges$.pipe(
      debounceTime(300),
      map(value => (value ?? '').toString().trim()),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 3) {
          this.isLoading = false;
          this.showDropdown = false;
          return of([] as PessoaListItemDto[]);
        }

        this.isLoading = true;
        this.showDropdown = true;
        return this.pessoaService.listPessoas(1, 5, term).pipe(
          map(result => result.items ?? []),
          catchError(() => of([] as PessoaListItemDto[])),
          finalize(() => this.isLoading = false)
        );
      }),
      tap(results => {
        this.showDropdown = results.length > 0 || this.isLoading;
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  selectPessoa(pessoa: PessoaListItemDto): void {
    this.selectedPessoaId = pessoa.id;
    this.selectedPessoaName = pessoa.nome;
    this.pessoaSelected.emit(pessoa);
    this.searchControl.setValue(pessoa.nome, { emitEvent: false });
    this.showDropdown = false;
  }

  clearSelection(): void {
    this.selectedPessoaId = null;
    this.selectedPessoaName = '';
    this.showDropdown = false;
    this.searchControl.setValue('', { emitEvent: true });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
