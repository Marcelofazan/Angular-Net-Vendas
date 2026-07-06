// src/app/features/pedidos/components/produto-search-typeahead/produto-search-typeahead.component.ts

import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged, switchMap, filter, catchError, of, Observable, map, tap } from 'rxjs';

import { ProdutoService } from '../../../produtos/services/produto.service';
import { ProdutoListItemDto, PagedResult, ListProdutosQuery } from '../../../../shared/models/api-models';

@Component({
  selector: 'app-produto-search-typeahead',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="search-container">
      <input 
        type="text" 
        [formControl]="searchControl" 
        placeholder="Buscar produto por nome ou SKU..."
        class="form-control">

      <ul *ngIf="produtos$ | async as produtos" class="suggestions-list">
        <li *ngIf="isLoading" class="suggestion-item loading">Carregando...</li>
        <li *ngIf="!isLoading && produtos.length === 0 && searchControl.value" class="suggestion-item no-results">
            Nenhum produto encontrado.
        </li>
        
        <li *ngFor="let produto of produtos" 
            (click)="selectProduto(produto)" 
            class="suggestion-item">
          {{ produto.nome }} ({{ produto.sku }}) - {{ produto.preco | currency:'BRL' }}
        </li>
      </ul>
    </div>
  `,
  styleUrls: ['./produto-search-typeahead.component.css']
})
export class ProdutoSearchTypeaheadComponent implements OnInit {

  // Controla o input de busca
  searchControl = new FormControl('');
  
  // Observable para os resultados da busca
  produtos$!: Observable<ProdutoListItemDto[]>;
  
  // Estado de carregamento para a UI
  isLoading: boolean = false;

  // Evento emitido quando um produto é selecionado
  @Output() produtoSelected = new EventEmitter<ProdutoListItemDto>();

  constructor(private produtoService: ProdutoService) {}

  ngOnInit(): void {
    this.produtos$ = this.searchControl.valueChanges.pipe(
      // 1. DEBOUNCE: Aguarda 300ms antes de prosseguir
      debounceTime(300),
      
      // 2. DISTINCT: Só prossegue se o valor for diferente do anterior
      distinctUntilChanged(),
      
      // 3. FILTER: Só prossegue se o termo for válido (>= 3 caracteres)
      filter(term => {
        if (!term || term.length < 3) {
          this.isLoading = false;
          // Limpa as sugestões se o termo for inválido
          return false; 
        }
        this.isLoading = true;
        return true;
      }),
      
      // 4. SWITCHMAP: Cancela a requisição anterior e inicia uma nova
      switchMap(term => {
        const query: ListProdutosQuery = {
            pageNumber: 1, 
            pageSize: 5, // Limita o número de resultados
            searchTerm: term || '',
            Ativo: true
        };
        
        // Chama o serviço (endpoint Dapper)
        return this.produtoService.listProdutos(query).pipe(
          catchError(() => of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 5, totalPages: 0 } as PagedResult<ProdutoListItemDto>)), // Falha silenciosa
          map((result: PagedResult<ProdutoListItemDto>) => result.items),
          // Finaliza o carregamento
          tap(() => this.isLoading = false)
        );
      })
    );
  }
  
  // Ação ao selecionar um item
  selectProduto(produto: ProdutoListItemDto): void {
    this.produtoSelected.emit(produto);
    this.searchControl.setValue('', { emitEvent: false }); // Limpa o input sem disparar nova busca
  }
}