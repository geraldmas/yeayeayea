process.env.JWT_SECRET = 'test';
process.env.REACT_APP_SUPABASE_URL = 'http://localhost';
process.env.REACT_APP_SUPABASE_ANON_KEY = 'anon';

import { authenticateToken, requireAdmin } from '../../server/auth';
import jwt from 'jsonwebtoken';

describe('auth middleware', () => {
  it('rejects when token missing', () => {
    const req: any = { headers: {} };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects when token invalid', () => {
    jest.spyOn(jwt as any, 'verify').mockImplementation((t: any, s: any, cb: any) => cb(new Error('bad')));
    const req: any = { headers: { authorization: 'Bearer x' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('passes when admin', () => {
    const req: any = { user: { isAdmin: true } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
