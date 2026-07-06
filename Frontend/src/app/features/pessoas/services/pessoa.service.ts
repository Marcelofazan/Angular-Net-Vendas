import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, map, of, catchError, throwError } from 'rxjs';
import { PagedResult, ApiResponse } from '../../../shared/models/api-models';
import { PessoaListItemDto, PessoaFormData } from '../../../shared/models/pessoa-models';

export type PessoaSortField = 'nome' | 'email' | 'cpfCnpj' | 'dataCriacao';
export type SortDirection = 'asc' | 'desc';

export interface PessoaListFilters {
  sortField?: PessoaSortField;
  sortDirection?: SortDirection;
  email?: string;
  cpfCnpj?: string;
  createdFrom?: string;
  createdTo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PessoaService {
  private apiUrl = '/api/pessoas';
  private advancedFiltersSupported = true;

  constructor(private http: HttpClient) {}

  listPessoas(
    pageNumber: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    filters?: PessoaListFilters
  ): Observable<PagedResult<PessoaListItemDto>> {
    const shouldUseAdvanced = this.advancedFiltersSupported && this.hasAdvancedFilters(filters);
    const params = this.buildListParams(pageNumber, pageSize, searchTerm, filters, shouldUseAdvanced);
    const fallbackParams = shouldUseAdvanced
      ? this.buildListParams(pageNumber, pageSize, searchTerm, undefined, false)
      : params;

    const listRequest$ = this.requestPessoas(params, pageNumber, pageSize);

    if (!shouldUseAdvanced) {
      return listRequest$;
    }

    return listRequest$.pipe(
      catchError(err => {
        if (this.isRecoverableListError(err)) {
          this.advancedFiltersSupported = false;
          console.warn('[PessoaService] Advanced filters unsupported by API. Falling back to basic query.', err);
          return this.requestPessoas(fallbackParams, pageNumber, pageSize);
        }
        return throwError(() => err);
      })
    );
  }

  getPessoaById(id: string): Observable<PessoaListItemDto> {
    return this.http.get<ApiResponse<PessoaListItemDto>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data!)
    );
  }

  createPessoa(command: PessoaFormData): Observable<string> {
    return this.http.post<ApiResponse<string>>(this.apiUrl, command).pipe(
      map(response => response.data!)
    );
  }

  updatePessoa(id: string, command: PessoaFormData): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${id}`, command).pipe(
      map(() => undefined)
    );
  }

  deletePessoa(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(() => undefined)
    );
  }

  isDocumentAvailable(cpfCnpj: string, excludePessoaId?: string): Observable<boolean> {
    const normalizedDocument = this.normalizeDocument(cpfCnpj);
    if (!normalizedDocument) {
      return of(false);
    }

    return this.listPessoas(1, 25, normalizedDocument).pipe(
      map(result => {
        const existing = result.items.find(item => this.normalizeDocument(item.cpfCnpj) === normalizedDocument);
        if (!existing) {
          return true;
        }

        if (excludePessoaId && existing.id === excludePessoaId) {
          return true;
        }

        return false;
      }),
      catchError(() => of(true))
    );
  }

  private normalizeDocument(value: string): string {
    return (value ?? '').replace(/\D+/g, '');
  }

  private hasAdvancedFilters(filters?: PessoaListFilters): boolean {
    if (!filters) {
      return false;
    }

    return Boolean(
      filters.sortField ||
      filters.sortDirection ||
      (filters.email ?? '').trim() ||
      (filters.cpfCnpj ?? '').trim() ||
      filters.createdFrom ||
      filters.createdTo
    );
  }

  private buildListParams(
    pageNumber: number,
    pageSize: number,
    searchTerm?: string,
    filters?: PessoaListFilters,
    includeAdvanced = true
  ): HttpParams {
    let params = new HttpParams()
      .set('PageNumber', pageNumber.toString())
      .set('PageSize', pageSize.toString());

    const trimmedSearch = (searchTerm ?? '').trim();
    if (trimmedSearch) {
      params = params.set('SearchTerm', trimmedSearch);
    }

    if (!includeAdvanced || !filters) {
      return params;
    }

    if (filters.sortField) {
      params = params.set('SortField', filters.sortField);
    }

    if (filters.sortDirection) {
      params = params.set('SortDirection', filters.sortDirection);
    }

    const trimmedEmail = (filters.email ?? '').trim();
    if (trimmedEmail) {
      params = params.set('Email', trimmedEmail);
    }

    const normalizedDocument = this.normalizeDocument(filters.cpfCnpj ?? '');
    if (normalizedDocument) {
      params = params.set('CpfCnpj', normalizedDocument);
    }

    if (filters.createdFrom) {
      params = params.set('CreatedFrom', filters.createdFrom);
    }

    if (filters.createdTo) {
      params = params.set('CreatedTo', filters.createdTo);
    }

    return params;
  }

  private requestPessoas(params: HttpParams, pageNumber: number, pageSize: number): Observable<PagedResult<PessoaListItemDto>> {
    return this.http.get<ApiResponse<PagedResult<PessoaListItemDto>>>(this.apiUrl, { params }).pipe(
      map(response => {
        const payload = response.data ?? {} as PagedResult<PessoaListItemDto>;
        const items = payload.items ?? [];
        const totalCount = payload.totalCount ?? items.length;
        const pageSizeValue = payload.pageSize ?? pageSize;
        const pageNumberValue = payload.pageNumber ?? pageNumber;
        const totalPages = payload.totalPages ?? Math.max(1, Math.ceil(totalCount / (pageSizeValue || 1)));

        return {
          ...payload,
          items,
          totalCount,
          pageSize: pageSizeValue,
          pageNumber: pageNumberValue,
          totalPages
        };
      })
    );
  }

  private isRecoverableListError(err: any): err is HttpErrorResponse {
    return err instanceof HttpErrorResponse && (err.status === 400 || err.status >= 500);
  }
}
