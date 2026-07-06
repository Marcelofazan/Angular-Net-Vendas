// src/app/features/produtos/components/produto-list-container/produto-list-container.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest, Observable, switchMap, startWith, map, tap, catchError, of } from 'rxjs';

import { ProdutoService } from '../../services/produto.service'; 
import { ProdutoListComponent } from '../produto-list/produto-list.component'; // Componente Dumb
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component'; // Componente compartilhado
import { PagedResult, ProdutoListItemDto, ListProdutosQuery } from '../../../../shared/models/api-models';
import { ProdutoTableComponent } from '../../../../shared/components/produto-table/produto-table.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

// Interface para o estado da UI
interface ProdutoListViewState {
  produtosResult: PagedResult<ProdutoListItemDto> | null;
  loading: boolean;
  error: any;
}

@Component({
  selector: 'app-produto-list-container',
  standalone: true,
  imports: [CommonModule, FilterBarComponent, ProdutoTableComponent, PaginationComponent], 
  template: `
    <div class="produto-container">
      <div class="header-section">
        <h2>Catálogo de Produtos</h2>
      </div>

      <app-filter-bar (filtersChanged)="onFiltersChanged($event)"></app-filter-bar>

      <ng-container *ngIf="viewState$ | async as viewState">
        <div *ngIf="viewState.loading" class="loading">Carregando produtos...</div>
        <div *ngIf="viewState.error" class="error">Erro: {{ viewState.error | json }}</div>

        <ng-container *ngIf="viewState.produtosResult && !viewState.loading">
          <div class="results-summary">
            {{ viewState.produtosResult.totalCount || 0 }} itens encontrados
          </div>
          <app-produto-table [produtos]="viewState.produtosResult.items"></app-produto-table>
          
          <app-pagination
            [totalPages]="viewState.produtosResult.totalPages"
            [currentPage]="viewState.produtosResult.pageNumber"
            (pageChange)="onPageChanged($event)">
          </app-pagination>
        </ng-container>
      </ng-container>
    </div>
  `,
  styleUrl: './produto-list-container.component.css'
})
export class ProdutoListContainerComponent implements OnInit {

  // BehaviorSubject para gerenciar o estado da QUERY
  private queryParamsSubject = new BehaviorSubject<ListProdutosQuery>({
    pageNumber: 1,
    pageSize: 10,
    searchTerm: '',
    orderBy: 'nome',
    sortDirection: 'asc',
    Ativo: true
  });
  
  // Observable que armazena o estado completo da tela (dados, loading, erro)
  viewState$!: Observable<ProdutoListViewState>;

  constructor(private produtoService: ProdutoService) {}

  ngOnInit(): void {
    this.viewState$ = this.queryParamsSubject.pipe(
      // 1. Faz a chamada à API (endpoint Dapper)
      switchMap(query => 
        this.produtoService.listProdutos(query).pipe(
          // 3. Mapeia a resposta de sucesso
          map(result => ({ 
            produtosResult: result, 
            loading: false, 
            error: null 
          })),
          // 4. Mapeia erros da API (capturados pelo Interceptor)
          catchError(error => {
            return of({ 
              produtosResult: null, 
              loading: false, 
              error: error 
            });
          })
        )
      ),
      // Estado inicial antes da primeira requisição
      startWith({ produtosResult: null, loading: true, error: null } as ProdutoListViewState)
    );
  }

  // Ações de Usuário

  onFiltersChanged(filters: { searchTerm?: string; orderBy?: string; sortDirection?: string; status?: string }): void {
    const nextQuery: ListProdutosQuery = {
      ...this.queryParamsSubject.value,
      searchTerm: filters.searchTerm ?? this.queryParamsSubject.value.searchTerm ?? '',
      orderBy: filters.orderBy ?? this.queryParamsSubject.value.orderBy ?? 'nome',
      sortDirection: (filters.sortDirection as 'asc' | 'desc') ?? this.queryParamsSubject.value.sortDirection ?? 'asc',
      pageNumber: 1
    };

    const status = filters.status;
    if (status === 'all') {
      nextQuery.Ativo = undefined;
      nextQuery.skipIsActiveDefault = true;
    } else if (status === 'inactive') {
      nextQuery.Ativo = false;
      delete nextQuery.skipIsActiveDefault;
    } else if (status === 'active' || !status) {
      nextQuery.Ativo = true;
      delete nextQuery.skipIsActiveDefault;
    }

    this.queryParamsSubject.next(nextQuery);
  }

  onPageChanged(pageNumber: number): void {
    // Altera apenas o número da página
    this.queryParamsSubject.next({
      ...this.queryParamsSubject.value,
      pageNumber: pageNumber
    });
  }

  onEditProduto(produtoId: string): void {
    // Lógica para navegação ou abertura de modal de edição
    console.log('Editar produto ID:', produtoId);
    // this.router.navigate(['/produtos/edit', produtoId]);
  }
}