using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.DTOs
{
    public record ApiResponse<T>(int cod_retorno, string? mensagem, T? data);
}
