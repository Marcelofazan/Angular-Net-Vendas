using Serilog.Context;

namespace exemploAPIVendas.Middleware
{
    public class IdempotencyLoggingMiddleware
    {
        private readonly RequestDelegate _next;

        public IdempotencyLoggingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.Request.Headers.TryGetValue("Idempotency-Key", out var key) && !string.IsNullOrWhiteSpace(key))
            {
                using (LogContext.PushProperty("IdempotencyKey", key.ToString()))
                {
                    await _next(context);
                    return;
                }
            }

            await _next(context);
        }
    }
}
