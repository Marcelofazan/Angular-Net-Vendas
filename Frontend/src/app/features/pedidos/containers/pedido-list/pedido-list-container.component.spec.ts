import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { PedidoListContainerComponent } from './pedido-list-container.component';
import { PedidoService } from '../../services/pedido.service';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { PedidoListItemDto, PagedResult } from '../../../../shared/models/api-models';

describe('PedidoListContainerComponent', () => {
  let pedidoService: jasmine.SpyObj<PedidoService>;
  let feedbackService: jasmine.SpyObj<FeedbackService>;

  const pagedResult: PagedResult<PedidoListItemDto> = {
    items: [
      {
        id: 'pedido-1',
        pessoaNome: 'Cliente Teste',
        dataCriacao: '2024-01-01T10:00:00Z',
        status: 'CRIADO',
        valorTotalPedido: 120.5
      }
    ],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    pedidoService = jasmine.createSpyObj('PedidoService', ['listPedidos']);
    feedbackService = jasmine.createSpyObj('FeedbackService', ['error', 'success', 'info', 'clear']);

    await TestBed.configureTestingModule({
      imports: [PedidoListContainerComponent, RouterTestingModule],
      providers: [
        { provide: PedidoService, useValue: pedidoService },
        { provide: FeedbackService, useValue: feedbackService }
      ]
    }).compileComponents();
  });

  it('should load pedidos on init', () => {
    pedidoService.listPedidos.and.returnValue(of(pagedResult));

    const fixture = TestBed.createComponent(PedidoListContainerComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(pedidoService.listPedidos).toHaveBeenCalledWith(1, 10, null, null);
    expect(component.pagedResult()).toEqual(pagedResult);
    expect(component.isLoading()).toBeFalse();
  });

  it('should navigate to pedido detail when viewPedido is called', async () => {
    pedidoService.listPedidos.and.returnValue(of(pagedResult));

    const fixture = TestBed.createComponent(PedidoListContainerComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    fixture.detectChanges();

    component.viewPedido('pedido-123');

    expect(navigateSpy).toHaveBeenCalledWith(['/pedidos', 'pedido-123']);
  });

  it('should show feedback when loading fails', () => {
    const error = new Error('Falha ao carregar pedidos.');
    pedidoService.listPedidos.and.returnValue(throwError(() => error));

    const fixture = TestBed.createComponent(PedidoListContainerComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(feedbackService.error).toHaveBeenCalledWith(error.message);
    expect(component.isLoading()).toBeFalse();
  });
});