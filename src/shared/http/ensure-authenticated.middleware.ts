import type { Request, Response, NextFunction } from 'express'
import { auth } from '../auth/auth.ts'
import { fromNodeHeaders } from 'better-auth/node'

export type AuthLocals = { userId: string }

export async function ensureAuthenticated(
  req: Request,
  res: Response<unknown, AuthLocals>,
  next: NextFunction,
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })

  if (!session) {
    res
      .status(401)
      .json({ code: 'UNAUTHORIZED', message: 'You need to be logged in' })
    return
  }

  res.locals.userId = session.user.id // Evita mexer no tipo global

  next()
}
