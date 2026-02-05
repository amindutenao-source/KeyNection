import type { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestErrorsTotal = new client.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP error responses',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestDurationSeconds);
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestErrorsTotal);

const resolveRouteLabel = (req: Request) => {
  if (req.route?.path) {
    return `${req.baseUrl || ''}${req.route.path}`;
  }
  return 'unmatched';
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = httpRequestDurationSeconds.startTimer();

  res.on('finish', () => {
    const route = resolveRouteLabel(req);
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode)
    };

    start(labels);
    httpRequestsTotal.inc(labels);

    if (res.statusCode >= 400) {
      httpRequestErrorsTotal.inc(labels);
    }
  });

  next();
};

export const metricsEndpoint = async (req: Request, res: Response): Promise<void> => {
  const token = process.env.METRICS_TOKEN;
  if (token) {
    const headerToken =
      req.get('x-metrics-token') || req.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!headerToken || headerToken !== token) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'UNAUTHORIZED'
      });
      return;
    }
  }

  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
};

export { register as metricsRegistry };
