import type { Request, Response } from 'express';

jest.mock('prom-client', () => {
  const counters: any[] = [];
  const histograms: any[] = [];
  const registries: any[] = [];

  class Registry {
    public contentType = 'text/plain';
    public registerMetric = jest.fn();
    public metrics = jest.fn().mockResolvedValue('metrics');

    constructor() {
      registries.push(this);
    }
  }

  class Histogram {
    public startTimer = jest.fn(() => jest.fn());

    constructor() {
      histograms.push(this);
    }
  }

  class Counter {
    public inc = jest.fn();

    constructor() {
      counters.push(this);
    }
  }

  const collectDefaultMetrics = jest.fn();

  return {
    __esModule: true,
    default: {
      Registry,
      Histogram,
      Counter,
      collectDefaultMetrics,
      __counters: counters,
      __histograms: histograms,
      __registries: registries
    }
  };
});

const promClient = (jest.requireMock('prom-client') as { default: any }).default;

describe('metrics middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.METRICS_TOKEN;
  });

  it('initializes default metrics only once', async () => {
    const { initMetrics } = await import('../middleware/metrics');

    initMetrics();
    initMetrics();

    expect(promClient.collectDefaultMetrics).toHaveBeenCalledTimes(1);
  });

  it('records metrics on response finish', async () => {
    const { metricsMiddleware } = await import('../middleware/metrics');

    const req = {
      method: 'GET',
      baseUrl: '/api',
      route: { path: '/health' }
    } as unknown as Request;

    let finishHandler: (() => void) | undefined;
    const res = {
      statusCode: 200,
      on: jest.fn((event: string, handler: () => void) => {
        if (event === 'finish') {
          finishHandler = handler;
        }
        return res;
      })
    } as unknown as Response;

    const next = jest.fn();

    metricsMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(finishHandler).toBeDefined();

    finishHandler?.();

    const counter = promClient.__counters[0];
    const histogram = promClient.__histograms[0];
    const timer = histogram.startTimer.mock.results[0]?.value;

    expect(counter.inc).toHaveBeenCalledWith({
      method: 'GET',
      route: '/api/health',
      status_code: '200'
    });
    expect(timer).toHaveBeenCalledWith({
      method: 'GET',
      route: '/api/health',
      status_code: '200'
    });
  });

  it('increments error counter when status is >= 400', async () => {
    const { metricsMiddleware } = await import('../middleware/metrics');

    const req = {
      method: 'POST',
      baseUrl: '/api',
      route: { path: '/login' }
    } as unknown as Request;

    let finishHandler: (() => void) | undefined;
    const res = {
      statusCode: 500,
      on: jest.fn((event: string, handler: () => void) => {
        if (event === 'finish') {
          finishHandler = handler;
        }
        return res;
      })
    } as unknown as Response;

    const next = jest.fn();

    metricsMiddleware(req, res, next);
    finishHandler?.();

    const errorCounter = promClient.__counters[1];
    expect(errorCounter.inc).toHaveBeenCalledWith({
      method: 'POST',
      route: '/api/login',
      status_code: '500'
    });
  });
});

describe('metrics endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.METRICS_TOKEN;
  });

  it('requires token when configured', async () => {
    process.env.METRICS_TOKEN = 'secret';
    const { metricsEndpoint } = await import('../middleware/metrics');

    const req = {
      get: jest.fn().mockReturnValue(undefined)
    } as unknown as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      end: jest.fn()
    } as unknown as Response;

    await metricsEndpoint(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(res.end).not.toHaveBeenCalled();
  });

  it('returns metrics when token is valid', async () => {
    process.env.METRICS_TOKEN = 'secret';
    const { metricsEndpoint } = await import('../middleware/metrics');

    const req = {
      get: jest.fn((header: string) => {
        if (header === 'authorization') {
          return 'Bearer secret';
        }
        return undefined;
      })
    } as unknown as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      end: jest.fn()
    } as unknown as Response;

    await metricsEndpoint(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
    expect(res.end).toHaveBeenCalledWith('metrics');
  });

  it('returns metrics when no token is configured', async () => {
    const { metricsEndpoint } = await import('../middleware/metrics');

    const req = {
      get: jest.fn()
    } as unknown as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      end: jest.fn()
    } as unknown as Response;

    await metricsEndpoint(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
    expect(res.end).toHaveBeenCalledWith('metrics');
  });
});
