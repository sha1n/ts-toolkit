import { Environment } from '..';
import { createLogger } from '../lib/logger';
import { EchoService } from './EchoService';

const logger = createLogger('demo-flow');

async function configureEnvironment(environment: Environment): Promise<Environment> {
  logger.info('configuring environment services...');

  const serviceA = new EchoService('A');
  const serviceB = new EchoService('B');
  const serviceC = new EchoService('C');
  const serviceD = new EchoService('D');
  const serviceE = new EchoService('E');

  environment.register(serviceC, [serviceA, serviceB]);
  environment.register(serviceE, [serviceC, serviceD]);
  environment.register(serviceD, [serviceC]);
  environment.register(serviceC);

  return environment;
}

export async function main(): Promise<void> {
  const env = new Environment('demo-envr');
  await configureEnvironment(env)
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
