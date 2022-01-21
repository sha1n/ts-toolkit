import { Environment, EnvironmentContext, Service } from '../';
import { Logger, createLogger } from '../lib/logger';
import { delay } from '@sha1n/about-time';

const logger = createLogger('demo-flow');

interface DemoOptions {
  readonly minSleepTime: number;
  readonly maxSleepTime: number;
}

function randomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomPort() {
  return randomInt(1024, 65535);
}

class DemoService implements Service {
  private logger: Logger;

  constructor(readonly id: string, private opts: DemoOptions) {
    this.logger = createLogger(this.toString());
  }

  toString(): string {
    return `service-${this.id}`;
  }

  async start(ctx: EnvironmentContext): Promise<unknown> {
    this.logger.info(`start called with context of env: ${ctx.name}`);
    this.logger.info(
      `available services: ${Array.from(ctx.services.values())
        .map(s => s.meta)
        .join(', ')}`
    );

    this.logger.info(`staring ${this.toString()}...`);
    await this.delayAndLog('started');

    const port = randomPort();
    return {
      host: this.toString(),
      port: port,
      toString: () => {
        return `protocol://${this.toString()}:${port}`;
      }
    };
  }
  async stop(ctx: EnvironmentContext): Promise<void> {
    this.logger.info(`stop called with context of env: ${ctx.name}`);
    this.logger.info(`stopping ${this.toString()}...`);
    await this.delayAndLog('stopped');
  }

  async delayAndLog(action: 'started' | 'stopped'): Promise<void> {
    const t = randomInt(this.opts.minSleepTime, this.opts.maxSleepTime);
    await delay(() => this.logger.info(`${this.toString()} ${action}`), t);
  }
}

async function configureEnvironment(environment: Environment, opts: DemoOptions): Promise<Environment> {
  logger.info('configuring environment services...');

  const serviceA = new DemoService('a', opts);
  const serviceB = new DemoService('b', opts);
  const serviceC = new DemoService('c', opts);
  const serviceD = new DemoService('d', opts);
  const serviceE = new DemoService('e', opts);

  environment.register(serviceC, serviceA, serviceB);
  environment.register(serviceE, serviceC, serviceD);
  environment.register(serviceD, serviceC);
  environment.register(serviceC);

  return environment;
}

export async function main(opts: DemoOptions = { minSleepTime: 0, maxSleepTime: 50 }): Promise<void> {
  const env = new Environment('demo-envr');
  await configureEnvironment(env, opts)
    .then(env => {
      logger.info('starting environment...');
      return env.start();
    })
    .then(ctx => {
      logger.info('environment started');
      logger.info(
        `environment services: ${Array.from(ctx.services.values())
          .map(s => s.meta)
          .join(', ')}`
      );
    })
    .then(() => {
      logger.info('stopping environment...');
      return env.stop();
    })
    .then(() => {
      logger.info('environment stopped');
    })
    .catch(logger.error);
}
