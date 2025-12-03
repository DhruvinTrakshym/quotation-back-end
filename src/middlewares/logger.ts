import morgan from 'morgan';
import { Request } from 'express';
import chalk from 'chalk';

const cleanIp = (ip: string) => {
  if (!ip) return '';
  return ip.replace('::ffff:', '');
};

morgan.token('ip', (req: Request) => {
  const rawIp =
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    '';
  return cleanIp(rawIp);
});

morgan.token('dateTime', () => {
  const now = new Date();
  const formatted =
    `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ` +
    `${now.getHours().toString().padStart(2, '0')}:` +
    `${now.getMinutes().toString().padStart(2, '0')}:` +
    `${now.getSeconds().toString().padStart(2, '0')}`;

  return chalk.gray(formatted);
});

morgan.token('statusColor', (req, res) => {
  const status = res.statusCode;

  if (status >= 500) return chalk.red(status.toString());
  if (status >= 400) return chalk.yellow(status.toString());
  if (status >= 300) return chalk.cyan(status.toString());
  return chalk.green(status.toString());
});

export const logger = morgan((tokens, req, res) => {
  const dateTime = tokens.dateTime(req, res);
  const ip = tokens.ip(req, res);
  const method = chalk.magenta(tokens.method(req, res) || '');
  const url = chalk.blue(tokens.url(req, res) || '');
  const status = tokens.statusColor(req, res);
  const time = chalk.white(tokens['response-time'](req, res) + ' ms');
  const length = chalk.gray(tokens.res(req, res, 'content-length') || '0');

  return `${dateTime} ${chalk.bold(ip)} ${method} ${url} ${status} ${time} - ${length}`;
});
