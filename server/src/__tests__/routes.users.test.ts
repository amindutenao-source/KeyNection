import type { Request, Response, NextFunction } from 'express';

const validateMock = jest.fn((schema?: any) => (_req: any, _res: any, next: any) => next());
const validate = (schema: any) => validateMock(schema);

jest.mock('../middleware/validation', () => ({
  validate: (schema: any) => validate(schema),
  userSchemas: {
    adminUpdate: 'admin-update',
    update: 'user-update'
  }
}));

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user-1',
      role: req.headers['x-role'] || 'OWNER'
    };
    next();
  },
  requireAdmin: (_req: any, _res: any, next: any) => next()
}));

const controllerMock = {
  getUsers: jest.fn((_req: any, res: any) => res.json({ success: true, data: [] })),
  getUserById: jest.fn((_req: any, res: any) => res.json({ success: true, data: { id: 'user-1' } })),
  updateUser: jest.fn((_req: any, res: any) => res.json({ success: true, data: { id: 'user-1' } })),
  deleteUser: jest.fn((_req: any, res: any) => res.json({ success: true }))
};

jest.mock('../controllers/userController', () => ({
  UserController: controllerMock
}));

const getHandler = async (method: string, path: string, stackIndex = -1) => {
  const { default: usersRoutes } = await import('../routes/users');
  const layer = usersRoutes.stack.find(
    (item: any) => item.route?.path === path && item.route.methods[method]
  );
  if (!layer || !layer.route) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }
  const index = stackIndex === -1 ? layer.route.stack.length - 1 : stackIndex;
  return layer.route.stack[index].handle as (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void> | void;
};

const createRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  } as unknown as Response;

  return res;
};

describe('users routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists users', async () => {
    const handler = await getHandler('get', '/');
    const req = { headers: {} } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    expect(controllerMock.getUsers).toHaveBeenCalled();
  });

  it('gets user by id', async () => {
    const handler = await getHandler('get', '/:id');
    const req = { params: { id: 'user-1' }, headers: {} } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    expect(controllerMock.getUserById).toHaveBeenCalled();
  });

  it('uses admin schema for admin updates', async () => {
    const handler = await getHandler('put', '/:id', 1);
    const req = {
      params: { id: 'user-1' },
      headers: { 'x-role': 'ADMIN' },
      user: { role: 'ADMIN' },
      body: { status: 'ACTIVE' }
    } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(validateMock).toHaveBeenCalledWith('admin-update');
  });

  it('uses default schema for non-admin updates', async () => {
    const handler = await getHandler('put', '/:id', 1);
    const req = {
      params: { id: 'user-1' },
      headers: { 'x-role': 'OWNER' },
      user: { role: 'OWNER' },
      body: { firstName: 'Test' }
    } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(validateMock).toHaveBeenCalledWith('user-update');
  });

  it('deletes user', async () => {
    const handler = await getHandler('delete', '/:id');
    const req = { params: { id: 'user-1' }, headers: {} } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    expect(controllerMock.deleteUser).toHaveBeenCalled();
  });
});
