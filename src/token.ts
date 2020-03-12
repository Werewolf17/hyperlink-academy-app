import { ServerResponse, IncomingMessage } from "http";
import cookie from 'cookie'

export function setToken(res:ServerResponse, token:string) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize('loginToken', token, {
      path: '/',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
      httpOnly: true
    })
  );
}

export function getToken(req:IncomingMessage) {
  const cookies = req.headers.cookie
  if (!cookies) return;

  const { loginToken } = cookie.parse(cookies);
  return loginToken;
}

export function removeToken(res:ServerResponse) {
  res.setHeader(
      'Set-Cookie',
      cookie.serialize('loginToken', '', {
        path: '/',
        expires: new Date(Date.now() - 1000),
        httpOnly: false
      })
    );
}
